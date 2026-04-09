from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/overview", methods=["GET"])
def get_analytics():
    cafe_id = request.args.get("cafe_id")
    period = request.args.get("period", "today")

    now = datetime.utcnow()

    if period == "today":
        start = now.replace(hour=0, minute=0, second=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)

    # TEMP mock data (so frontend works immediately)
    return jsonify({
        "visits": 47,
        "revenue": 423,
        "redeemed": 8,
        "new_customers": 5,
        "peak_hours": [
            {"hour": h, "count": (h % 5) + 3} for h in range(8, 20)
        ],
        "recent_visitors": [
            {"name": "Alice", "time": "2 min ago"},
            {"name": "Bob", "time": "10 min ago"}
        ]
    })