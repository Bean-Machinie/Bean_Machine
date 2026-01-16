from __future__ import annotations

import json
from pathlib import Path

from physics_studio.scenario.migrations.registry import upgrade_to_latest
from physics_studio.scenario.models import Scenario
from physics_studio.scenario.schema import SCHEMA_VERSION, validate_scenario_dict


def load_scenario(path: str | Path) -> Scenario:
    path = Path(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    data = upgrade_to_latest(data)
    validate_scenario_dict(data)
    return Scenario.from_dict(data)


def save_scenario(scenario: Scenario, path: str | Path) -> None:
    path = Path(path)
    data = scenario.to_dict()
    data["version"] = SCHEMA_VERSION
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")


def save_trajectory(trajectory: dict, path: str | Path) -> None:
    path = Path(path)
    path.write_text(json.dumps(trajectory, indent=2), encoding="utf-8")
