from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path

from physics_studio.core.run.config import SimulationConfig
from physics_studio.core.run.trajectory import Trajectory
from physics_studio.scenario.models import Scenario


SCHEMA_VERSION = "trajectory_v1"
UNITS_PRESET = "SI"


def compute_content_hash(path: Path) -> str:
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest()


def build_trajectory_schema_v1(
    *,
    trajectory: Trajectory,
    scenario: Scenario,
    config: SimulationConfig,
    scenario_path: str,
    content_hash: str,
    integrator: str,
    sample_every: int,
    hashes: list[str] | None = None,
    include_created_utc: bool = False,
) -> dict:
    bodies_by_id = {body.id: body for body in scenario.particles + scenario.rigid_bodies}
    bodies = []
    for body_id in trajectory.body_ids:
        body = bodies_by_id.get(body_id)
        bodies.append(
            {
                "id": body_id,
                "mass": float(body.mass) if body else None,
            }
        )

    payload = {
        "schema_version": SCHEMA_VERSION,
        "scenario": {
            "path": scenario_path,
            "schema_version": scenario.version,
            "content_hash": content_hash,
        },
        "simulation": {
            "dt": config.dt,
            "steps": config.steps,
            "sample_every": sample_every,
            "integrator": integrator,
            "units": UNITS_PRESET,
        },
        "bodies": bodies,
        "channels": {
            "time_s": list(trajectory.times),
            "position_m": list(trajectory.positions),
            "velocity_mps": list(trajectory.velocities),
        },
    }

    if hashes is not None:
        payload["channels"]["hashes"] = list(hashes)

    if include_created_utc:
        created_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        payload["created_utc"] = created_utc

    return payload
