from __future__ import annotations

from .base import Backend
from .numpy_backend import make_numpy_backend


def get_backend(name: str | None = None) -> Backend:
    resolved = (name or "numpy").lower()
    if resolved == "numpy":
        return make_numpy_backend()
    raise ValueError(f"Unknown backend: {name}")
