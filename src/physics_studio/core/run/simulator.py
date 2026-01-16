from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from physics_studio.core.backends.registry import get_backend
from physics_studio.core.determinism.hashing import hash_state
from physics_studio.core.events.models import CameraMarkerEvent, Event, ImpulseEvent, ThrustChangeEvent
from physics_studio.core.events.schedule import build_schedule
from physics_studio.core.forces.drag import compute_linear_drag_acceleration
from physics_studio.core.forces.gravity import compute_gravity_acceleration
from physics_studio.core.forces.thrust import compute_thrust_acceleration
from physics_studio.core.run.config import SimulationConfig
from physics_studio.core.run.trajectory import Trajectory, build_body_order
from physics_studio.core.state.models import SystemState
from physics_studio.core.integrators.semi_implicit_euler import step


@dataclass
class SimulationResult:
    trajectory: Trajectory
    hashes: list[str] = field(default_factory=list)
    camera_markers: list[dict] = field(default_factory=list)


@dataclass(frozen=True)
class _BodyData:
    id: str
    mass: float
    position: tuple[float, float, float]
    velocity: tuple[float, float, float]
    thrust: tuple[float, float, float]


def _collect_bodies(state: SystemState) -> dict[str, _BodyData]:
    data: dict[str, _BodyData] = {}
    for body in state.all_bodies():
        data[body.id] = _BodyData(
            id=body.id,
            mass=body.mass,
            position=body.position,
            velocity=body.velocity,
            thrust=body.thrust,
        )
    return data


def run_simulation(state: SystemState, events: list[Event], config: SimulationConfig) -> SimulationResult:
    backend = get_backend()
    np_backend = backend.np

    body_data = _collect_bodies(state)
    order = build_body_order(body_data.keys())
    count = len(order)

    positions = np_backend.array([body_data[bid].position for bid in order], dtype=np.float64)
    velocities = np_backend.array([body_data[bid].velocity for bid in order], dtype=np.float64)
    masses = np_backend.array([body_data[bid].mass for bid in order], dtype=np.float64)
    thrusts = np_backend.array([body_data[bid].thrust for bid in order], dtype=np.float64)

    schedule = build_schedule(events, config.dt)
    id_to_index = {bid: idx for idx, bid in enumerate(order)}

    trajectory = Trajectory(body_ids=order)
    hashes: list[str] = []
    camera_markers: list[dict] = []

    for step_index in range(config.steps + 1):
        time = step_index * config.dt
        if config.record_hashes:
            hashes.append(hash_state(step_index, positions, velocities))
        trajectory.record(time, positions, velocities)

        if step_index == config.steps:
            break

        for event in schedule.events_at(step_index):
            if isinstance(event, ImpulseEvent):
                idx = id_to_index[event.body_id]
                velocities[idx] = velocities[idx] + np_backend.array(event.delta_v, dtype=np.float64)
            elif isinstance(event, ThrustChangeEvent):
                idx = id_to_index[event.body_id]
                thrusts[idx] = np_backend.array(event.thrust, dtype=np.float64)
            elif isinstance(event, CameraMarkerEvent):
                camera_markers.append({"time": event.time, "label": event.label})

        gravity = compute_gravity_acceleration(positions, masses, config.gravity)
        thrust = compute_thrust_acceleration(thrusts, masses)
        drag = compute_linear_drag_acceleration(velocities, config.drag_coefficient)
        acceleration = gravity + thrust + drag

        step(positions, velocities, acceleration, config.dt)

    return SimulationResult(trajectory=trajectory, hashes=hashes, camera_markers=camera_markers)
