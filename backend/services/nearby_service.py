import math
from database.supabase_client import supabase

DEFAULT_RADIUS_MILES = 5.0


def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(a))


def get_user_preferences(user_id):
    resp = (
        supabase.table("user_preferences")
        .select("""
            user_id,
            max_distance_miles,
            preferred_price_level,
            atmosphere,
            vibe,
            food_preferences,
            work_preferences
        """)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    return (resp.data or [None])[0]


def get_active_cafes():
    resp = (
        supabase.table("cafes")
        .select("""
            id,
            name,
            address,
            latitude,
            longitude,
            image_url,
            price_level,
            description,
            attributes,
            manual_tracking_enabled
        """)
        .eq("active", True)
        .execute()
    )

    return resp.data or []


def has_preferences(pref):
    if not pref:
        return False

    return any([
        pref.get("max_distance_miles") not in (None, 0),
        pref.get("preferred_price_level") is not None,
        len(pref.get("atmosphere") or []) > 0,
        len(pref.get("vibe") or []) > 0,
        len(pref.get("food_preferences") or []) > 0,
        len(pref.get("work_preferences") or []) > 0,
    ])


def normalize_attributes(attrs):
    if not isinstance(attrs, dict):
        return {}

    normalized = {}

    for k, v in attrs.items():
        if isinstance(v, list):
            normalized[k] = [str(x).strip().lower() for x in v]
        elif isinstance(v, str):
            normalized[k] = [v.strip().lower()]
        else:
            normalized[k] = v

    return normalized


def score_cafe(cafe, pref):
    if not pref:
        return 0

    score = 0
    attrs = normalize_attributes(cafe.get("attributes"))

    p_price = pref.get("preferred_price_level")
    c_price = cafe.get("price_level")

    if p_price is not None and c_price is not None:
        try:
            p_price = int(p_price)
            c_price = int(c_price)

            if c_price == p_price:
                score += 3
            elif abs(c_price - p_price) == 1:
                score += 1
        except (TypeError, ValueError):
            pass

    for key in ["atmosphere", "vibe", "food_preferences", "work_preferences"]:
        wanted = [str(x).strip().lower() for x in (pref.get(key) or [])]
        cafe_vals = attrs.get(key, [])

        if not isinstance(cafe_vals, list):
            continue

        score += len(set(wanted) & set(cafe_vals)) * 2

    work_prefs = [str(x).strip().lower() for x in (pref.get("work_preferences") or [])]

    if "wifi" in work_prefs and attrs.get("wifi") is True:
        score += 2

    if "outlets" in work_prefs and attrs.get("outlets") is True:
        score += 2

    return score


def find_nearby_cafes(user_id, user_lat, user_lon):
    preferences = get_user_preferences(user_id)
    cafes = get_active_cafes()

    use_pref = has_preferences(preferences)

    if use_pref:
        raw_radius = preferences.get("max_distance_miles")
        try:
            radius = float(raw_radius) if raw_radius is not None else DEFAULT_RADIUS_MILES
        except (TypeError, ValueError):
            radius = DEFAULT_RADIUS_MILES
    else:
        radius = DEFAULT_RADIUS_MILES

    results = []

    for cafe in cafes:
        lat = cafe.get("latitude")
        lon = cafe.get("longitude")

        if lat is None or lon is None:
            continue

        try:
            lat = float(lat)
            lon = float(lon)
        except (TypeError, ValueError):
            continue

        dist = haversine_miles(user_lat, user_lon, lat, lon)

        if dist > radius:
            continue

        score = score_cafe(cafe, preferences) if use_pref else 0

        results.append({
            **cafe,
            "distance_miles": round(dist, 2),
            "preference_score": score,
        })

    if use_pref:
        has_match = any(c["preference_score"] > 0 for c in results)

        if not has_match:
            fallback = []

            for cafe in cafes:
                lat = cafe.get("latitude")
                lon = cafe.get("longitude")

                if lat is None or lon is None:
                    continue

                try:
                    lat = float(lat)
                    lon = float(lon)
                except (TypeError, ValueError):
                    continue

                dist = haversine_miles(user_lat, user_lon, lat, lon)

                if dist > DEFAULT_RADIUS_MILES:
                    continue

                fallback.append({
                    **cafe,
                    "distance_miles": round(dist, 2),
                    "preference_score": 0,
                })

            fallback.sort(key=lambda x: x["distance_miles"])

            return {
                "used_preferences": False,
                "fallback": True,
                "message": "No cafes matched your preferences. Showing nearby cafes instead.",
                "radius_miles": DEFAULT_RADIUS_MILES,
                "count": len(fallback),
                "cafes": fallback,
            }

        results.sort(key=lambda x: (-x["preference_score"], x["distance_miles"]))
    else:
        results.sort(key=lambda x: x["distance_miles"])

    return {
        "used_preferences": use_pref,
        "fallback": False,
        "radius_miles": radius,
        "count": len(results),
        "cafes": results,
    }