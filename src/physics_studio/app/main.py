from __future__ import annotations

import argparse
import tempfile
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets

from physics_studio.authoring.commands import (
    AddBody,
    AddCameraKeyframe,
    CommandManager,
    DeleteCameraKeyframe,
    MoveBody,
    UpdateCameraKeyframe,
)
from physics_studio.authoring.validation import validate_scenario
from physics_studio.core.run.simulator import run_simulation
from physics_studio.render.sampling import sample_index
from physics_studio.render.export import RenderJob, render_video
from physics_studio.render.presets import PRESETS
from physics_studio.scenario.io import load_scenario, save_scenario
from physics_studio.scenario.models import CameraKeyframe, Particle, Scenario, ScenarioSettings
from physics_studio.app.viewport import ViewportWidget
from physics_studio.app.playback import (
    advance_playback_time,
    select_preview_positions,
    should_run_simulation,
    status_label,
)


class MainWindow(QtWidgets.QMainWindow):
    def __init__(self, scenario_path: Path | None = None) -> None:
        super().__init__()
        self.setWindowTitle("Physics Simulation Studio")
        self.resize(1000, 600)

        self._scenario_path = scenario_path
        scenario = load_scenario(scenario_path) if scenario_path else self._new_scenario()
        self._manager = CommandManager(scenario)
        self._manager.add_listener(self._refresh_ui)
        self._selected_body_id: str | None = None
        self._preview_positions: dict[str, tuple[float, float, float]] = {}
        self._drag_start_positions: dict[str, tuple[float, float, float]] = {}
        self._trajectory = None
        self._scrub_time_s = 0.0
        self._scrub_positions: dict[str, tuple[float, float, float]] = {}
        self._keyframe_updating = False
        self._needs_simulation = True
        self._is_simulating = False
        self._playback_timer = QtCore.QTimer(self)
        self._playback_timer.timeout.connect(self._on_playback_tick)
        self._playback_time_s = 0.0
        self._playback_speed = 0.25
        self._sim_thread: QtCore.QThread | None = None
        self._sim_worker: _SimulationWorker | None = None
        self._auto_play_on_sim_complete = False

        self._build_ui()
        self._refresh_ui(self._manager.scenario)

    def _build_ui(self) -> None:
        splitter = QtWidgets.QSplitter(QtCore.Qt.Horizontal)

        left_panel = QtWidgets.QWidget()
        left_layout = QtWidgets.QVBoxLayout(left_panel)

        self._outliner = QtWidgets.QListWidget()
        self._outliner.setMinimumWidth(220)
        self._outliner.itemSelectionChanged.connect(self._on_outliner_selection)
        left_layout.addWidget(QtWidgets.QLabel("Objects"))
        left_layout.addWidget(self._outliner, stretch=1)

        left_layout.addWidget(QtWidgets.QLabel("Validation"))
        self._validation_list = QtWidgets.QListWidget()
        self._validation_list.setMinimumHeight(120)
        left_layout.addWidget(self._validation_list)

        left_layout.addWidget(QtWidgets.QLabel("Camera Keyframes"))
        self._keyframe_table = QtWidgets.QTableWidget()
        self._keyframe_table.setColumnCount(8)
        self._keyframe_table.setHorizontalHeaderLabels(
            ["Time", "Pos X", "Pos Y", "Pos Z", "Tgt X", "Tgt Y", "Tgt Z", "FOV"]
        )
        self._keyframe_table.horizontalHeader().setStretchLastSection(True)
        self._keyframe_table.verticalHeader().setVisible(False)
        self._keyframe_table.cellChanged.connect(self._on_keyframe_cell_changed)
        left_layout.addWidget(self._keyframe_table, stretch=1)

        keyframe_buttons = QtWidgets.QHBoxLayout()
        add_keyframe = QtWidgets.QPushButton("Add Keyframe")
        add_keyframe.clicked.connect(self._add_keyframe)
        delete_keyframe = QtWidgets.QPushButton("Delete Keyframe")
        delete_keyframe.clicked.connect(self._delete_keyframe)
        keyframe_buttons.addWidget(add_keyframe)
        keyframe_buttons.addWidget(delete_keyframe)
        left_layout.addLayout(keyframe_buttons)

        self._dev_mode_checkbox = QtWidgets.QCheckBox("Developer Mode")
        self._dev_mode_checkbox.stateChanged.connect(self._toggle_developer_mode)
        left_layout.addWidget(self._dev_mode_checkbox)
        self._debug_label = QtWidgets.QLabel()
        self._debug_label.setWordWrap(True)
        self._debug_label.setMinimumHeight(120)
        self._debug_label.setVisible(False)
        left_layout.addWidget(self._debug_label)

        viewport = ViewportWidget()
        viewport.body_selected.connect(self._on_viewport_selected)
        viewport.drag_started.connect(self._on_drag_started)
        viewport.drag_updated.connect(self._on_drag_updated)
        viewport.drag_finished.connect(self._on_drag_finished)
        self._viewport = viewport

        splitter.addWidget(left_panel)
        splitter.addWidget(viewport)
        splitter.setStretchFactor(1, 1)

        container = QtWidgets.QWidget()
        layout = QtWidgets.QVBoxLayout(container)
        layout.addWidget(splitter)

        timeline_bar = QtWidgets.QWidget()
        timeline_layout = QtWidgets.QHBoxLayout(timeline_bar)
        self._timeline_slider = QtWidgets.QSlider(QtCore.Qt.Horizontal)
        self._timeline_slider.valueChanged.connect(self._on_timeline_changed)
        self._timeline_label = QtWidgets.QLabel("t=0.00s")
        self._status_label = QtWidgets.QLabel("Needs simulation")
        self._play_button = QtWidgets.QPushButton("Play")
        self._play_button.clicked.connect(self._toggle_playback)
        self._speed_label = QtWidgets.QLabel("Playback Speed")
        self._speed_slider = QtWidgets.QSlider(QtCore.Qt.Horizontal)
        self._speed_slider.setMinimum(5)
        self._speed_slider.setMaximum(500)
        self._speed_slider.setValue(25)
        self._speed_slider.valueChanged.connect(self._on_speed_changed)
        self._speed_value = QtWidgets.QLabel("0.25×")
        timeline_layout.addWidget(self._timeline_slider, stretch=1)
        timeline_layout.addWidget(self._timeline_label)
        timeline_layout.addWidget(self._status_label)
        timeline_layout.addWidget(self._speed_label)
        timeline_layout.addWidget(self._speed_slider)
        timeline_layout.addWidget(self._speed_value)
        timeline_layout.addWidget(self._play_button)
        layout.addWidget(timeline_bar)

        self.setCentralWidget(container)
        self._build_actions()

    def _build_actions(self) -> None:
        menu = self.menuBar()
        file_menu = menu.addMenu("&File")
        edit_menu = menu.addMenu("&Edit")
        create_menu = menu.addMenu("&Create")

        self._undo_action = QtGui.QAction("Undo", self)
        self._undo_action.setShortcut(QtGui.QKeySequence.Undo)
        self._undo_action.triggered.connect(self._manager.undo)

        self._redo_action = QtGui.QAction("Redo", self)
        self._redo_action.setShortcut(QtGui.QKeySequence.Redo)
        self._redo_action.triggered.connect(self._manager.redo)

        add_body_action = QtGui.QAction("Add Body", self)
        add_body_action.triggered.connect(self._add_body)

        self._run_sim_action = QtGui.QAction("Run Simulation", self)
        self._run_sim_action.triggered.connect(self._run_simulation)

        export_action = QtGui.QAction("Export Video", self)
        export_action.triggered.connect(self._export_video)

        file_menu.addAction(export_action)
        edit_menu.addAction(self._undo_action)
        edit_menu.addAction(self._redo_action)
        create_menu.addAction(add_body_action)
        create_menu.addAction(self._run_sim_action)

    def _new_scenario(self) -> Scenario:
        return Scenario(version=1, settings=ScenarioSettings(dt=1.0, steps=100))

    def _add_body(self) -> None:
        body_id = self._next_body_id()
        body = Particle(
            id=body_id,
            name=body_id,
            mass=1.0,
            position=(0.0, 0.0, 0.0),
            velocity=(0.0, 0.0, 0.0),
        )
        self._manager.apply(AddBody(body))

    def _next_body_id(self) -> str:
        existing = {body.id for body in self._manager.scenario.particles}
        existing.update({body.id for body in self._manager.scenario.rigid_bodies})
        index = 1
        while f"body_{index}" in existing:
            index += 1
        return f"body_{index}"

    def _refresh_ui(self, scenario: Scenario) -> None:
        self._invalidate_simulation()
        self._outliner.clear()
        for particle in scenario.particles:
            item = QtWidgets.QListWidgetItem(f"Particle: {particle.name} ({particle.id})")
            item.setData(QtCore.Qt.UserRole, particle.id)
            self._outliner.addItem(item)
        for body in scenario.rigid_bodies:
            item = QtWidgets.QListWidgetItem(f"RigidBody: {body.name} ({body.id})")
            item.setData(QtCore.Qt.UserRole, body.id)
            self._outliner.addItem(item)
        self._refresh_validation(scenario)
        self._undo_action.setEnabled(self._manager.can_undo())
        self._redo_action.setEnabled(self._manager.can_redo())
        self._sync_selection()
        self._refresh_keyframes(scenario)
        self._update_scrub_positions()
        camera_state = scenario.camera_track.evaluate(self._scrub_time_s)
        self._viewport.set_scene(
            scenario,
            self._selected_body_id,
            self._compose_preview_positions(),
            camera_state,
        )
        self._update_debug_panel()

    def _refresh_validation(self, scenario: Scenario) -> None:
        self._validation_list.clear()
        issues = validate_scenario(scenario)
        if not issues:
            self._validation_list.addItem("No issues")
            return
        for issue in issues:
            self._validation_list.addItem(f"[{issue.severity}] {issue.path}: {issue.message}")

    def _sync_selection(self) -> None:
        for index in range(self._outliner.count()):
            item = self._outliner.item(index)
            if item.data(QtCore.Qt.UserRole) == self._selected_body_id:
                self._outliner.setCurrentItem(item)
                return
        self._outliner.setCurrentItem(None)

    def _on_outliner_selection(self) -> None:
        item = self._outliner.currentItem()
        if item:
            self._selected_body_id = item.data(QtCore.Qt.UserRole)
        else:
            self._selected_body_id = None
        camera_state = self._manager.scenario.camera_track.evaluate(self._scrub_time_s)
        self._viewport.set_scene(
            self._manager.scenario,
            self._selected_body_id,
            self._compose_preview_positions(),
            camera_state,
        )

    def _on_viewport_selected(self, body_id: str | None) -> None:
        self._selected_body_id = body_id
        self._sync_selection()

    def _on_drag_started(self, body_id: str) -> None:
        body = self._find_body(body_id)
        if body:
            self._drag_start_positions[body_id] = body.position

    def _on_drag_updated(self, body_id: str, world_pos: tuple[float, float, float]) -> None:
        start_pos = self._drag_start_positions.get(body_id)
        if start_pos:
            world_pos = (world_pos[0], world_pos[1], start_pos[2])
        self._preview_positions[body_id] = world_pos
        camera_state = self._manager.scenario.camera_track.evaluate(self._scrub_time_s)
        self._viewport.set_scene(
            self._manager.scenario,
            self._selected_body_id,
            self._compose_preview_positions(),
            camera_state,
        )

    def _on_drag_finished(self, body_id: str, world_pos: tuple[float, float, float]) -> None:
        start_pos = self._drag_start_positions.pop(body_id, None)
        self._preview_positions.pop(body_id, None)
        if start_pos is None:
            return
        final_pos = (world_pos[0], world_pos[1], start_pos[2])
        if start_pos != final_pos:
            self._manager.apply(MoveBody(body_id, final_pos))
        else:
            camera_state = self._manager.scenario.camera_track.evaluate(self._scrub_time_s)
            self._viewport.set_scene(
                self._manager.scenario,
                self._selected_body_id,
                self._compose_preview_positions(),
                camera_state,
            )

    def _find_body(self, body_id: str) -> Particle | None:
        for body in self._manager.scenario.particles + self._manager.scenario.rigid_bodies:
            if body.id == body_id:
                return body
        return None

    def _compose_preview_positions(self) -> dict[str, tuple[float, float, float]]:
        merged = dict(self._scrub_positions)
        merged.update(self._preview_positions)
        return merged

    def _current_sample_every(self) -> int:
        sample_every = self._manager.scenario.metadata.get("sample_every", 1)
        if not isinstance(sample_every, int) or sample_every < 1:
            return 1
        return sample_every

    def _update_debug_panel(self) -> None:
        dt = self._manager.scenario.settings.dt
        sample_every = self._current_sample_every()
        num_samples = len(self._trajectory.times) if self._trajectory else 0
        idx = sample_index(self._scrub_time_s, dt, sample_every, num_samples)
        body_ids = self._trajectory.body_ids if self._trajectory else []
        body_id = self._selected_body_id or (body_ids[0] if body_ids else None)
        scenario_pos = None
        trajectory_pos = None
        if body_id:
            body = self._find_body(body_id)
            if body:
                scenario_pos = body.position
            if self._trajectory and body_id in body_ids:
                body_index = body_ids.index(body_id)
                trajectory_pos = tuple(self._trajectory.positions[idx][body_index])
        lines = [
            f"Status: {status_label(self._needs_simulation, self._is_simulating, self._playback_timer.isActive())}",
            f"time_s: {self._scrub_time_s:0.3f}",
            f"idx: {idx}",
            f"dt: {dt}, sample_every: {sample_every}, num_samples: {num_samples}",
            f"body_order: {body_ids}",
            f"selected: {body_id}",
            f"scenario_pos: {scenario_pos}",
            f"trajectory_pos: {trajectory_pos}",
        ]
        self._debug_label.setText("\n".join(lines))

    def _on_timeline_changed(self, value: int) -> None:
        dt = self._manager.scenario.settings.dt
        self._set_time(value * dt, update_slider=False)

    def _refresh_keyframes(self, scenario: Scenario) -> None:
        self._keyframe_updating = True
        self._keyframe_table.setRowCount(len(scenario.camera_track.keyframes))
        for row, keyframe in enumerate(scenario.camera_track.keyframes):
            values = [
                keyframe.time_s,
                keyframe.position[0],
                keyframe.position[1],
                keyframe.position[2],
                keyframe.target[0],
                keyframe.target[1],
                keyframe.target[2],
                keyframe.fov_deg if keyframe.fov_deg is not None else "",
            ]
            for col, value in enumerate(values):
                item = QtWidgets.QTableWidgetItem(str(value))
                self._keyframe_table.setItem(row, col, item)
        self._keyframe_updating = False

    def _add_keyframe(self) -> None:
        camera_state = self._manager.scenario.camera_track.evaluate(self._scrub_time_s)
        keyframe = CameraKeyframe(
            time_s=self._scrub_time_s,
            position=camera_state.position,
            target=camera_state.target,
            fov_deg=camera_state.fov_deg,
        )
        self._manager.apply(AddCameraKeyframe(keyframe))

    def _delete_keyframe(self) -> None:
        row = self._keyframe_table.currentRow()
        if row >= 0:
            self._manager.apply(DeleteCameraKeyframe(row))

    def _on_keyframe_cell_changed(self, row: int, column: int) -> None:
        if self._keyframe_updating:
            return
        item = self._keyframe_table.item(row, column)
        if item is None:
            return
        text = item.text()
        if text == "":
            value = None
        else:
            try:
                value = float(text)
            except ValueError:
                return
        field_map = {
            0: "time_s",
            1: "position.0",
            2: "position.1",
            3: "position.2",
            4: "target.0",
            5: "target.1",
            6: "target.2",
            7: "fov_deg",
        }
        field_path = field_map.get(column)
        if not field_path:
            return
        self._manager.apply(UpdateCameraKeyframe(row, field_path, value))

    def _export_video(self) -> None:
        scenario = self._manager.scenario
        output_path, _ = QtWidgets.QFileDialog.getSaveFileName(
            self, "Export Video", "", "MP4 Files (*.mp4)"
        )
        if not output_path:
            return
        preset_name, ok = QtWidgets.QInputDialog.getItem(
            self, "Render Preset", "Preset", list(PRESETS.keys()), 0, False
        )
        if not ok:
            return
        preset = PRESETS[preset_name]
        duration_s, ok = QtWidgets.QInputDialog.getDouble(
            self,
            "Duration (s)",
            "Duration",
            scenario.settings.dt * scenario.settings.steps,
            0.1,
            36000.0,
            2,
        )
        if not ok:
            return
        if self._scenario_path:
            scenario_path = self._scenario_path
        else:
            temp_dir = Path(tempfile.gettempdir())
            scenario_path = temp_dir / "physics_studio_temp_scenario.json"
            save_scenario(self._manager.scenario, scenario_path)
        job = RenderJob(
            scenario_path=scenario_path,
            output_path=Path(output_path),
            duration_s=duration_s,
            fps=preset.fps,
            width=preset.width,
            height=preset.height,
            bitrate=preset.bitrate,
        )
        render_video(job)

    def _set_time(self, time_s: float, update_slider: bool = True) -> None:
        duration_s = self._manager.scenario.settings.dt * self._manager.scenario.settings.steps
        self._scrub_time_s = max(0.0, min(time_s, duration_s))
        self._playback_time_s = self._scrub_time_s
        self._timeline_label.setText(f"t={self._scrub_time_s:0.2f}s")
        if update_slider:
            dt = self._manager.scenario.settings.dt
            if dt > 0:
                value = int(round(self._scrub_time_s / dt))
                self._timeline_slider.blockSignals(True)
                self._timeline_slider.setValue(value)
                self._timeline_slider.blockSignals(False)
        self._update_scrub_positions()
        camera_state = self._manager.scenario.camera_track.evaluate(self._scrub_time_s)
        self._viewport.set_scene(
            self._manager.scenario,
            self._selected_body_id,
            self._compose_preview_positions(),
            camera_state,
        )
        self._update_debug_panel()
        self._update_status_label()

    def _update_status_label(self) -> None:
        label = status_label(
            self._needs_simulation, self._is_simulating, self._playback_timer.isActive()
        )
        self._status_label.setText(label)

    def _invalidate_simulation(self) -> None:
        self._trajectory = None
        self._needs_simulation = True
        self._is_simulating = False
        if self._playback_timer.isActive():
            self._playback_timer.stop()
            self._play_button.setText("Play")
        steps = self._manager.scenario.settings.steps
        dt = self._manager.scenario.settings.dt
        self._timeline_slider.setMinimum(0)
        self._timeline_slider.setMaximum(steps)
        self._timeline_slider.setSingleStep(1)
        duration_s = dt * steps
        if self._scrub_time_s > duration_s:
            self._scrub_time_s = duration_s
            self._playback_time_s = duration_s
        self._timeline_label.setText(f"t={self._scrub_time_s:0.2f}s")
        self._update_status_label()

    def _update_scrub_positions(self) -> None:
        scenario_positions = {
            body.id: body.position
            for body in self._manager.scenario.particles + self._manager.scenario.rigid_bodies
        }
        trajectory_positions: dict[str, tuple[float, float, float]] = {}
        if self._trajectory is not None:
            sample_every = self._current_sample_every()
            num_samples = len(self._trajectory.times)
            idx = sample_index(
                self._scrub_time_s, self._manager.scenario.settings.dt, sample_every, num_samples
            )
            positions = self._trajectory.positions[idx]
            trajectory_positions = {
                body_id: tuple(positions[index])
                for index, body_id in enumerate(self._trajectory.body_ids)
            }
        self._scrub_positions = select_preview_positions(
            self._trajectory is not None and not self._needs_simulation,
            trajectory_positions,
            scenario_positions,
        )
        self._update_debug_panel()

    def _toggle_playback(self) -> None:
        if self._playback_timer.isActive():
            self._playback_timer.stop()
            self._play_button.setText("Play")
            self._update_status_label()
            return
        if should_run_simulation(self._needs_simulation, self._trajectory is not None):
            self._auto_play_on_sim_complete = True
            self._run_simulation()
            return
        self._play_button.setText("Pause")
        self._playback_timer.start(33)
        self._update_status_label()

    def _on_playback_tick(self) -> None:
        duration_s = self._manager.scenario.settings.dt * self._manager.scenario.settings.steps
        dt_wall = self._playback_timer.interval() / 1000.0
        self._playback_time_s = advance_playback_time(
            self._playback_time_s, dt_wall, self._playback_speed, duration_s
        )
        if self._playback_time_s >= duration_s:
            self._playback_timer.stop()
            self._play_button.setText("Play")
            self._update_status_label()
        self._set_time(self._playback_time_s, update_slider=True)

    def _run_simulation(self) -> None:
        if self._is_simulating:
            return
        if self._playback_timer.isActive():
            self._playback_timer.stop()
            self._play_button.setText("Play")
        self._run_sim_action.setEnabled(False)
        thread = QtCore.QThread(self)
        worker = _SimulationWorker(self._manager.scenario)
        worker.moveToThread(thread)
        worker.finished.connect(self._on_simulation_complete)
        worker.finished.connect(thread.quit)
        worker.error.connect(self._on_simulation_error)
        worker.error.connect(thread.quit)
        thread.finished.connect(self._on_simulation_thread_finished)
        thread.started.connect(worker.run)
        self._sim_thread = thread
        self._sim_worker = worker
        thread.start()
        self._is_simulating = True
        self._update_status_label()

    def _on_simulation_complete(self, trajectory) -> None:
        self._trajectory = trajectory
        self._needs_simulation = False
        self._is_simulating = False
        self._update_status_label()
        if self._auto_play_on_sim_complete:
            self._auto_play_on_sim_complete = False
            self._play_button.setText("Pause")
            self._playback_timer.start(33)
            self._update_status_label()
        self._set_time(self._scrub_time_s, update_slider=True)

    def _on_simulation_error(self, message: str) -> None:
        QtWidgets.QMessageBox.warning(self, "Simulation Error", message)
        self._is_simulating = False
        self._invalidate_simulation()

    def _on_simulation_thread_finished(self) -> None:
        self._run_sim_action.setEnabled(True)
        self._sim_thread = None
        self._sim_worker = None
        self._update_status_label()

    def _toggle_developer_mode(self, state: int) -> None:
        enabled = state == QtCore.Qt.Checked
        self._debug_label.setVisible(enabled)

    def _on_speed_changed(self, value: int) -> None:
        self._playback_speed = max(0.05, min(value / 100.0, 5.0))
        self._speed_value.setText(f"{self._playback_speed:0.2f}×")


class _SimulationWorker(QtCore.QObject):
    finished = QtCore.Signal(object)
    error = QtCore.Signal(str)

    def __init__(self, scenario: Scenario) -> None:
        super().__init__()
        self._scenario = scenario

    def run(self) -> None:
        try:
            config = self._scenario.settings.to_simulation_config(record_hashes=False)
            trajectory = run_simulation(
                self._scenario.to_system_state(), self._scenario.events, config
            ).trajectory
            self.finished.emit(trajectory)
        except Exception as exc:
            self.error.emit(str(exc))


def main() -> None:
    parser = argparse.ArgumentParser(description="Physics Simulation Studio GUI")
    parser.add_argument("scenario", nargs="?", help="Optional scenario JSON to load")
    args = parser.parse_args()

    app = QtWidgets.QApplication()
    scenario_path = Path(args.scenario) if args.scenario else None
    window = MainWindow(scenario_path)
    window.show()
    app.exec()


if __name__ == "__main__":
    main()
