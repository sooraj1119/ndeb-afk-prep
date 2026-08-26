"""
High impact news event filter.
Acts as a circuit breaker for the signal engine.
"""
from datetime import datetime, timedelta, timezone

# TODO: In a production environment, this should pull dynamically from a ForexFactory or similar API.
# Hardcoding dates is a known limitation that will silently fail if not manually refreshed.
HIGH_IMPACT_EVENTS = [
    # Format: datetime(Year, Month, Day, Hour, Minute, tzinfo=timezone.utc)
    datetime(2026, 8, 7, 12, 30, tzinfo=timezone.utc), # Mock NFP
    datetime(2026, 8, 12, 18, 0, tzinfo=timezone.utc)  # Mock FOMC
]

NEWS_PAUSE_MINUTES = 60

def is_safe_to_trade(current_time: datetime) -> bool:
    """
    Returns False if the current_time is within the blackout window of any high-impact event.
    """
    for event_time in HIGH_IMPACT_EVENTS:
        time_diff = abs((current_time - event_time).total_seconds()) / 60.0
        if time_diff <= NEWS_PAUSE_MINUTES:
            return False
    return True
