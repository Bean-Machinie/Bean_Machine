from __future__ import annotations

from pathlib import Path

from physics_studio.core.run.simulator import run_simulation
from physics_studio.render.sampling import sample_index
from physics_studio.scenario.io import load_scenario


def test_sample_index_clamping() -> None:
    idx_start = sample_index(0.0, dt=1.0, sample_every=2, num_samples=5)
    idx_end = sample_index(8.0, dt=1.0, sample_every=2, num_samples=5)
    idx_over = sample_index(9.0, dt=1.0, sample_every=2, num_samples=5)
    idx_under = sample_index(-1.0, dt=1.0, sample_every=2, num_samples=5)
    assert idx_start == 0
    assert idx_end == 4
    assert idx_over == 4
    assert idx_under == 0


def test_simulated_position_differs_from_initial() -> None:
    scenario_path = Path(__file__).resolve().parents[1] / "examples" / "scenarios" / "toy_two_body_orbit.json"
    scenario = load_scenario(scenario_path)
    config = scenario.settings.to_simulation_config(record_hashes=False)
    trajectory = run_simulation(scenario.to_system_state(), scenario.events, config).trajectory
    end_time = config.dt * config.steps
    idx = sample_index(end_time, config.dt, sample_every=1, num_samples=len(trajectory.times))
    orbiter_index = trajectory.body_ids.index("orbiter")
    initial_pos = next(body.position for body in scenario.particles if body.id == "orbiter")
    final_pos = tuple(trajectory.positions[idx][orbiter_index])
    assert final_pos != initial_pos
