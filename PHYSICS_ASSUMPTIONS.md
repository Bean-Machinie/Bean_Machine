# Physics Assumptions

## Frames and units
- Right-handed Cartesian coordinate system
- Units are SI by default: meters, kilograms, seconds
- Time is simulated with fixed step size (dt)

## Determinism
- Fixed-step integrators only
- Stable ordering for bodies and events
- Optional snapshot hashing for regression tests

## Dynamics v1 scope
- Bodies are treated as point masses for translation
- Rigid bodies store orientation data but rotational dynamics are not simulated in v1
- Gravity is Newtonian N-body
- Thrust is a per-body force vector
- Drag is optional and modeled as a simple linear term

## Exclusions
- No collision detection or contact response
- No relativistic effects
- No non-deterministic solvers or variable step sizes
