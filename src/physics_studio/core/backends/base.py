from __future__ import annotations

from dataclasses import dataclass
from types import ModuleType


@dataclass(frozen=True)
class Backend:
    name: str
    np: ModuleType
