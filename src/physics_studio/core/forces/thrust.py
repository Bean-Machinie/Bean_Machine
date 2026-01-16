from __future__ import annotations

import numpy as np


def compute_thrust_acceleration(
    thrusts: np.ndarray,
    masses: np.ndarray,
) -> np.ndarray:
    if thrusts.shape[0] == 0:
        return np.zeros_like(thrusts)
    return thrusts / masses.reshape(-1, 1)
