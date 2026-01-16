from __future__ import annotations

import hashlib
import numpy as np


def hash_state(step_index: int, positions: np.ndarray, velocities: np.ndarray) -> str:
    hasher = hashlib.sha256()
    hasher.update(step_index.to_bytes(8, byteorder="little", signed=False))
    hasher.update(positions.astype(np.float64).tobytes(order="C"))
    hasher.update(velocities.astype(np.float64).tobytes(order="C"))
    return hasher.hexdigest()
