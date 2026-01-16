# v1 Scope Checklist

## In scope
- Deterministic fixed-step simulation loop
- Newtonian gravity for point masses
- Per-body thrust force
- Scheduled impulse and thrust-change events
- Scenario schema v1 with version field
- Migrations scaffold for future schema changes
- Headless CLI simulation -> trajectory JSON
- GUI skeleton: scenario load + object list panel
- Determinism tests with snapshot hashing
- Example scenarios for regression and demos

## Out of scope
- Collision detection / contact resolution
- Variable-step or adaptive solvers
- Multiplayer/networking
- Arbitrary scripting that bypasses determinism
- Full 3D viewport or gizmo interaction (placeholder only in v1 scaffold)
