from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Callable, Protocol, Sequence

from physics_studio.core.events.models import Event
from physics_studio.scenario.models import CameraKeyframe, Particle, RigidBody, Scenario


class CommandError(ValueError):
    pass


class Command(Protocol):
    description: str

    def do(self, scenario: Scenario) -> Scenario:
        ...

    def undo(self, scenario: Scenario) -> Scenario:
        ...


def _copy_scenario(scenario: Scenario) -> Scenario:
    return Scenario(
        version=scenario.version,
        settings=scenario.settings,
        camera_track=type(scenario.camera_track)(
            keyframes=list(scenario.camera_track.keyframes),
            default_fov_deg=scenario.camera_track.default_fov_deg,
        ),
        particles=list(scenario.particles),
        rigid_bodies=list(scenario.rigid_bodies),
        events=list(scenario.events),
        metadata=dict(scenario.metadata),
    )


def _body_ids(scenario: Scenario) -> set[str]:
    return {body.id for body in scenario.particles + scenario.rigid_bodies}


def _event_ids(scenario: Scenario) -> set[str]:
    return {event.id for event in scenario.events}


def _get_body_and_collection(scenario: Scenario, body_id: str) -> tuple[str, int, object]:
    for index, body in enumerate(scenario.particles):
        if body.id == body_id:
            return ("particles", index, body)
    for index, body in enumerate(scenario.rigid_bodies):
        if body.id == body_id:
            return ("rigid_bodies", index, body)
    raise CommandError(f"Body not found: {body_id}")


def _get_event_index(scenario: Scenario, event_id: str) -> tuple[int, Event]:
    for index, event in enumerate(scenario.events):
        if event.id == event_id:
            return (index, event)
    raise CommandError(f"Event not found: {event_id}")


def _get_keyframe(scenario: Scenario, index: int) -> CameraKeyframe:
    if index < 0 or index >= len(scenario.camera_track.keyframes):
        raise CommandError(f"Camera keyframe index out of range: {index}")
    return scenario.camera_track.keyframes[index]


def _coerce_value(original: object, value: object) -> object:
    if isinstance(original, tuple) and isinstance(value, list):
        return tuple(value)
    if isinstance(original, float):
        return float(value)
    return value


def _get_path_value(obj: object, path: Sequence[str]) -> object:
    current = obj
    for segment in path:
        if hasattr(current, segment):
            current = getattr(current, segment)
        elif isinstance(current, dict) and segment in current:
            current = current[segment]
        elif isinstance(current, (list, tuple)) and segment.isdigit():
            current = current[int(segment)]
        else:
            raise CommandError(f"Invalid field path segment: {segment}")
    return current


def _set_path_value(obj: object, path: Sequence[str], value: object) -> object:
    if not path:
        return value

    segment = path[0]
    remaining = path[1:]

    if hasattr(obj, segment):
        current_value = getattr(obj, segment)
        new_value = _set_path_value(current_value, remaining, value) if remaining else value
        new_value = _coerce_value(current_value, new_value)
        return replace(obj, **{segment: new_value})
    if isinstance(obj, dict) and segment in obj:
        new_obj = dict(obj)
        current_value = new_obj[segment]
        new_obj[segment] = (
            _set_path_value(current_value, remaining, value) if remaining else value
        )
        return new_obj
    if isinstance(obj, (list, tuple)) and segment.isdigit():
        index = int(segment)
        items = list(obj)
        if index < 0 or index >= len(items):
            raise CommandError(f"Index out of range in path: {segment}")
        current_value = items[index]
        items[index] = _set_path_value(current_value, remaining, value) if remaining else value
        return tuple(items) if isinstance(obj, tuple) else items
    raise CommandError(f"Invalid field path segment: {segment}")


@dataclass
class CommandManager:
    scenario: Scenario
    _undo_stack: list[Command] = None
    _redo_stack: list[Command] = None
    _listeners: list[Callable[[Scenario], None]] = None

    def __post_init__(self) -> None:
        self._undo_stack = []
        self._redo_stack = []
        self._listeners = []

    def add_listener(self, callback: Callable[[Scenario], None]) -> None:
        self._listeners.append(callback)

    def _notify(self) -> None:
        for callback in list(self._listeners):
            callback(self.scenario)

    def apply(self, command: Command) -> None:
        self.scenario = command.do(self.scenario)
        self._undo_stack.append(command)
        self._redo_stack.clear()
        self._notify()

    def undo(self) -> None:
        if not self._undo_stack:
            return
        command = self._undo_stack.pop()
        self.scenario = command.undo(self.scenario)
        self._redo_stack.append(command)
        self._notify()

    def redo(self) -> None:
        if not self._redo_stack:
            return
        command = self._redo_stack.pop()
        self.scenario = command.do(self.scenario)
        self._undo_stack.append(command)
        self._notify()

    def can_undo(self) -> bool:
        return bool(self._undo_stack)

    def can_redo(self) -> bool:
        return bool(self._redo_stack)


