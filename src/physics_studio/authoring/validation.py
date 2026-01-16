from __future__ import annotations

from dataclasses import dataclass
import math

from physics_studio.core.events.models import ImpulseEvent, ThrustChangeEvent
from physics_studio.scenario.models import Scenario


@dataclass(frozen=True)
class ValidationIssue:
    severity: str
    path: str
    message: str


_ALLOWED_INTEGRATORS = {"semi_implicit_euler", "rk4"}


def _is_invalid_number(value: float) -> bool:
    return math.isnan(value) or math.isinf(value)


def validate_scenario(scenario: Scenario) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    body_ids = []
    for body in scenario.particles + scenario.rigid_bodies:
        if not body.id:
            issues.append(ValidationIssue("error", "bodies", "Body id is required"))
        body_ids.append(body.id)
        if body.mass <= 0 or _is_invalid_number(body.mass):
            issues.append(ValidationIssue("error", f"bodies.{body.id}.mass", "Mass must be > 0"))
        for axis, value in enumerate(body.position):
            if _is_invalid_number(value):
                issues.append(
                    ValidationIssue(
                        "error", f"bodies.{body.id}.position.{axis}", "Position must be finite"
                    )
                )
        for axis, value in enumerate(body.velocity):
            if _is_invalid_number(value):
                issues.append(
                    ValidationIssue(
                        "error", f"bodies.{body.id}.velocity.{axis}", "Velocity must be finite"
                    )
                )

    if len(set(body_ids)) != len(body_ids):
        issues.append(ValidationIssue("error", "bodies", "Duplicate body ids found"))

    if scenario.settings.dt <= 0:
        issues.append(ValidationIssue("error", "settings.dt", "dt must be > 0"))
    if scenario.settings.steps <= 0:
        issues.append(ValidationIssue("error", "settings.steps", "steps must be > 0"))

    sample_every = scenario.metadata.get("sample_every", 1)
    if not isinstance(sample_every, int) or sample_every < 1:
        issues.append(
            ValidationIssue("error", "metadata.sample_every", "sample_every must be >= 1")
        )

    integrator = scenario.metadata.get("integrator", "semi_implicit_euler")
    if integrator not in _ALLOWED_INTEGRATORS:
        issues.append(
            ValidationIssue(
                "error",
                "metadata.integrator",
                f"Integrator must be one of {sorted(_ALLOWED_INTEGRATORS)}",
            )
        )

    known_ids = set(body_ids)
    for event in scenario.events:
        if isinstance(event, (ImpulseEvent, ThrustChangeEvent)):
            if event.body_id not in known_ids:
                issues.append(
                    ValidationIssue(
                        "error",
                        f"events.{event.id}.body_id",
                        f"Unknown body id: {event.body_id}",
                    )
                )

    return issues
