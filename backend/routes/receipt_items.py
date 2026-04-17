from flask import Blueprint, jsonify, g
from database.auth_middleware import require_auth
from services.receipt_item_service import (
    get_receipt_items_for_user,
    get_top_user_items,
    get_user_item_insights,
)

receipt_items_bp = Blueprint("receipt_items_bp", __name__)


@receipt_items_bp.route("/users/me/receipt-items", methods=["GET"])
@require_auth
def get_my_receipt_items():
    items = get_receipt_items_for_user(g.user["id"])
    return jsonify({"items": items}), 200


@receipt_items_bp.route("/users/me/item-preferences", methods=["GET"])
@require_auth
def get_my_item_preferences():
    items = get_top_user_items(g.user["id"], limit=15)
    insights = get_user_item_insights(g.user["id"])

    return jsonify({
        "top_items": items,
        "insights": insights
    }), 200