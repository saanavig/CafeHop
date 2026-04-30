from typing import Optional
from database.supabase_client import supabase_admin as supabase

def calculate_points(amount: float) -> int:
    # loyalty rule: $1 = 10 points
    return int(amount * 10)

def insert_purchase(
    *,
    user_id: Optional[str],
    cafe_id: Optional[str],
    amount: float,
    status: str,
    latitude: float,
    longitude: float,
    submission_token: str,
    receipt_timestamp: str,
):
    points = calculate_points(amount)

    row = {
        "user_id": user_id,
        "cafe_id": cafe_id,
        "amount": amount,
        "status": status,
        "latitude": latitude,
        "longitude": longitude,
        "submission_token": submission_token,
        "receipt_timestamp": receipt_timestamp,
        "points_earned": points,
    }

    result = supabase.table("purchases").insert(row).execute()
    return result, row

def add_points_to_user(user_id: str, points_to_add: int) -> int:
    res = (
        supabase.table("user_points")
        .select("total_points")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if not res.data:
        new_total = points_to_add
        supabase.table("user_points").insert({
            "user_id": user_id,
            "total_points": new_total
        }).execute()
        return new_total

    current_points = res.data[0]["total_points"] or 0
    new_total = current_points + points_to_add

    (
        supabase.table("user_points")
        .update({"total_points": new_total})
        .eq("user_id", user_id)
        .execute()
    )

    return new_total

def get_user_points(user_id: str):
    res = supabase.table("user_points") \
        .select("total_points") \
        .eq("user_id", user_id) \
        .maybe_single() \
        .execute()

    if not res.data:
        # create row
        supabase.table("user_points").insert({
            "user_id": user_id,
            "total_points": 0,
            "tier": "bronze"
        }).execute()
        return 0

    return res.data["total_points"]

def get_user_points_history(user_id: str):
    res = (
        supabase.table("purchases")
        .select("amount, points_earned, created_at, status, cafes(name)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    if not res.data:
        return []

    history = []
    for p in res.data:
        history.append({
            "cafe_name": p["cafes"]["name"] if p.get("cafes") else None,
            "amount": p["amount"],
            "points_earned": p["points_earned"],
            "date": p["created_at"],
            "status": p["status"]
        })

    return history