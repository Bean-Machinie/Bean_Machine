from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable


Vector3 = tuple[float, float, float]


def _vec3(value: Iterable[float]) -> Vector3:
    items = list(value)
    if len(items) != 3:
        raise ValueError("Vector3 must have exactly 3 elements")
    return (float(items[0]), float(items[1]), float(items[2]))


@dataclass(frozen=True)
class Particle:
    id: str
    name: str
    mass: float
    position: Vector3
    velocity: Vector3
    radius: float = 1.0
    thrust: Vector3 = (0.0, 0.0, 0.0)

    @staticmethod
    def from_dict(data: dict) -> "Particle":
        return Particle(
            id=str(data["id"]),
            name=str(data.get("name", data["id"])),
            mass=float(data["mass"]),
            position=_vec3(data.get("position", (0.0, 0.0, 0.0))),
            velocity=_vec3(data.get("velocity", (0.0, 0.0, 0.0))),
            radius=float(data.get("radius", 1.0)),
            thrust=_vec3(data.get("thrust", (0.0, 0.0, 0.0))),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "mass": self.mass,
            "position": list(self.position),
            "velocity": list(self.velocity),
            "radius": self.radius,
            "thrust": list(self.thrust),
        }


@dataclass(frozen=True)
class RigidBody:
    id: str
    name: str
    mass: float
    position: Vector3
    velocity: Vector3
    orientation: tuple[float, float, float, float] = (0.0, 0.0, 0.0, 1.0)
    angular_velocity: Vector3 = (0.0, 0.0, 0.0)
    thrust: Vector3 = (0.0, 0.0, 0.0)

    @staticmethod
    def from_dict(data: dict) -> "RigidBody":
        return RigidBody(
            id=str(data["id"]),
            name=str(data.get("name", data["id"])),
            mass=float(data["mass"]),
            position=_vec3(data.get("position", (0.0, 0.0, 0.0))),
            velocity=_vec3(data.get("velocity", (0.0, 0.0, 0.0))),
            orientation=tuple(map(float, data.get("orientation", (0.0, 0.0, 0.0, 1.0)))),
            angular_velocity=_vec3(data.get("angular_velocity", (0.0, 0.0, 0.0))),
            thrust=_vec3(data.get("thrust", (0.0, 0.0, 0.0))),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "mass": self.mass,
            "position": list(self.position),
            "velocity": list(self.velocity),
            "orientation": list(self.orientation),
            "angular_velocity": list(self.angular_velocity),
            "thrust": list(self.thrust),
        }


@dataclass(frozen=True)
class SystemState:
    particles: tuple[Particle, ...] = field(default_factory=tuple)
    rigid_bodies: tuple[RigidBody, ...] = field(default_factory=tuple)

    def all_bodies(self) -> tuple[object, ...]:
        return self.particles + self.rigid_bodies

    def body_ids(self) -> tuple[str, ...]:
        return tuple(body.id for body in self.all_bodies())
