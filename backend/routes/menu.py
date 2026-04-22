from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.menu_service import (
    get_menu_items_for_cafe,
    insert_menu_item,
    delete_menu_item,
    replace_menu_items_for_cafe,
)

menu_bp = Blueprint("menu_bp", __name__)


@menu_bp.route("/cafes/<cafe_id>/menu", methods=["GET"])
def get_cafe_menu(cafe_id):
    items = get_menu_items_for_cafe(cafe_id)
    return jsonify({
        "cafe_id": cafe_id,
        "menu_items": items
    }), 200


@menu_bp.route("/cafes/<cafe_id>/menu", methods=["PUT"])
@require_auth
def update_cafe_menu(cafe_id):
    body = request.get_json(silent=True) or {}
    items = body.get("items", [])

    if not isinstance(items, list):
        return jsonify({"error": "items must be a list"}), 400

    updated = replace_menu_items_for_cafe(cafe_id, items)

    return jsonify({
        "message": "Menu updated successfully",
        "cafe_id": cafe_id,
        "menu_items": updated
    }), 200

@menu_bp.route("/cafes/<cafe_id>/menu/items", methods=["POST"])
@require_auth
def add_menu_item(cafe_id):
    body = request.get_json()
    
    new_item = insert_menu_item(cafe_id, body)

    return jsonify({
        "message": "Item added",
        "item": new_item
    }), 201

@menu_bp.route("/menu/items/<item_id>", methods=["DELETE"])
@require_auth
def delete_single_menu_item(item_id):
    deleted = delete_menu_item(item_id)

    return jsonify({
        "message": "Item deleted",
        "deleted": deleted
    }), 200