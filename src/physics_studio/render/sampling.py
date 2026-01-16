from __future__ import annotations

from physics_studio.core.run.trajectory import Trajectory


def sample_trajectory(trajectory: Trajectory, time_s: float) -> list[list[float]]:
    times = trajectory.times
    if not times:
        return []
    if time_s <= times[0]:
        return trajectory.positions[0]
    if time_s >= times[-1]:
        return trajectory.positions[-1]

    for idx in range(1, len(times)):
        if times[idx] >= time_s:
            left_t = times[idx - 1]
            right_t = times[idx]
            t = (time_s - left_t) / max(right_t - left_t, 1e-9)
            left = trajectory.positions[idx - 1]
            right = trajectory.positions[idx]
            interpolated = []
            for left_body, right_body in zip(left, right):
                interpolated.append(
                    [
                        left_body[axis] + (right_body[axis] - left_body[axis]) * t
                        for axis in range(3)
                    ]
                )
            return interpolated
    return trajectory.positions[-1]
