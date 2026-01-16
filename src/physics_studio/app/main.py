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
from physics_studio.render.sampling import sample_trajectory
from physics_studio.render.export import RenderJob, render_video
from physics_studio.render.presets import PRESETS
from physics_studio.scenario.io import load_scenario, save_scenario
from physics_studio.scenario.models import CameraKeyframe, Particle, Scenario, ScenarioSettings
from physics_studio.app.viewport import ViewportWidget


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
        timeline_layout.addWidget(self._timeline_slider, stretch=1)
        timeline_layout.addWidget(self._timeline_label)
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

        export_action = QtGui.QAction("Export Video", self)
        export_action.triggered.connect(self._export_video)

        file_menu.addAction(export_action)
        edit_menu.addAction(self._undo_action)
        edit_menu.addAction(self._redo_action)
        create_menu.addAction(add_body_action)

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
        self._update_trajectory(scenario)
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

    def _update_trajectory(self, scenario: Scenario) -> None:
        config = scenario.settings.to_simulation_config(record_hashes=False)
        self._trajectory = run_simulation(scenario.to_system_state(), scenario.events, config).trajectory
        self._timeline_slider.setMinimum(0)
        self._timeline_slider.setMaximum(config.steps)
        self._timeline_slider.setSingleStep(1)
        if self._scrub_time_s > config.steps * config.dt:
            self._scrub_time_s = config.steps * config.dt
        self._timeline_slider.blockSignals(True)
        self._timeline_slider.setValue(int(round(self._scrub_time_s / config.dt)))
        self._timeline_slider.blockSignals(False)
        self._timeline_label.setText(f"t={self._scrub_time_s:0.2f}s")

    def _update_scrub_positions(self) -> None:
        if not self._trajectory:
            self._scrub_positions = {}
            return
        positions = sample_trajectory(self._trajectory, self._scrub_time_s)
        self._scrub_positions = {
            body_id: tuple(positions[index])
            for index, body_id in enumerate(self._trajectory.body_ids)
        }

    def _compose_preview_positions(self) -> dict[str, tuple[float, float, float]]:
        merged = dict(self._scrub_positions)
        merged.update(self._preview_positions)
        return merged

    def _on_timeline_changed(self, value: int) -> None:
        dt = self._manager.scenario.settings.dt
        self._scrub_time_s = value * dt
        self._timeline_label.setText(f"t={self._scrub_time_s:0.2f}s")
        self._update_scrub_positions()
        camera_state = self._manager.scenario.camera_track.evaluate(self._scrub_time_s)
        self._viewport.set_scene(
            self._manager.scenario,
            self._selected_body_id,
            self._compose_preview_positions(),
            camera_state,
        )

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
