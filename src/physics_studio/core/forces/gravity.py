from __future__ import annotations

import numpy as np

from .settings import GravitySettings


def compute_gravity_acceleration(
    positions: np.ndarray,
    masses: np.ndarray,
    settings: GravitySettings,
) -> np.ndarray:
    count = positions.shape[0]
    accel = np.zeros_like(positions)
    if count == 0:
        return accel

    soft_sq = settings.softening * settings.softening
    for i in range(count):
        for j in range(i + 1, count):
            r = positions[j] - positions[i]
            dist_sq = float(np.dot(r, r)) + soft_sq
            if dist_sq == 0.0:
                continue
            inv_dist = 1.0 / np.sqrt(dist_sq)
            inv_dist3 = inv_dist * inv_dist * inv_dist
            force = settings.G * r * inv_dist3
            accel[i] += force * masses[j]
            accel[j] -= force * masses[i]
    accel = accel / masses.reshape(-1, 1)
    return accel
