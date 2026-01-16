from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path

from physics_studio.core.run.simulator import run_simulation
from physics_studio.render.renderer import RenderBody, RenderOptions, render_frame
from physics_studio.render.sampling import sample_trajectory
from physics_studio.scenario.io import load_scenario


@dataclass(frozen=True)
class RenderJob:
    scenario_path: Path
    output_path: Path
    duration_s: float
    fps: int
    width: int
    height: int
    bitrate: str
    show_trails: bool = False


def render_video(job: RenderJob) -> None:
    scenario = load_scenario(job.scenario_path)
    config = scenario.settings.to_simulation_config(record_hashes=False)
    result = run_simulation(scenario.to_system_state(), scenario.events, config)
    trajectory = result.trajectory

    frame_count = int(round(job.duration_s * job.fps))
    options = RenderOptions(
        width=job.width,
        height=job.height,
        show_timecode=True,
        show_labels=True,
        show_trails=job.show_trails,
    )

    body_lookup = {
        body.id: body for body in scenario.particles + scenario.rigid_bodies
    }
    body_ids = trajectory.body_ids

    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "rawvideo",
        "-pixel_format",
        "rgb24",
        "-video_size",
        f"{job.width}x{job.height}",
        "-framerate",
        str(job.fps),
        "-i",
        "-",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-b:v",
        job.bitrate,
        str(job.output_path),
    ]

    process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)
    if process.stdin is None:
        raise RuntimeError("Failed to open ffmpeg stdin")

    for frame_index in range(frame_count):
        time_s = frame_index / job.fps
        positions = sample_trajectory(trajectory, time_s)
        bodies = [
            RenderBody(
                id=body_id,
                position=tuple(positions[index]),
                radius_px=6 if body_lookup.get(body_id, None) else 4,
            )
            for index, body_id in enumerate(body_ids)
        ]
        trails = None
        if job.show_trails:
            trails = _build_trails(trajectory, time_s)
        camera = scenario.camera_track.evaluate(time_s)
        frame = render_frame(bodies, camera, options, time_s=time_s, trails=trails)
        process.stdin.write(frame.tobytes(order="C"))

    process.stdin.close()
    process.wait()
    if process.returncode != 0:
        raise RuntimeError(f"ffmpeg failed with exit code {process.returncode}")


def _build_trails(trajectory, time_s: float) -> dict[str, list[tuple[float, float, float]]]:
    trails: dict[str, list[tuple[float, float, float]]] = {bid: [] for bid in trajectory.body_ids}
    for time_index, t in enumerate(trajectory.times):
        if t > time_s:
            break
        for body_index, body_id in enumerate(trajectory.body_ids):
            trails[body_id].append(tuple(trajectory.positions[time_index][body_index]))
    return trails
