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

    return supabase.table("purchases").insert(row).execute(), row

# get user points
def get_user_points(user_id: str) -> int:
    res = supabase.table("purchases") \
        .select("points_earned") \
        .eq("user_id", user_id) \
        .execute()

    if not res.data:
        return 0

    return sum(p["points_earned"] for p in res.data)

# points history
def get_user_points_history(user_id: str):

    res = supabase.table("purchases") \
        .select("amount, points_earned, created_at, status, cafes(name)") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()

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
