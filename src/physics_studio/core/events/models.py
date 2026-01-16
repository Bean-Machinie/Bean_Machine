from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


Vector3 = tuple[float, float, float]


def _vec3(value: Iterable[float]) -> Vector3:
    items = list(value)
    if len(items) != 3:
        raise ValueError("Vector3 must have exactly 3 elements")
    return (float(items[0]), float(items[1]), float(items[2]))


@dataclass(frozen=True)
class Event:
    id: str
    time: float


@dataclass(frozen=True)
class ImpulseEvent(Event):
    body_id: str
    delta_v: Vector3

    @staticmethod
    def from_dict(data: dict) -> "ImpulseEvent":
        return ImpulseEvent(
            id=str(data["id"]),
            time=float(data["time"]),
            body_id=str(data["body_id"]),
            delta_v=_vec3(data["delta_v"]),
        )


@dataclass(frozen=True)
class ThrustChangeEvent(Event):
    body_id: str
    thrust: Vector3

    @staticmethod
    def from_dict(data: dict) -> "ThrustChangeEvent":
        return ThrustChangeEvent(
            id=str(data["id"]),
            time=float(data["time"]),
            body_id=str(data["body_id"]),
            thrust=_vec3(data["thrust"]),
        )


@dataclass(frozen=True)
class CameraMarkerEvent(Event):
    label: str

    @staticmethod
    def from_dict(data: dict) -> "CameraMarkerEvent":
        return CameraMarkerEvent(
            id=str(data["id"]),
            time=float(data["time"]),
            label=str(data.get("label", data["id"])),
        )
