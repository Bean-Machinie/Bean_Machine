from __future__ import annotations

from pathlib import Path


def test_no_utf8_bom_in_sources() -> None:
    root = Path(__file__).resolve().parents[1] / "src" / "physics_studio"
    offending = []
    for path in root.rglob("*.py"):
        data = path.read_bytes()
        if data.startswith(b"\xef\xbb\xbf"):
            offending.append(str(path))
    assert not offending, f"UTF-8 BOM found in: {offending}"
