from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .models import CameraMarkerEvent, Event, ImpulseEvent, ThrustChangeEvent


@dataclass(frozen=True)
class ScheduledEvent:
    step_index: int
    event: Event


@dataclass(frozen=True)
class EventSchedule:
    by_step: dict[int, list[Event]]

    def events_at(self, step_index: int) -> list[Event]:
        return self.by_step.get(step_index, [])


def build_schedule(events: Iterable[Event], dt: float) -> EventSchedule:
    by_step: dict[int, list[Event]] = {}
    for event in events:
        step_index = int(round(event.time / dt))
        by_step.setdefault(step_index, []).append(event)
    for step_index, items in by_step.items():
        items.sort(key=lambda e: e.id)
    return EventSchedule(by_step=by_step)


def parse_event(data: dict) -> Event:
    event_type = str(data["type"]).lower()
    if event_type == "impulse":
        return ImpulseEvent.from_dict(data)
    if event_type == "thrust_change":
        return ThrustChangeEvent.from_dict(data)
    if event_type == "camera_marker":
        return CameraMarkerEvent.from_dict(data)
    raise ValueError(f"Unknown event type: {event_type}")
