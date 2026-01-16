from __future__ import annotations

import argparse
from pathlib import Path

from physics_studio.core.run.simulator import run_simulation
from physics_studio.scenario.io import load_scenario, save_trajectory
from physics_studio.scenario.trajectory_schema import (
    build_trajectory_schema_v1,
    compute_content_hash,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a deterministic physics simulation")
    parser.add_argument("scenario", help="Path to scenario JSON")
    parser.add_argument("output", help="Path to output trajectory JSON")
    parser.add_argument("--hashes", action="store_true", help="Record snapshot hashes")
    parser.add_argument(
        "--nondeterministic-metadata",
        action="store_true",
        help="Include nondeterministic metadata such as timestamps",
    )
    args = parser.parse_args()

    scenario_path = Path(args.scenario)
    scenario = load_scenario(scenario_path)
    config = scenario.settings.to_simulation_config(record_hashes=args.hashes)
    result = run_simulation(scenario.to_system_state(), scenario.events, config)

    content_hash = compute_content_hash(scenario_path)
    trajectory = build_trajectory_schema_v1(
        trajectory=result.trajectory,
        scenario=scenario,
        config=config,
        scenario_path=args.scenario,
        content_hash=content_hash,
        integrator="semi_implicit_euler",
        sample_every=1,
        hashes=result.hashes if args.hashes else None,
        include_created_utc=args.nondeterministic_metadata,
    )

    if result.camera_markers:
        trajectory["camera_markers"] = result.camera_markers

    save_trajectory(trajectory, Path(args.output))


if __name__ == "__main__":
    main()
