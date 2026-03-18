from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from database.supabase_client import supabase
from postgrest.exceptions import APIError

reviews_bp = Blueprint("reviews_bp", __name__)


@reviews_bp.route("/cafes/<cafe_id>/reviews", methods=["GET"])
def get_cafe_reviews(cafe_id):
    try:
        response = (
            supabase.table("reviews")
            .select("*")
            .eq("cafe_id", cafe_id)
            .order("created_at", desc=True)
            .execute()
        )

        return jsonify({
            "cafe_id": cafe_id,
            "reviews": response.data or []
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reviews_bp.route("/cafes/<cafe_id>/reviews", methods=["POST"])
@require_auth
def create_review(cafe_id):
    try:
        body = request.get_json(silent=True) or {}

        rating = body.get("rating")
        review_text = body.get("review_text", "")

        if rating is None:
            return jsonify({"error": "rating is required"}), 400

        if not isinstance(rating, int):
            return jsonify({"error": "rating must be an integer"}), 400

        if rating < 1 or rating > 5:
            return jsonify({"error": "rating must be between 1 and 5"}), 400

        if review_text is not None and not isinstance(review_text, str):
            return jsonify({"error": "review_text must be a string"}), 400

        review_data = {
            "user_id": g.user["id"],
            "cafe_id": cafe_id,
            "rating": rating,
            "review_text": review_text.strip() if review_text else None,
        }

        response = supabase.table("reviews").insert(review_data).execute()

        return jsonify({
            "message": "Review created successfully",
            "data": response.data[0] if response.data else None
        }), 201

    except APIError as e:
        error_message = str(e)

        if "reviews_user_cafe_unique" in error_message:
            return jsonify({
                "error": "You have already reviewed this cafe"
            }), 409

        return jsonify({"error": error_message}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reviews_bp.route("/cafes/<cafe_id>/reviews", methods=["PUT"])
@require_auth
def update_review(cafe_id):
    try:
        body = request.get_json(silent=True) or {}

        rating = body.get("rating")
        review_text = body.get("review_text", "")

        if rating is None:
            return jsonify({"error": "rating is required"}), 400

        if not isinstance(rating, int):
            return jsonify({"error": "rating must be an integer"}), 400

        if rating < 1 or rating > 5:
            return jsonify({"error": "rating must be between 1 and 5"}), 400

        if review_text is not None and not isinstance(review_text, str):
            return jsonify({"error": "review_text must be a string"}), 400

        existing = (
            supabase.table("reviews")
            .select("id, user_id, cafe_id")
            .eq("user_id", g.user["id"])
            .eq("cafe_id", cafe_id)
            .maybe_single()
            .execute()
        )

        if not existing.data:
            return jsonify({"error": "Review not found"}), 404

        response = (
            supabase.table("reviews")
            .update({
                "rating": rating,
                "review_text": review_text.strip() if review_text else None,
                "updated_at": "now()"
            })
            .eq("id", existing.data["id"])
            .execute()
        )

        return jsonify({
            "message": "Review updated successfully",
            "data": response.data[0] if response.data else None
        }), 200

    except APIError as e:
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reviews_bp.route("/cafes/<cafe_id>/reviews/me", methods=["GET"])
@require_auth
def get_my_review_for_cafe(cafe_id):
    try:
        response = (
            supabase.table("reviews")
            .select("*")
            .eq("user_id", g.user["id"])
            .eq("cafe_id", cafe_id)
            .maybe_single()
            .execute()
        )

        return jsonify({
            "cafe_id": cafe_id,
            "review": response.data
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reviews_bp.route("/reviews/<review_id>", methods=["DELETE"])
@require_auth
def delete_review(review_id):
    try:
        existing = (
            supabase.table("reviews")
            .select("id, user_id")
            .eq("id", review_id)
            .maybe_single()
            .execute()
        )

        if not existing.data:
            return jsonify({"error": "Review not found"}), 404

        if existing.data["user_id"] != g.user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        supabase.table("reviews").delete().eq("id", review_id).execute()

        return jsonify({"message": "Review deleted successfully"}), 200

    except APIError as e:
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500