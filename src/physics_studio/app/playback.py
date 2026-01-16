from __future__ import annotations


def advance_playback_time(
    current_time_s: float, dt_wall_s: float, playback_speed: float, duration_s: float
) -> float:
    next_time = current_time_s + dt_wall_s * playback_speed
    if duration_s <= 0:
        return 0.0
    return min(next_time, duration_s)


def should_run_simulation(needs_simulation: bool, has_trajectory: bool) -> bool:
    return needs_simulation or not has_trajectory


def status_label(needs_simulation: bool, is_simulating: bool, is_playing: bool) -> str:
    if is_simulating:
        return "Simulating..."
    if is_playing:
        return "Playing"
    if needs_simulation:
        return "Needs simulation"
    return "Ready"


def select_preview_positions(
    has_trajectory: bool,
    trajectory_positions: dict[str, tuple[float, float, float]],
    scenario_positions: dict[str, tuple[float, float, float]],
) -> dict[str, tuple[float, float, float]]:
    if has_trajectory:
        return trajectory_positions
    return scenario_positions
