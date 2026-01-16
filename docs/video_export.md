# Video Export

Physics Simulation Studio exports deterministic frames via a headless render pipeline and encodes with ffmpeg.

## Workflow

1. Load a scenario in the GUI.
2. Add camera keyframes (time, position, target, optional FOV).
3. Scrub the timeline to preview camera motion and simulated positions.
4. Export video with a preset (1080p30, 4k30, 1080p60).

## Determinism

- Simulation uses fixed-step integration.
- Camera interpolation is linear and deterministic.
- Frame rendering is deterministic for the same inputs.
- No timestamps or nondeterministic metadata are added by default.

## CLI

```bash
physics-studio-render examples/scenarios/two_body_orbit.json out/video.mp4 --preset 1080p30
```

Options:
- `--duration-s` overrides the simulated duration.
- `--fps`, `--width`, `--height` override preset values.
- `--trails` enables trajectory trails.

ffmpeg must be available on PATH.
