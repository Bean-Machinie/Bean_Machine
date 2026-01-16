# Next Phase TODO (Phase 2 - Authoring API + Undo/Redo)

- Define authoring command interface and base Command dataclass
- Implement command stack with undo/redo and command validation
- Add scenario mutation APIs with validation and error reporting
- Add migrations framework for schema evolution (version bump, tests)
- Add unit tests for command sequences and undo/redo integrity
- Extend events with parameter ramps (thrust ramps) and add tests
