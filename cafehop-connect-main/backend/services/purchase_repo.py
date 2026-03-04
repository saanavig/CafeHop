from typing import Optional
from database.supabase_client import supabase_anon as supabase

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
    row = {
        "user_id": user_id,
        "cafe_id": cafe_id,
        "amount": amount,
        "status": status,
        "latitude": latitude,
        "longitude": longitude,
        "submission_token": submission_token,
        "receipt_timestamp": receipt_timestamp,
    }
    return supabase.table("purchases").insert(row).execute(), row