import json
import re
from flask import Flask, request, jsonify, g as flask_g
from flask_cors import CORS
from pydantic import ValidationError
from services.ocr_services import ocr_image
from services.gemini_services import parse_purchase_from_image
from services.cafe_matcher import lookup_cafe_id
from services.purchase_repo import insert_purchase, add_points_to_user
from services.receipt_validator import validate_receipt_submission
from database.auth_middleware import require_auth
from routes.auth import require_role
from routes.tags import spot_bp
from routes.videos import videos_bp
from routes.purchases import purchase_bp
from routes.cafes import cafe_bp
from routes.preferences import preferences_bp
from routes.rewards import rewards_bp
from routes.reviews import reviews_bp
from routes.recommendation import recommendations_bp
from routes.profile import profile_bp
from routes.post import posts_bp
from routes.analytics import analytics_bp
from routes.nearby import nearby_bp
from routes.menu import menu_bp
from routes.receipt_items import receipt_items_bp
from routes.ai_profile import ai_profile_bp
from routes.favorites import favorites_bp



app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
)

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return "", 200

app.register_blueprint(reviews_bp, url_prefix="/api")
app.register_blueprint(cafe_bp, url_prefix="/api")
app.register_blueprint(purchase_bp, url_prefix="/api")
app.register_blueprint(spot_bp, url_prefix="/api")
app.register_blueprint(videos_bp, url_prefix="/api")
app.register_blueprint(preferences_bp, url_prefix="/api")
app.register_blueprint(rewards_bp, url_prefix="/api")
app.register_blueprint(recommendations_bp, url_prefix="/api")
app.register_blueprint(profile_bp, url_prefix="/api")
app.register_blueprint(posts_bp, url_prefix="/api")
app.register_blueprint(analytics_bp, url_prefix="/api")
app.register_blueprint(nearby_bp, url_prefix="/api")
app.register_blueprint(menu_bp, url_prefix="/api")
app.register_blueprint(receipt_items_bp, url_prefix="/api")
app.register_blueprint(ai_profile_bp, url_prefix="/api")
app.register_blueprint(favorites_bp, url_prefix="/api")


def fallback_extract_total(ocr_text: str):
    patterns = [
        r"Total\s*\$?\s*(\d+\.\d{2})",
        r"TOTAL\s*\$?\s*(\d+\.\d{2})",
        r"Grand Total\s*\$?\s*(\d+\.\d{2})",
        r"Amount Due\s*\$?\s*(\d+\.\d{2})",
    ]

    for pattern in patterns:
        match = re.search(pattern, ocr_text, re.IGNORECASE)
        if match:
            return float(match.group(1))

    return None


def success(data=None, status=200):
    return jsonify({"success": True, "data": data}), status

def error(message, status=400, extra=None):
    payload = {"success": False, "error": message}
    if extra is not None:
        payload["details"] = extra
    return jsonify(payload), status

@app.get("/")
def home():
    return "Testing CafeHop", 200

@app.get("/protected")
@require_auth
def protected():
    return jsonify({
        "message": "Authenticated",
        "user_id": flask_g.user["id"],
        "role": flask_g.user["role"],
    }), 200

@app.get("/cafes")
@require_auth
@require_role("cafe_owner")
def cafe_only():
    return jsonify({
        "message": "Welcome cafe owner",
        "user_id": flask_g.user["id"],
        "role": flask_g.user["role"],
    }), 200

@app.post("/api/receipt")
@require_auth
def receipt_upload():
    user_id = flask_g.user["id"]

    # 1) Required file
    if "file" not in request.files:
        return error("Missing file field 'file'", 400)

    file = request.files["file"]
    if not file or file.filename == "":
        return error("Empty filename", 400)

    # 2) Location
    lat_str = request.form.get("latitude")
    lon_str = request.form.get("longitude")

    if not lat_str or not lon_str:
        return error("Missing latitude/longitude", 400)

    try:
        latitude = float(lat_str)
        longitude = float(lon_str)
    except ValueError:
        return error("latitude/longitude must be numbers", 400)

    print("latitude:", latitude)
    print("longitude:", longitude)

    # 3) Gemini parse directly from image
    try:
        gemini_purchase, raw = parse_purchase_from_image(file)
    except json.JSONDecodeError:
        return error(
            "Gemini returned non-JSON",
            500,
            extra={"raw": raw if "raw" in locals() else None},
        )
    except ValidationError as ve:
        return error("Gemini schema validation failed", 422, extra=ve.errors())
    except Exception as e:
        return error("Gemini image parsing failed", 500, extra=str(e))

    print("GEMINI RAW:")
    print(raw)
    print("GEMINI PARSED:")
    print(gemini_purchase.model_dump())

    if gemini_purchase.amount is None:
        return error(
            "Could not extract total amount from receipt image",
            422,
            extra={
                "gemini_raw": raw,
                "gemini_parsed": gemini_purchase.model_dump(),
            },
        )

    # 4) Cafe match
    cafe_id = lookup_cafe_id(
        gemini_purchase.merchant_name,
        gemini_purchase.merchant_address,
    )
    if not cafe_id:
        return error(
            "Could not match cafe",
            422,
            extra={
                "merchant_name": gemini_purchase.merchant_name,
                "merchant_address": gemini_purchase.merchant_address,
            },
        )

    submission_token = gemini_purchase.receipt_number
    receipt_timestamp = gemini_purchase.receipt_timestamp

    if not submission_token:
        return error("Missing receipt_number (needed as submission_token)", 422)

    if not receipt_timestamp:
        return error("Missing receipt_timestamp (needed for time-window validation)", 422)

    # 5) Validation
    validation = validate_receipt_submission(
        user_id=user_id,
        cafe_id=cafe_id,
        user_lat=latitude,
        user_lon=longitude,
        receipt_timestamp_iso=receipt_timestamp,
    )

    if not validation.ok:
        return error(
            "Invalid receipt",
            422,
            extra={
                "reason": validation.reason,
                "details": validation.details,
            },
        )

    # 6) Insert purchase
    try:
        result, purchase_row = insert_purchase(
            user_id=user_id,
            cafe_id=cafe_id,
            amount=gemini_purchase.amount,
            status="approved",
            latitude=latitude,
            longitude=longitude,
            submission_token=submission_token,
            receipt_timestamp=receipt_timestamp,
        )
        points_earned = purchase_row["points_earned"]
        new_total = add_points_to_user(user_id, points_earned)
    except Exception as e:
        return error("Database insert failed", 500, extra=str(e))

    saved = result.data[0] if getattr(result, "data", None) else None

    return success(
        {
            "gemini": gemini_purchase.model_dump(),
            "purchase_insert": purchase_row,
            "saved": saved,
            "points_earned": points_earned,
            "total_points": new_total,
        },
        status=200,
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001, debug=True)