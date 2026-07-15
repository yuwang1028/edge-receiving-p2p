"""Short, human-legible ids for cases / extractions / decisions / events."""

import uuid


def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"
