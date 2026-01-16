# Trajectory Schema v1

Schema identifier: `trajectory_v1`

This schema defines the deterministic trajectory output for Physics Simulation Studio.

## Top-level structure

- `schema_version`: string, always `trajectory_v1`
- `created_utc`: optional ISO8601 timestamp (only when `--nondeterministic-metadata` is used)
- `scenario`: object
  - `path`: scenario path string as provided to the CLI
  - `schema_version`: scenario schema version number
  - `content_hash`: SHA256 of the scenario file bytes
- `simulation`: object
  - `dt`: fixed simulation step in seconds
  - `steps`: number of simulation steps
  - `sample_every`: sample interval in steps (v1 outputs every step)
  - `integrator`: integrator name (e.g., `semi_implicit_euler`)
  - `units`: units preset string (v1 uses `SI`)
- `bodies`: array of body metadata in stable order
  - `id`: body id
  - `mass`: body mass (float) or `null` if unavailable
- `channels`: object of sampled arrays
  - `time_s`: array of time values in seconds
  - `position_m`: 3D array indexed as `[time][body][xyz]`
  - `velocity_mps`: 3D array indexed as `[time][body][xyz]`
  - `hashes`: optional array of snapshot hashes per sample (present when `--hashes` is enabled)

## Indexing order

All channel arrays use `time` as the first dimension. For example, `position_m[t][b]` is the XYZ position of body `b` at time sample `t`.

## Determinism

The default output is deterministic. `created_utc` is only included when explicitly requested via `--nondeterministic-metadata`.
