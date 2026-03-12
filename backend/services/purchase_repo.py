from typing import Optional
from database.supabase_client import supabase

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

# get user points history
def get_user_points(supabase, user_id):
    res = supabase.table("users").select("points").eq("id", user_id).single().execute()

    if not res.data:
        return None

    return res.data["points"]