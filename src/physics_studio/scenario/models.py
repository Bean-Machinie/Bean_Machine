from __future__ import annotations

from dataclasses import dataclass, field

from physics_studio.core.events.models import CameraMarkerEvent, Event, ImpulseEvent, ThrustChangeEvent
from physics_studio.core.events.schedule import parse_event
from physics_studio.core.forces.settings import GravitySettings
from physics_studio.core.run.config import SimulationConfig
from physics_studio.core.state.models import Particle, RigidBody, SystemState


@dataclass(frozen=True)
class ScenarioSettings:
    dt: float
    steps: int
    gravity_constant: float = 6.67430e-11
    gravity_softening: float = 0.0
    drag_coefficient: float = 0.0

    @staticmethod
    def from_dict(data: dict) -> "ScenarioSettings":
        return ScenarioSettings(
            dt=float(data["dt"]),
            steps=int(data["steps"]),
            gravity_constant=float(data.get("gravity_constant", 6.67430e-11)),
            gravity_softening=float(data.get("gravity_softening", 0.0)),
            drag_coefficient=float(data.get("drag_coefficient", 0.0)),
        )

    def to_dict(self) -> dict:
        return {
            "dt": self.dt,
            "steps": self.steps,
            "gravity_constant": self.gravity_constant,
            "gravity_softening": self.gravity_softening,
            "drag_coefficient": self.drag_coefficient,
        }

    def to_simulation_config(self, record_hashes: bool = False) -> SimulationConfig:
        return SimulationConfig(
            dt=self.dt,
            steps=self.steps,
            gravity=GravitySettings(G=self.gravity_constant, softening=self.gravity_softening),
            drag_coefficient=self.drag_coefficient,
            record_hashes=record_hashes,
        )


@dataclass
class Scenario:
    version: int
    settings: ScenarioSettings
    particles: list[Particle] = field(default_factory=list)
    rigid_bodies: list[RigidBody] = field(default_factory=list)
    events: list[Event] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

    @staticmethod
    def from_dict(data: dict) -> "Scenario":
        settings = ScenarioSettings.from_dict(data["settings"])
        particles = [Particle.from_dict(item) for item in data.get("bodies", {}).get("particles", [])]
        rigid_bodies = [
            RigidBody.from_dict(item) for item in data.get("bodies", {}).get("rigid_bodies", [])
        ]
        events = [parse_event(item) for item in data.get("events", [])]
        return Scenario(
            version=int(data["version"]),
            settings=settings,
            particles=particles,
            rigid_bodies=rigid_bodies,
            events=events,
            metadata=dict(data.get("metadata", {})),
        )

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "settings": self.settings.to_dict(),
            "bodies": {
                "particles": [particle.to_dict() for particle in self.particles],
                "rigid_bodies": [body.to_dict() for body in self.rigid_bodies],
            },
            "events": [self._event_to_dict(event) for event in self.events],
            "metadata": self.metadata,
        }

    def to_system_state(self) -> SystemState:
        return SystemState(particles=tuple(self.particles), rigid_bodies=tuple(self.rigid_bodies))

    def _event_to_dict(self, event: Event) -> dict:
        base = {"id": event.id, "time": event.time}
        if isinstance(event, ImpulseEvent):
            base.update({"type": "impulse", "body_id": event.body_id, "delta_v": list(event.delta_v)})
        elif isinstance(event, ThrustChangeEvent):
            base.update(
                {"type": "thrust_change", "body_id": event.body_id, "thrust": list(event.thrust)}
            )
        elif isinstance(event, CameraMarkerEvent):
            base.update({"type": "camera_marker", "label": event.label})
        else:
            base["type"] = "unknown"
        return base
