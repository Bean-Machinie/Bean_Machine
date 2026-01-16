# Developer Setup (Windows PowerShell)

## Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## Install dependencies

```powershell
python -m pip install -e .[dev]
```

Optional UI extras:

```powershell
python -m pip install -e .[dev,ui]
```

## Run the simulator CLI

```powershell
python -m physics_studio.cli.simulate --help
```

Trajectory output uses `trajectory_v1` (see `docs/trajectory_schema_v1.md`).

## Run tests

```powershell
python -m pytest -q
```
