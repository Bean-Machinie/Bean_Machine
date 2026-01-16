from __future__ import annotations

from physics_studio.app.playback import (
    select_preview_positions,
    should_run_simulation,
    status_label,
)


def test_should_run_simulation() -> None:
    assert should_run_simulation(True, True) is True
    assert should_run_simulation(True, False) is True
    assert should_run_simulation(False, False) is True
    assert should_run_simulation(False, True) is False


def test_status_label() -> None:
    assert status_label(True, False, False) == "Needs simulation"
    assert status_label(False, True, False) == "Simulating..."
    assert status_label(False, False, True) == "Playing"
    assert status_label(False, False, False) == "Ready"


def test_select_preview_positions() -> None:
    trajectory_positions = {"a": (1.0, 0.0, 0.0)}
    scenario_positions = {"a": (0.0, 0.0, 0.0)}
    assert select_preview_positions(True, trajectory_positions, scenario_positions) == trajectory_positions
    assert select_preview_positions(False, trajectory_positions, scenario_positions) == scenario_positions
