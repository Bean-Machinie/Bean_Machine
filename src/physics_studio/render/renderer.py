from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass

import numpy as np

from physics_studio.scenario.models import CameraState


@dataclass(frozen=True)
class RenderBody:
    id: str
    position: tuple[float, float, float]
    radius_px: int = 4


@dataclass(frozen=True)
class RenderOptions:
    width: int
    height: int
    show_timecode: bool = True
    show_labels: bool = True
    show_trails: bool = False


_FONT = {
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"],
    "7": ["111", "001", "001", "001", "001"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"],
    ":": ["000", "010", "000", "010", "000"],
    ".": ["000", "000", "000", "010", "000"],
    "-": ["000", "000", "111", "000", "000"],
    "_": ["000", "000", "000", "000", "111"],
    "?": ["111", "001", "011", "000", "010"],
}

for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    if ch not in _FONT:
        _FONT[ch] = ["111", "101", "111", "101", "101"]


def _color_from_id(body_id: str) -> tuple[int, int, int]:
    digest = hashlib.sha256(body_id.encode("utf-8")).digest()
    return (digest[0], digest[1], digest[2])


def _normalize(vec: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(vec)
    if norm == 0.0:
        return vec
    return vec / norm


def _camera_basis(camera: CameraState) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    position = np.array(camera.position, dtype=np.float64)
    target = np.array(camera.target, dtype=np.float64)
    forward = _normalize(target - position)
    if np.allclose(forward, 0.0):
        forward = np.array([0.0, 0.0, -1.0], dtype=np.float64)
    up_guess = np.array([0.0, 0.0, 1.0], dtype=np.float64)
    right = _normalize(np.cross(forward, up_guess))
    if np.allclose(right, 0.0):
        right = np.array([1.0, 0.0, 0.0], dtype=np.float64)
    up = _normalize(np.cross(right, forward))
    return right, up, forward


def project_points(
    positions: np.ndarray,
    camera: CameraState,
    width: int,
    height: int,
) -> np.ndarray:
    position = np.array(camera.position, dtype=np.float64)
    right, up, forward = _camera_basis(camera)
    translated = positions - position
    x_cam = translated @ right
    y_cam = translated @ up
    z_cam = translated @ (-forward)
    fov_rad = math.radians(camera.fov_deg)
    scale = 1.0 / math.tan(fov_rad * 0.5)
    z_cam = np.where(z_cam == 0.0, -1e-6, z_cam)
    x_ndc = (x_cam / z_cam) * scale
    y_ndc = (y_cam / z_cam) * scale
    x_pix = (x_ndc * 0.5 + 0.5) * width
    y_pix = (-y_ndc * 0.5 + 0.5) * height
    return np.stack([x_pix, y_pix, z_cam], axis=1)


def render_frame(
    bodies: list[RenderBody],
    camera: CameraState,
    options: RenderOptions,
    time_s: float | None = None,
    trails: dict[str, list[tuple[float, float, float]]] | None = None,
) -> np.ndarray:
    image = np.zeros((options.height, options.width, 3), dtype=np.uint8)
    if not bodies:
        return image

    positions = np.array([body.position for body in bodies], dtype=np.float64)
    projected = project_points(positions, camera, options.width, options.height)

    if options.show_trails and trails:
        for body in bodies:
            if body.id not in trails:
                continue
            trail_positions = np.array(trails[body.id], dtype=np.float64)
            trail_proj = project_points(trail_positions, camera, options.width, options.height)
            color = _color_from_id(body.id)
            for a, b in zip(trail_proj, trail_proj[1:]):
                _draw_line(image, int(a[0]), int(a[1]), int(b[0]), int(b[1]), color)

    for body, proj in zip(bodies, projected):
        if proj[2] <= 0:
            continue
        x = int(round(proj[0]))
        y = int(round(proj[1]))
        color = _color_from_id(body.id)
        _draw_circle(image, x, y, body.radius_px, color)
        if options.show_labels:
            _draw_text(image, x + body.radius_px + 2, y - 6, body.id.upper(), color)

    if options.show_timecode and time_s is not None:
        label = f"{time_s:0.2f}s"
        _draw_text(image, 8, 8, label.upper(), (255, 255, 255))

    return image


def _draw_circle(image: np.ndarray, cx: int, cy: int, radius: int, color: tuple[int, int, int]) -> None:
    height, width, _ = image.shape
    for y in range(cy - radius, cy + radius + 1):
        if y < 0 or y >= height:
            continue
        for x in range(cx - radius, cx + radius + 1):
            if x < 0 or x >= width:
                continue
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                image[y, x] = color


def _draw_line(
    image: np.ndarray, x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int]
) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        if 0 <= x0 < image.shape[1] and 0 <= y0 < image.shape[0]:
            image[y0, x0] = color
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def _draw_text(
    image: np.ndarray, x: int, y: int, text: str, color: tuple[int, int, int]
) -> None:
    cursor_x = x
    for ch in text:
        glyph = _FONT.get(ch, _FONT.get("?", ["000", "000", "000", "000", "000"]))
        _draw_glyph(image, cursor_x, y, glyph, color)
        cursor_x += 4


def _draw_glyph(
    image: np.ndarray, x: int, y: int, glyph: list[str], color: tuple[int, int, int]
) -> None:
    height, width, _ = image.shape
    for row, line in enumerate(glyph):
        for col, bit in enumerate(line):
            if bit != "1":
                continue
            px = x + col
            py = y + row
            if 0 <= px < width and 0 <= py < height:
                image[py, px] = color
