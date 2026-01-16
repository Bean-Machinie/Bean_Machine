from __future__ import annotations

from physics_studio.scenario.schema import SCHEMA_VERSION


def upgrade_to_latest(data: dict) -> dict:
    version = int(data.get("version", 0))
    if version == SCHEMA_VERSION:
        return data
    if version == 0:
        raise ValueError("Scenario version missing; expected version field")
    raise ValueError(f"Unsupported scenario version: {version}")
