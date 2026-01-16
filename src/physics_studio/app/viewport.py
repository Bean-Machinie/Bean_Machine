from __future__ import annotations

from dataclasses import dataclass

from PySide6 import QtCore, QtGui, QtWidgets

from physics_studio.app.picking import BodyPickData, pick_body_screen
from physics_studio.scenario.models import Scenario


@dataclass(frozen=True)
class BodyRenderData:
    id: str
    position: tuple[float, float, float]
    radius: float


class ViewportWidget(QtWidgets.QWidget):
    body_selected = QtCore.Signal(object)
    drag_started = QtCore.Signal(object)
    drag_updated = QtCore.Signal(object, object)
    drag_finished = QtCore.Signal(object, object)

    def __init__(self, parent: QtWidgets.QWidget | None = None) -> None:
        super().__init__(parent)
        self.setMouseTracking(True)
        self._scenario: Scenario | None = None
        self._selected_body_id: str | None = None
        self._preview_positions: dict[str, tuple[float, float, float]] = {}
        self._dragging = False
        self._drag_body_id: str | None = None
        self._drag_start_world: tuple[float, float, float] | None = None
        self._screen_positions: dict[str, QtCore.QPointF] = {}
        self._view_center = QtCore.QPointF(0.0, 0.0)
        self._view_scale = 1.0

    def set_scene(
        self,
        scenario: Scenario,
        selected_body_id: str | None,
        preview_positions: dict[str, tuple[float, float, float]] | None = None,
    ) -> None:
        self._scenario = scenario
        self._selected_body_id = selected_body_id
        self._preview_positions = preview_positions or {}
        self.update()

    def paintEvent(self, event: QtGui.QPaintEvent) -> None:
        painter = QtGui.QPainter(self)
        painter.fillRect(self.rect(), QtGui.QColor("#1f1f1f"))

        if not self._scenario:
            return

        bodies = self._collect_bodies()
        self._compute_view(bodies)
        self._screen_positions = {
            body.id: self._world_to_screen(body.position) for body in bodies
        }

        for body in bodies:
            screen_pos = self._screen_positions[body.id]
            size = 6 if body.id != self._selected_body_id else 10
            color = QtGui.QColor("#4aa3ff") if body.id != self._selected_body_id else QtGui.QColor("#ffd166")
            painter.setBrush(color)
            painter.setPen(QtGui.QPen(QtGui.QColor("#000000"), 1))
            painter.drawEllipse(screen_pos, size, size)

        if self._selected_body_id and self._selected_body_id in self._screen_positions:
            center = self._screen_positions[self._selected_body_id]
            painter.setPen(QtGui.QPen(QtGui.QColor("#ffd166"), 1, QtCore.Qt.DashLine))
            painter.drawEllipse(center, 16, 16)

    def mousePressEvent(self, event: QtGui.QMouseEvent) -> None:
        if not self._scenario or event.button() != QtCore.Qt.LeftButton:
            return
        bodies = self._collect_bodies()
        screen_positions = {
            body_id: (pos.x(), pos.y()) for body_id, pos in self._screen_positions.items()
        }
        clicked_id = pick_body_screen(
            [BodyPickData(id=body.id) for body in bodies],
            (event.position().x(), event.position().y()),
            screen_positions,
            threshold_px=12,
        )
        if clicked_id:
            self._selected_body_id = clicked_id
            self.body_selected.emit(clicked_id)
            self._dragging = True
            self._drag_body_id = clicked_id
            self._drag_start_world = self._screen_to_world(event.position())
            self.drag_started.emit(clicked_id)
            self.update()
        else:
            self._selected_body_id = None
            self.body_selected.emit(None)
            self.update()

    def mouseMoveEvent(self, event: QtGui.QMouseEvent) -> None:
        if not self._dragging or not self._drag_body_id:
            return
        world_pos = self._screen_to_world(event.position())
        self.drag_updated.emit(self._drag_body_id, world_pos)

    def mouseReleaseEvent(self, event: QtGui.QMouseEvent) -> None:
        if event.button() != QtCore.Qt.LeftButton:
            return
        if self._dragging and self._drag_body_id:
            world_pos = self._screen_to_world(event.position())
            self.drag_finished.emit(self._drag_body_id, world_pos)
        self._dragging = False
        self._drag_body_id = None
        self._drag_start_world = None

    def _collect_bodies(self) -> list[BodyRenderData]:
        bodies: list[BodyRenderData] = []
        if not self._scenario:
            return bodies
        for body in self._scenario.particles + self._scenario.rigid_bodies:
            position = self._preview_positions.get(body.id, body.position)
            radius = getattr(body, "radius", 1.0)
            bodies.append(BodyRenderData(id=body.id, position=position, radius=radius))
        return bodies

    def _compute_view(self, bodies: list[BodyRenderData]) -> None:
        if not bodies:
            self._view_center = QtCore.QPointF(0.0, 0.0)
            self._view_scale = 1.0
            return
        min_x = min(body.position[0] for body in bodies)
        max_x = max(body.position[0] for body in bodies)
        min_y = min(body.position[1] for body in bodies)
        max_y = max(body.position[1] for body in bodies)
        width = max(max_x - min_x, 1.0)
        height = max(max_y - min_y, 1.0)
        padding = 40.0
        self._view_center = QtCore.QPointF((min_x + max_x) / 2.0, (min_y + max_y) / 2.0)
        scale_x = (self.width() - padding) / width
        scale_y = (self.height() - padding) / height
        self._view_scale = min(scale_x, scale_y)

    def _world_to_screen(self, position: tuple[float, float, float]) -> QtCore.QPointF:
        x = (position[0] - self._view_center.x()) * self._view_scale + self.width() / 2.0
        y = (position[1] - self._view_center.y()) * self._view_scale + self.height() / 2.0
        return QtCore.QPointF(x, y)

    def _screen_to_world(self, point: QtCore.QPointF) -> tuple[float, float, float]:
        if self._view_scale == 0:
            return (0.0, 0.0, 0.0)
        x = (point.x() - self.width() / 2.0) / self._view_scale + self._view_center.x()
        y = (point.y() - self.height() / 2.0) / self._view_scale + self._view_center.y()
        return (float(x), float(y), 0.0)
