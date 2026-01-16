from __future__ import annotations

import hashlib

from physics_studio.render.renderer import RenderBody, RenderOptions, render_frame
from physics_studio.scenario.models import CameraKeyframe, CameraTrack


def test_camera_interpolation_midpoint() -> None:
    track = CameraTrack(
        keyframes=[
            CameraKeyframe(time_s=0.0, position=(0.0, 0.0, 10.0), target=(0.0, 0.0, 0.0), fov_deg=60.0),
            CameraKeyframe(time_s=10.0, position=(10.0, 0.0, 10.0), target=(0.0, 0.0, 0.0), fov_deg=90.0),
        ]
    )
    camera = track.evaluate(5.0)
    assert camera.position == (5.0, 0.0, 10.0)
    assert camera.fov_deg == 75.0


def test_render_frame_determinism() -> None:
    track = CameraTrack(
        keyframes=[
            CameraKeyframe(time_s=0.0, position=(0.0, 0.0, 10.0), target=(0.0, 0.0, 0.0), fov_deg=60.0),
        ]
    )
    camera = track.evaluate(0.0)
    bodies = [RenderBody(id="body", position=(0.0, 0.0, 0.0), radius_px=4)]
    options = RenderOptions(width=64, height=64, show_timecode=False, show_labels=False)
    frame_a = render_frame(bodies, camera, options, time_s=0.0)
    frame_b = render_frame(bodies, camera, options, time_s=0.0)
    hash_a = hashlib.sha256(frame_a.tobytes()).hexdigest()
    hash_b = hashlib.sha256(frame_b.tobytes()).hexdigest()
    assert hash_a == hash_b
