from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional


@dataclass(frozen=True)
class BodyPickData:
    id: str


def pick_body_screen(
    bodies: Iterable[BodyPickData],
    mouse_pos: tuple[float, float],
    screen_positions: dict[str, tuple[float, float]],
    threshold_px: float,
) -> Optional[str]:
    best_id = None
    best_dist = threshold_px
    for body in bodies:
        screen_pos = screen_positions.get(body.id)
        if screen_pos is None:
            continue
        dx = screen_pos[0] - mouse_pos[0]
        dy = screen_pos[1] - mouse_pos[1]
        dist = abs(dx) + abs(dy)
        if dist <= best_dist:
            best_dist = dist
            best_id = body.id
    return best_id
