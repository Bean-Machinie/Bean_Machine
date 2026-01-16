from __future__ import annotations

from dataclasses import dataclass, field

from physics_studio.core.events.models import CameraMarkerEvent, Event, ImpulseEvent, ThrustChangeEvent
from physics_studio.core.events.schedule import parse_event
from physics_studio.core.forces.settings import GravitySettings
from physics_studio.core.run.config import SimulationConfig
from physics_studio.core.state.models import Particle, RigidBody, SystemState


Vector3 = tuple[float, float, float]


def _vec3(value: list[float] | tuple[float, float, float]) -> Vector3:
    return (float(value[0]), float(value[1]), float(value[2]))


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


@dataclass(frozen=True)
class CameraKeyframe:
    time_s: float
    position: Vector3
    target: Vector3
    fov_deg: float | None = None

    @staticmethod
    def from_dict(data: dict) -> "CameraKeyframe":
        return CameraKeyframe(
            time_s=float(data["time_s"]),
            position=_vec3(data["position_xyz"]),
            target=_vec3(data["target_xyz"]),
            fov_deg=float(data["fov_deg"]) if data.get("fov_deg") is not None else None,
        )

    def to_dict(self) -> dict:
        payload = {
            "time_s": self.time_s,
            "position_xyz": list(self.position),
            "target_xyz": list(self.target),
        }
        if self.fov_deg is not None:
            payload["fov_deg"] = self.fov_deg
        return payload


@dataclass(frozen=True)
class CameraState:
    position: Vector3
    target: Vector3
    fov_deg: float


@dataclass
class CameraTrack:
    keyframes: list[CameraKeyframe] = field(default_factory=list)
    default_fov_deg: float = 60.0

    @staticmethod
    def from_dict(data: dict | None) -> "CameraTrack":
        if not data:
            return CameraTrack()
        keyframes = [CameraKeyframe.from_dict(item) for item in data.get("keyframes", [])]
        default_fov = float(data.get("default_fov_deg", 60.0))
        return CameraTrack(keyframes=keyframes, default_fov_deg=default_fov)

    def to_dict(self) -> dict:
        return {
            "default_fov_deg": self.default_fov_deg,
            "keyframes": [frame.to_dict() for frame in self.keyframes],
        }

    def evaluate(self, time_s: float) -> CameraState:
        if not self.keyframes:
            return CameraState(position=(0.0, 0.0, 50.0), target=(0.0, 0.0, 0.0), fov_deg=60.0)
        ordered = sorted(self.keyframes, key=lambda k: k.time_s)
        if time_s <= ordered[0].time_s:
            return self._state_from_keyframe(ordered[0])
        if time_s >= ordered[-1].time_s:
            return self._state_from_keyframe(ordered[-1])

        for left, right in zip(ordered, ordered[1:]):
            if left.time_s <= time_s <= right.time_s:
                t = (time_s - left.time_s) / max(right.time_s - left.time_s, 1e-9)
                position = tuple(
                    left.position[i] + (right.position[i] - left.position[i]) * t
                    for i in range(3)
                )
                target = tuple(
                    left.target[i] + (right.target[i] - left.target[i]) * t for i in range(3)
                )
                left_fov = left.fov_deg if left.fov_deg is not None else self.default_fov_deg
                right_fov = right.fov_deg if right.fov_deg is not None else self.default_fov_deg
                fov = left_fov + (right_fov - left_fov) * t
                return CameraState(position=position, target=target, fov_deg=fov)
        return self._state_from_keyframe(ordered[-1])

    def _state_from_keyframe(self, keyframe: CameraKeyframe) -> CameraState:
        fov = keyframe.fov_deg if keyframe.fov_deg is not None else self.default_fov_deg
        return CameraState(position=keyframe.position, target=keyframe.target, fov_deg=fov)


@dataclass
class Scenario:
    version: int
    settings: ScenarioSettings
    camera_track: CameraTrack = field(default_factory=CameraTrack)
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
        camera_track = CameraTrack.from_dict(data.get("camera"))
        return Scenario(
            version=int(data["version"]),
            settings=settings,
            camera_track=camera_track,
            particles=particles,
            rigid_bodies=rigid_bodies,
            events=events,
            metadata=dict(data.get("metadata", {})),
        )

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "settings": self.settings.to_dict(),
            "camera": self.camera_track.to_dict(),
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