@dataclass
class AddBody:
    body: Particle | RigidBody
    description: str = "Add body"

    def do(self, scenario: Scenario) -> Scenario:
        if self.body.id in _body_ids(scenario):
            raise CommandError(f"Duplicate body id: {self.body.id}")
        updated = _copy_scenario(scenario)
        if isinstance(self.body, Particle):
            updated.particles.append(self.body)
        elif isinstance(self.body, RigidBody):
            updated.rigid_bodies.append(self.body)
        else:
            raise CommandError("Unsupported body type")
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        updated = _copy_scenario(scenario)
        updated.particles = [b for b in updated.particles if b.id != self.body.id]
        updated.rigid_bodies = [b for b in updated.rigid_bodies if b.id != self.body.id]
        return updated


@dataclass
class DeleteBody:
    body_id: str
    description: str = "Delete body"
    _snapshot: object | None = None
    _collection: str | None = None
    _index: int | None = None

    def do(self, scenario: Scenario) -> Scenario:
        collection, index, body = _get_body_and_collection(scenario, self.body_id)
        self._snapshot = body
        self._collection = collection
        self._index = index
        updated = _copy_scenario(scenario)
        if collection == "particles":
            updated.particles.pop(index)
        else:
            updated.rigid_bodies.pop(index)
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        if self._snapshot is None or self._collection is None or self._index is None:
            raise CommandError("DeleteBody has no snapshot to restore")
        updated = _copy_scenario(scenario)
        if self._collection == "particles":
            updated.particles.insert(self._index, self._snapshot)
        else:
            updated.rigid_bodies.insert(self._index, self._snapshot)
        return updated


@dataclass
class UpdateBodyProperty:
    body_id: str
    field_path: str
    value: object
    description: str = "Update body property"
    _previous: object | None = None
    _collection: str | None = None
    _index: int | None = None

    def do(self, scenario: Scenario) -> Scenario:
        collection, index, body = _get_body_and_collection(scenario, self.body_id)
        path = self.field_path.split(".")
        self._previous = _get_path_value(body, path)
        updated_body = _set_path_value(body, path, self.value)
        updated = _copy_scenario(scenario)
        if collection == "particles":
            updated.particles[index] = updated_body
        else:
            updated.rigid_bodies[index] = updated_body
        self._collection = collection
        self._index = index
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        if self._previous is None or self._collection is None or self._index is None:
            raise CommandError("UpdateBodyProperty has no previous value to restore")
        updated = _copy_scenario(scenario)
        body = (
            updated.particles[self._index]
            if self._collection == "particles"
            else updated.rigid_bodies[self._index]
        )
        path = self.field_path.split(".")
        restored_body = _set_path_value(body, path, self._previous)
        if self._collection == "particles":
            updated.particles[self._index] = restored_body
        else:
            updated.rigid_bodies[self._index] = restored_body
        return updated


@dataclass
class MoveBody:
    body_id: str
    new_position: tuple[float, float, float]
    description: str = "Move body"
    _previous: tuple[float, float, float] | None = None
    _collection: str | None = None
    _index: int | None = None

    def do(self, scenario: Scenario) -> Scenario:
        collection, index, body = _get_body_and_collection(scenario, self.body_id)
        self._previous = body.position
        updated_body = replace(body, position=tuple(float(v) for v in self.new_position))
        updated = _copy_scenario(scenario)
        if collection == "particles":
            updated.particles[index] = updated_body
        else:
            updated.rigid_bodies[index] = updated_body
        self._collection = collection
        self._index = index
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        if self._previous is None or self._collection is None or self._index is None:
            raise CommandError("MoveBody has no previous position to restore")
        updated = _copy_scenario(scenario)
        body = (
            updated.particles[self._index]
            if self._collection == "particles"
            else updated.rigid_bodies[self._index]
        )
        restored_body = replace(body, position=self._previous)
        if self._collection == "particles":
            updated.particles[self._index] = restored_body
        else:
            updated.rigid_bodies[self._index] = restored_body
        return updated


