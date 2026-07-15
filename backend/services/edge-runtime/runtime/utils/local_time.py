"""Timestamps. The edge runs on local device time even when offline; everything
is recorded in UTC ISO-8601 so audit records reconcile after a late sync."""

import datetime as dt


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def now_iso() -> str:
    return utcnow().isoformat()
