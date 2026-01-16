from __future__ import annotations

from dataclasses import dataclass

from physics_studio.core.forces.settings import GravitySettings


@dataclass(frozen=True)
class SimulationConfig:
    dt: float
    steps: int
    gravity: GravitySettings = GravitySettings()
    drag_coefficient: float = 0.0
    record_hashes: bool = False
