# Architecture

## Layering rules
- core: pure, deterministic physics and simulation loop
- scenario: versioned schema and migrations; must not depend on UI or rendering
- authoring: command/undo layer using scenario models
- render: renderer interfaces and export pipeline
- app: GUI shell using authoring and scenario APIs
- cli: headless tools using scenario + core

## Extension points
- core.backends: numerical backend interface (NumPy default)
- core.forces: add new force models via registry
- core.integrators: add fixed-step integrators
- render.overlays: extend render overlays

## Data flow
- Scenario JSON -> scenario loader -> core state
- core run loop -> sampled trajectory
- trajectory -> renderer/video pipeline

## Determinism contract
- Fixed dt, fixed ordering, immutable input scenario
- Events are scheduled and applied in deterministic order
- Snapshot hashing supports regression tests
