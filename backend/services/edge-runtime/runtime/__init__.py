"""Edge runtime package.

Bootstraps sys.path so the sibling backend services that the blueprint keeps
separate — `rules-engine/` and `audit/` (hyphenated dir names, so not importable
as packages) — can be imported as flat modules (`import engine`,
`import audit_package_generator`). This runs on first `import runtime.*`, before
any route module imports those, so the edge embeds the deterministic rules engine
and audit builder for offline operation.
"""

import pathlib
import sys

_SERVICES = pathlib.Path(__file__).resolve().parents[2]  # backend/services

for _name in ("rules-engine", "audit"):
    _p = str(_SERVICES / _name)
    if _p not in sys.path:
        sys.path.insert(0, _p)
