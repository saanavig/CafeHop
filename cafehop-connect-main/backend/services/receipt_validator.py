# services/receipt_validator.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict, Any
import math

from config import supabase


TWO_MILES_METERS = 2 * 1609.344
ONE_HOUR = timedelta(hours=1)


@dataclass
class ValidationResult:
    ok: bool
    reason: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in meters."""
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _parse_iso_datetime(dt_str: str) -> Optional[datetime]:
    """
    Parse ISO 8601-ish strings.
    Accepts:
      - 2026-03-04T18:12:44Z
      - 2026-03-04T18:12:44+00:00
      - 2026-03-04T18:12:44.123Z
    Returns timezone-aware datetime in UTC.
    """
    if not dt_str:
        return None

    s = dt_str.strip()
    # Python doesn't parse trailing Z directly in fromisoformat
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"

    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None

    # If naive, assume UTC (you can change this if needed)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(timezone.utc)


def _get_cafe_coords(cafe_id: str) -> Optional[Tuple[float, float]]:
    """
    Fetch cafe latitude/longitude from Supabase.
    Assumes cafes table has latitude + longitude numeric columns.
    """
    resp = (
        supabase.table("cafes")
        .select("latitude,longitude")
        .eq("id", cafe_id)
        .limit(1)
        .execute()
    )
    rows = getattr(resp, "data", None) or []
    if not rows:
        return None

    lat = rows[0].get("latitude")
    lon = rows[0].get("longitude")
    if lat is None or lon is None:
        return None

    return float(lat), float(lon)


def validate_receipt_submission(
    *,
    user_id: Optional[str],
    cafe_id: Optional[str],
    user_lat: Optional[float],
    user_lon: Optional[float],
    receipt_timestamp_iso: Optional[str],
) -> ValidationResult:
    """
    Valid if:
      1) user_id exists
      2) distance(user, cafe) <= 2 miles
      3) now_utc - receipt_timestamp <= 1 hour
    """
    if not user_id:
        return ValidationResult(False, reason="UNAUTHORIZED", details={"msg": "User not logged in"})

    if not cafe_id:
        return ValidationResult(False, reason="NO_CAFE_MATCH", details={"msg": "Could not determine cafe_id"})

    if user_lat is None or user_lon is None:
        return ValidationResult(False, reason="MISSING_USER_LOCATION", details={"msg": "Missing user latitude/longitude"})

    cafe_coords = _get_cafe_coords(cafe_id)
    if not cafe_coords:
        return ValidationResult(False, reason="CAFE_LOCATION_MISSING", details={"msg": "Cafe lat/lon not found"})

    cafe_lat, cafe_lon = cafe_coords
    dist_m = _haversine_meters(user_lat, user_lon, cafe_lat, cafe_lon)
    if dist_m > TWO_MILES_METERS:
        return ValidationResult(
            False,
            reason="TOO_FAR_FROM_CAFE",
            details={
                "distance_meters": dist_m,
                "distance_miles": dist_m / 1609.344,
                "max_miles": 2,
            },
        )

    receipt_dt = _parse_iso_datetime(receipt_timestamp_iso or "")
    if receipt_dt is None:
        return ValidationResult(False, reason="MISSING_OR_BAD_RECEIPT_TIME", details={"msg": "Receipt timestamp missing/invalid"})

    now_utc = datetime.now(timezone.utc)
    delta = now_utc - receipt_dt
    if delta < timedelta(0):
        # receipt time in the future = suspicious / bad parse
        return ValidationResult(False, reason="RECEIPT_TIME_IN_FUTURE", details={"delta_seconds": delta.total_seconds()})

    if delta > ONE_HOUR:
        return ValidationResult(
            False,
            reason="RECEIPT_TOO_OLD",
            details={
                "age_minutes": delta.total_seconds() / 60.0,
                "max_minutes": 60,
            },
        )

    return ValidationResult(True, details={"distance_meters": dist_m, "age_minutes": delta.total_seconds() / 60.0})