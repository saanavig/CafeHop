from flask import Blueprint, jsonify, request
from services.tag_service import get_all_tags, get_cafe_tags, replace_cafe_tags
from database.auth_middleware import require_auth

spot_bp = Blueprint("spot_bp", __name__)

@spot_bp.route("/tags", methods=["GET"])
def list_tags():
    tags = get_all_tags()
    return jsonify({"tags": tags}), 200


@spot_bp.route("/cafes/<cafe_id>/tags", methods=["GET"])
def list_cafe_tags(cafe_id):
    tags = get_cafe_tags(cafe_id)
    return jsonify({"cafe_id": cafe_id, "tags": tags}), 200


@spot_bp.route("/cafes/<cafe_id>/tags", methods=["PUT"])
@require_auth
def update_cafe_tags(cafe_id):
    body = request.get_json(silent=True) or {}
    tag_ids = body.get("tag_ids", [])

    if not isinstance(tag_ids, list):
        return jsonify({"error": "tag_ids must be a list"}), 400

    updated = replace_cafe_tags(cafe_id, tag_ids)
    return jsonify({"message": "Cafe tags updated", "data": updated}), 200
