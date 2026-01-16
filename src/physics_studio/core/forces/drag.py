from __future__ import annotations

import numpy as np


def compute_linear_drag_acceleration(
    velocities: np.ndarray,
    drag_coefficient: float,
) -> np.ndarray:
    if drag_coefficient <= 0.0:
        return np.zeros_like(velocities)
    return -drag_coefficient * velocities
