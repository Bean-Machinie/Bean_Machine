from __future__ import annotations

from pathlib import Path

import pytest

from physics_studio.authoring.commands import (
    AddBody,
    CommandError,
    CommandManager,
    DeleteBody,
    UpdateBodyProperty,
)
from physics_studio.authoring.validation import validate_scenario
from physics_studio.core.events.models import ImpulseEvent
from physics_studio.scenario.io import load_scenario, save_scenario
from physics_studio.scenario.models import Particle, Scenario, ScenarioSettings


def _base_scenario() -> Scenario:
    return Scenario(version=1, settings=ScenarioSettings(dt=1.0, steps=10))


def test_command_manager_undo_redo() -> None:
    scenario = _base_scenario()
    manager = CommandManager(scenario)

    body_a = Particle(id="body_a", name="Body A", mass=1.0, position=(0, 0, 0), velocity=(0, 0, 0))
    body_b = Particle(id="body_b", name="Body B", mass=2.0, position=(1, 0, 0), velocity=(0, 1, 0))

    manager.apply(AddBody(body_a))
    manager.apply(AddBody(body_b))

    assert len(manager.scenario.particles) == 2

    manager.undo()
    manager.undo()
    assert len(manager.scenario.particles) == 0

    manager.redo()
    manager.redo()
    assert [body.id for body in manager.scenario.particles] == ["body_a", "body_b"]


def test_invalid_update_body_property_raises() -> None:
    scenario = _base_scenario()
    manager = CommandManager(scenario)
    with pytest.raises(CommandError):
        manager.apply(UpdateBodyProperty("missing", "mass", 3.0))


def test_validation_issues() -> None:
    scenario = _base_scenario()
    scenario.particles.append(
        Particle(id="dup", name="Dup", mass=-1.0, position=(0, 0, 0), velocity=(0, 0, 0))
    )
    scenario.particles.append(
        Particle(id="dup", name="Dup2", mass=1.0, position=(0, 0, 0), velocity=(0, 0, 0))
    )
    scenario.events.append(ImpulseEvent(id="kick", time=1.0, body_id="missing", delta_v=(0, 1, 0)))
    scenario.metadata["integrator"] = "bad_integrator"
    scenario.metadata["sample_every"] = 0

    issues = validate_scenario(scenario)
    assert any(issue.path == "bodies" for issue in issues)
    assert any("mass" in issue.path for issue in issues)
    assert any("events.kick.body_id" == issue.path for issue in issues)
    assert any("metadata.integrator" == issue.path for issue in issues)
    assert any("metadata.sample_every" == issue.path for issue in issues)


def test_round_trip_command_save_load(tmp_path: Path) -> None:
    scenario_path = (
        Path(__file__).resolve().parents[1] / "examples" / "scenarios" / "two_body_orbit.json"
    )
    scenario = load_scenario(scenario_path)
    manager = CommandManager(scenario)

    new_body = Particle(
        id="body_new",
        name="Body New",
        mass=3.0,
        position=(1.0, 2.0, 3.0),
        velocity=(0.0, 0.0, 0.0),
    )
    manager.apply(AddBody(new_body))

    out_path = tmp_path / "scenario.json"
    save_scenario(manager.scenario, out_path)
    reloaded = load_scenario(out_path)

    assert any(body.id == "body_new" for body in reloaded.particles)
