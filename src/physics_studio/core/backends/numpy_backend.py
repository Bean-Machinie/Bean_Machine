from __future__ import annotations

import numpy as np

from .base import Backend


def make_numpy_backend() -> Backend:
    return Backend(name="numpy", np=np)