@dataclass
class AddEvent:
    event: Event
    description: str = "Add event"

    def do(self, scenario: Scenario) -> Scenario:
        if self.event.id in _event_ids(scenario):
            raise CommandError(f"Duplicate event id: {self.event.id}")
        updated = _copy_scenario(scenario)
        updated.events.append(self.event)
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        updated = _copy_scenario(scenario)
        updated.events = [event for event in updated.events if event.id != self.event.id]
        return updated


@dataclass
class DeleteEvent:
    event_id: str
    description: str = "Delete event"
    _snapshot: Event | None = None
    _index: int | None = None

    def do(self, scenario: Scenario) -> Scenario:
        index, event = _get_event_index(scenario, self.event_id)
        self._snapshot = event
        self._index = index
        updated = _copy_scenario(scenario)
        updated.events.pop(index)
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        if self._snapshot is None or self._index is None:
            raise CommandError("DeleteEvent has no snapshot to restore")
        updated = _copy_scenario(scenario)
        updated.events.insert(self._index, self._snapshot)
        return updated


@dataclass
class UpdateEventProperty:
    event_id: str
    field_path: str
    value: object
    description: str = "Update event property"
    _previous: object | None = None
    _index: int | None = None

    def do(self, scenario: Scenario) -> Scenario:
        index, event = _get_event_index(scenario, self.event_id)
        path = self.field_path.split(".")
        self._previous = _get_path_value(event, path)
        updated_event = _set_path_value(event, path, self.value)
        updated = _copy_scenario(scenario)
        updated.events[index] = updated_event
        self._index = index
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        if self._previous is None or self._index is None:
            raise CommandError("UpdateEventProperty has no previous value to restore")
        updated = _copy_scenario(scenario)
        event = updated.events[self._index]
        path = self.field_path.split(".")
        restored_event = _set_path_value(event, path, self._previous)
        updated.events[self._index] = restored_event
        return updated


@dataclass
class AddCameraKeyframe:
    keyframe: CameraKeyframe
    description: str = "Add camera keyframe"
    _index: int | None = None

    def do(self, scenario: Scenario) -> Scenario:
        updated = _copy_scenario(scenario)
        updated.camera_track.keyframes.append(self.keyframe)
        self._index = len(updated.camera_track.keyframes) - 1
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        if self._index is None:
            raise CommandError("AddCameraKeyframe has no index to remove")
        updated = _copy_scenario(scenario)
        if self._index < len(updated.camera_track.keyframes):
            updated.camera_track.keyframes.pop(self._index)
        return updated


@dataclass
class DeleteCameraKeyframe:
    index: int
    description: str = "Delete camera keyframe"
    _snapshot: CameraKeyframe | None = None

    def do(self, scenario: Scenario) -> Scenario:
        self._snapshot = _get_keyframe(scenario, self.index)
        updated = _copy_scenario(scenario)
        updated.camera_track.keyframes.pop(self.index)
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        if self._snapshot is None:
            raise CommandError("DeleteCameraKeyframe has no snapshot to restore")
        updated = _copy_scenario(scenario)
        updated.camera_track.keyframes.insert(self.index, self._snapshot)
        return updated


@dataclass
class UpdateCameraKeyframe:
    index: int
    field_path: str
    value: object
    description: str = "Update camera keyframe"
    _previous: object | None = None

    def do(self, scenario: Scenario) -> Scenario:
        keyframe = _get_keyframe(scenario, self.index)
        path = self.field_path.split(".")
        self._previous = _get_path_value(keyframe, path)
        updated_keyframe = _set_path_value(keyframe, path, self.value)
        updated = _copy_scenario(scenario)
        updated.camera_track.keyframes[self.index] = updated_keyframe
        return updated

    def undo(self, scenario: Scenario) -> Scenario:
        if self._previous is None:
            raise CommandError("UpdateCameraKeyframe has no previous value to restore")
        updated = _copy_scenario(scenario)
        keyframe = updated.camera_track.keyframes[self.index]
        path = self.field_path.split(".")
        updated_keyframe = _set_path_value(keyframe, path, self._previous)
        updated.camera_track.keyframes[self.index] = updated_keyframe
        return updated
