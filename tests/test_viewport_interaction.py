from __future__ import annotations

from physics_studio.app.picking import BodyPickData, pick_body_screen
from physics_studio.authoring.commands import CommandManager, MoveBody
from physics_studio.scenario.models import Particle, Scenario, ScenarioSettings


def test_pick_body_screen() -> None:
    bodies = [BodyPickData(id="a"), BodyPickData(id="b")]
    screen_positions = {"a": (10.0, 10.0), "b": (50.0, 50.0)}
    picked = pick_body_screen(bodies, (12.0, 11.0), screen_positions, threshold_px=6)
    assert picked == "a"


def test_move_body_command_undo_redo() -> None:
    scenario = Scenario(version=1, settings=ScenarioSettings(dt=1.0, steps=10))
    scenario.particles.append(
        Particle(id="body", name="Body", mass=1.0, position=(0, 0, 0), velocity=(0, 0, 0))
    )
    manager = CommandManager(scenario)
    move = MoveBody("body", (5.0, 2.0, 0.0))
    manager.apply(move)
    assert manager.scenario.particles[0].position == (5.0, 2.0, 0.0)
    manager.undo()
    assert manager.scenario.particles[0].position == (0.0, 0.0, 0.0)
    manager.redo()
    assert manager.scenario.particles[0].position == (5.0, 2.0, 0.0)
