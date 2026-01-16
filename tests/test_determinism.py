from __future__ import annotations

from pathlib import Path

from physics_studio.core.run.simulator import run_simulation
from physics_studio.scenario.io import load_scenario
from physics_studio.scenario.trajectory_schema import (
    build_trajectory_schema_v1,
    compute_content_hash,
)


def test_deterministic_hashes() -> None:
    scenario_path = Path(__file__).resolve().parents[1] / "examples" / "scenarios" / "two_body_orbit.json"
    scenario = load_scenario(scenario_path)
    config = scenario.settings.to_simulation_config(record_hashes=True)

    result_a = run_simulation(scenario.to_system_state(), scenario.events, config)
    result_b = run_simulation(scenario.to_system_state(), scenario.events, config)

    assert result_a.hashes == result_b.hashes
    assert len(result_a.hashes) == config.steps + 1

    content_hash = compute_content_hash(scenario_path)
    payload = build_trajectory_schema_v1(
        trajectory=result_a.trajectory,
        scenario=scenario,
        config=config,
        scenario_path=str(scenario_path),
        content_hash=content_hash,
        integrator="semi_implicit_euler",
        sample_every=1,
        hashes=result_a.hashes,
    )

    assert payload["schema_version"] == "trajectory_v1"
    assert "created_utc" not in payload
    assert payload["simulation"]["dt"] == config.dt
    assert payload["simulation"]["steps"] == config.steps
    assert payload["channels"]["time_s"][0] == 0.0
    assert len(payload["channels"]["time_s"]) == config.steps + 1
    assert len(payload["channels"]["position_m"]) == config.steps + 1
    assert len(payload["channels"]["position_m"][0]) == len(payload["bodies"])
