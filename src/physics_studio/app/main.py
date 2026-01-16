from __future__ import annotations

import argparse
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets

from physics_studio.authoring.commands import AddBody, CommandManager, MoveBody
from physics_studio.authoring.validation import validate_scenario
from physics_studio.scenario.io import load_scenario
from physics_studio.scenario.models import Particle, Scenario, ScenarioSettings
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

        self.setCentralWidget(container)
        self._build_actions()

    def _build_actions(self) -> None:
        menu = self.menuBar()
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
        self._viewport.set_scene(scenario, self._selected_body_id, self._preview_positions)

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
        self._viewport.set_scene(self._manager.scenario, self._selected_body_id, self._preview_positions)

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
        self._viewport.set_scene(self._manager.scenario, self._selected_body_id, self._preview_positions)

    def _on_drag_finished(self, body_id: str, world_pos: tuple[float, float, float]) -> None:
        start_pos = self._drag_start_positions.pop(body_id, None)
        self._preview_positions.pop(body_id, None)
        if start_pos is None:
            return
        final_pos = (world_pos[0], world_pos[1], start_pos[2])
        if start_pos != final_pos:
            self._manager.apply(MoveBody(body_id, final_pos))
        else:
            self._viewport.set_scene(self._manager.scenario, self._selected_body_id, self._preview_positions)

    def _find_body(self, body_id: str) -> Particle | None:
        for body in self._manager.scenario.particles + self._manager.scenario.rigid_bodies:
            if body.id == body_id:
                return body
        return None


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
