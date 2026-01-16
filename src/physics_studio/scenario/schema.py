SCHEMA_VERSION = 1

REQUIRED_TOP_LEVEL_KEYS = {"version", "settings", "bodies"}
REQUIRED_SETTINGS_KEYS = {"dt", "steps"}


class ScenarioValidationError(ValueError):
    pass


def validate_scenario_dict(data: dict) -> None:
    missing = REQUIRED_TOP_LEVEL_KEYS - data.keys()
    if missing:
        raise ScenarioValidationError(f"Missing scenario keys: {sorted(missing)}")
    settings = data.get("settings", {})
    missing_settings = REQUIRED_SETTINGS_KEYS - settings.keys()
    if missing_settings:
        raise ScenarioValidationError(f"Missing settings keys: {sorted(missing_settings)}")
    bodies = data.get("bodies", {})
    if "particles" not in bodies and "rigid_bodies" not in bodies:
        raise ScenarioValidationError("Bodies must include particles and/or rigid_bodies")
    ids = []
    for particle in bodies.get("particles", []):
        ids.append(str(particle.get("id")))
    for body in bodies.get("rigid_bodies", []):
        ids.append(str(body.get("id")))
    if len(ids) != len(set(ids)):
        raise ScenarioValidationError("Body ids must be unique")
