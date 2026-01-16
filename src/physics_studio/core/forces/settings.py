from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GravitySettings:
    G: float = 6.67430e-11
    softening: float = 0.0
