from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RenderPreset:
    name: str
    width: int
    height: int
    fps: int
    bitrate: str


PRESETS = {
    "1080p30": RenderPreset(name="1080p30", width=1920, height=1080, fps=30, bitrate="8M"),
    "4k30": RenderPreset(name="4k30", width=3840, height=2160, fps=30, bitrate="20M"),
    "1080p60": RenderPreset(name="1080p60", width=1920, height=1080, fps=60, bitrate="12M"),
}
