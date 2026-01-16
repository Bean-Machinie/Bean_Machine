# Viewport Interaction (Phase 3)

This document describes minimal selection and translation behavior in the GUI.

## Selection

- Clicking a body in the viewport selects it.
- Selecting an item in the object list also selects the body.
- Selected bodies are highlighted in the viewport.

## Translation

- Dragging a selected body moves it in the XY plane.
- During drag, the viewport shows a preview position without mutating the scenario.
- On drag release, a single `MoveBody` command is applied to the `CommandManager`.
- Undo/Redo restores the original position and re-applies the move.

## Determinism and architecture

- The core engine remains headless and unchanged.
- All edits flow through the command system.
