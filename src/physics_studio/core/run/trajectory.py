from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

import numpy as np


@dataclass
class Trajectory:
    body_ids: list[str]
    times: list[float] = field(default_factory=list)
    positions: list[list[list[float]]] = field(default_factory=list)
    velocities: list[list[list[float]]] = field(default_factory=list)

    def record(self, time: float, positions: np.ndarray, velocities: np.ndarray) -> None:
        self.times.append(float(time))
        self.positions.append(positions.tolist())
        self.velocities.append(velocities.tolist())

    def to_dict(self) -> dict:
        return {
            "body_ids": self.body_ids,
            "times": self.times,
            "positions": self.positions,
            "velocities": self.velocities,
        }

    @staticmethod
    def from_dict(data: dict) -> "Trajectory":
        traj = Trajectory(body_ids=list(data["body_ids"]))
        traj.times = list(data["times"])
        traj.positions = list(data["positions"])
        traj.velocities = list(data["velocities"])
        return traj


def build_body_order(ids: Iterable[str]) -> list[str]:
    return sorted(ids)
