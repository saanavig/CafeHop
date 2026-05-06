from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from collections import defaultdict
from supabase import create_client
import os
from database.auth_middleware import require_auth
from flask import g
from datetime import timezone


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/overview", methods=["GET"])
@require_auth
def get_analytics():
    print("DEBUG g:", g.__dict__)
    user_id = g.user["id"] 

    cafe_res = supabase.table("cafes") \
        .select("id") \
        .eq("owner_id", user_id) \
        .limit(1) \
        .execute()

    if not cafe_res.data:
        return jsonify({"error": "No cafe found for user"}), 400

    cafe_id = cafe_res.data[0]["id"]
    period = request.args.get("period", "today")

    now = datetime.now(timezone.utc)

    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    else:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    start = start.replace(microsecond=0)
    start_iso = start.isoformat()

    res = supabase.table("purchases") \
        .select("user_id, amount, receipt_timestamp, points_earned") \
        .eq("cafe_id", cafe_id) \
        .gte("receipt_timestamp", start_iso) \
        .execute()

    # if res.error:
    #     return jsonify({"error": str(res.error)}), 500

    rows = res.data or []

    visits = len(rows)
    revenue = sum(r.get("amount", 0) for r in rows)
    aov = revenue / visits if visits > 0 else 0

    hour_counts = defaultdict(int)

    for r in rows:
        ts = datetime.fromisoformat(r["receipt_timestamp"].replace("Z", "+00:00"))
        hour_counts[ts.hour] += 1

    today = (now.weekday() + 1) % 7

    hours_res = supabase.table("cafe_hours") \
        .select("open_time, close_time") \
        .eq("cafe_id", cafe_id) \
        .eq("day_of_week", today) \
        .execute()

    hours_data = hours_res.data or []

    if hours_data:
        open_str = hours_data[0]["open_time"]   # e.g. "08:00"
        close_str = hours_data[0]["close_time"] # e.g. "18:00"

        open_hour = int(open_str.split(":")[0])
        close_hour = int(close_str.split(":")[0])
    else:
        # fallback if no hours found
        open_hour, close_hour = 8, 20

    if close_hour < open_hour:
        hours_range = list(range(open_hour, 24)) + list(range(0, close_hour + 1))
    else:
        hours_range = range(open_hour, close_hour + 1)

    peak_hours = [
        {"hour": h, "count": hour_counts.get(h, 0)}
        for h in hours_range
    ]
    user_counts = defaultdict(int)

    for r in rows:
        user_counts[r["user_id"]] += 1

    total_users = len(user_counts)

    repeat_users = sum(1 for u in user_counts if user_counts[u] > 1)

    repeat_rate = repeat_users / total_users if total_users > 0 else 0

    # keep your existing metric (but it's actually "unique customers")
    new_customers = total_users

    rows_sorted = sorted(
        rows,
        key=lambda x: datetime.fromisoformat(x["receipt_timestamp"].replace("Z", "+00:00")),
        reverse=True
    )[:5]

    def time_ago(ts):
        delta = datetime.now(timezone.utc) - ts
        minutes = int(delta.total_seconds() / 60)
        if minutes < 60:
            return f"{minutes} min ago"
        hours = minutes // 60
        if hours < 24:
            return f"{hours}h ago"
        return "Yesterday"

    recent_visitors = [
        {
            "name": "User",
            "time": time_ago(datetime.fromisoformat(r["receipt_timestamp"].replace("Z", "+00:00"))),
            "pts": r.get("points_earned", 0)
        }
        for r in rows_sorted
    ]
    
    redeem_res = supabase.table("reward_redemptions") \
        .select("id", count="exact") \
        .eq("cafe_id", cafe_id) \
        .gte("created_at", start_iso) \
        .execute()

    redeemed = redeem_res.count or 0

    return jsonify({
        "visits": visits,
        "revenue": round(revenue, 2),
        "aov": round(aov, 2),
        "redeemed": redeemed,
        "new_customers": new_customers,
        "repeat_rate": round(repeat_rate, 2), 
        "peak_hours": peak_hours,
        "recent_visitors": recent_visitors
    })

    # # TEMP mock data (so frontend works immediately)
    # return jsonify({
    #     "visits": 47,
    #     "revenue": 423,
    #     "redeemed": 8,
    #     "new_customers": 5,
    #     "peak_hours": [
    #         {"hour": h, "count": (h % 5) + 3} for h in range(8, 20)
    #     ],
    #     "recent_visitors": [
    #         {"name": "Alice", "time": "2 min ago"},
    #         {"name": "Bob", "time": "10 min ago"}
    #     ]
    # })