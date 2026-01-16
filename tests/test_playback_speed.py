from __future__ import annotations

from physics_studio.app.playback import advance_playback_time


def test_advance_playback_time_scales_speed() -> None:
    current = 1.0
    dt_wall = 0.1
    speed = 0.25
    duration = 10.0
    next_time = advance_playback_time(current, dt_wall, speed, duration)
    assert next_time == 1.025


def test_advance_playback_time_clamps() -> None:
    current = 9.95
    dt_wall = 0.1
    speed = 1.0
    duration = 10.0
    next_time = advance_playback_time(current, dt_wall, speed, duration)
    assert next_time == duration
