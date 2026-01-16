from __future__ import annotations

import argparse
from pathlib import Path

from physics_studio.render.export import RenderJob, render_video
from physics_studio.render.presets import PRESETS
from physics_studio.scenario.io import load_scenario


def main() -> None:
    parser = argparse.ArgumentParser(description="Render a deterministic video export")
    parser.add_argument("scenario", help="Path to scenario JSON")
    parser.add_argument("output", help="Output MP4 path")
    parser.add_argument("--duration-s", type=float, help="Duration in seconds")
    parser.add_argument("--fps", type=int, help="Frames per second")
    parser.add_argument("--width", type=int, help="Frame width")
    parser.add_argument("--height", type=int, help="Frame height")
    parser.add_argument("--bitrate", type=str, help="Video bitrate (e.g. 8M)")
    parser.add_argument("--preset", choices=sorted(PRESETS.keys()), help="Render preset")
    parser.add_argument("--trails", action="store_true", help="Render trails")
    args = parser.parse_args()

    scenario_path = Path(args.scenario)
    scenario = load_scenario(scenario_path)
    if args.preset:
        preset = PRESETS[args.preset]
        width = preset.width
        height = preset.height
        fps = preset.fps if args.fps is None else args.fps
        bitrate = preset.bitrate if args.bitrate is None else args.bitrate
    else:
        width = args.width or 1280
        height = args.height or 720
        fps = args.fps or 30
        bitrate = args.bitrate or "6M"

    duration_s = args.duration_s
    if duration_s is None:
        duration_s = scenario.settings.dt * scenario.settings.steps

    job = RenderJob(
        scenario_path=scenario_path,
        output_path=Path(args.output),
        duration_s=duration_s,
        fps=fps,
        width=width,
        height=height,
        bitrate=bitrate,
        show_trails=args.trails,
    )

    print(
        f"Rendering {job.output_path} at {job.width}x{job.height}, "
        f"{job.fps} fps, duration {job.duration_s:.2f}s"
    )
    render_video(job)
    print("Render complete.")


if __name__ == "__main__":
    main()
