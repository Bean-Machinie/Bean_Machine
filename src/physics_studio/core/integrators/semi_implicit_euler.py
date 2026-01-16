from __future__ import annotations

import numpy as np


def step(positions: np.ndarray, velocities: np.ndarray, accelerations: np.ndarray, dt: float) -> None:
    velocities += accelerations * dt
    positions += velocities * dt
