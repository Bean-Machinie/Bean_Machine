# Authoring Commands

All authoring changes must flow through the command layer. The UI must not mutate the `Scenario` directly.

## Core concepts

- `Command` implements `do(scenario) -> scenario` and `undo(scenario) -> scenario`.
- `CommandManager` owns the current scenario and the undo/redo stacks.
- Commands are pure: they return a new scenario instance rather than mutating the input.

## Required usage in UI

1. Load or create a `Scenario`.
2. Create a `CommandManager` with the scenario.
3. Apply changes via `CommandManager.apply(command)`.
4. Update the UI from the manager's current scenario.
5. Wire `undo()` and `redo()` to editor actions.

## Minimal command set

- `AddBody`
- `DeleteBody`
- `UpdateBodyProperty`
- `MoveBody`
- `AddEvent`
- `DeleteEvent`
- `UpdateEventProperty`

## Validation

Use `validate_scenario(scenario)` to surface issues in the UI. Validation is read-only and must not mutate the scenario.
