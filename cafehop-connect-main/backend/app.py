import json
from flask import Flask, request, jsonify, g as flask_g
from flask_cors import CORS
from pydantic import ValidationError
from services.ocr_services import ocr_image
from services.gemini_services import parse_purchase_from_ocr
from services.cafe_matcher import lookup_cafe_id
from services.purchase_repo import insert_purchase
from services.receipt_validator import validate_receipt_submission
from database.auth_middleware import require_auth
from routes.auth import require_role  

app = Flask(__name__)
CORS(app)

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
    # 1) Auth (middleware sets flask_g.user)
    user_id = flask_g.user["id"]

    # 2) Required file
    if "file" not in request.files:
        return error("Missing file field 'file'", 400)

    file = request.files["file"]
    if not file or file.filename == "":
        return error("Empty filename", 400)

    lat_str = "40.743"
    lon_str = "-74.032"

    try:
        latitude = float(lat_str)
        longitude = float(lon_str)
    except ValueError:
        return error("latitude/longitude must be numbers", 400)

    # 4) OCR
    ocr_text = ocr_image(file.stream)
    if not ocr_text:
        return error("No text found", 422)

    # 5) Gemini parse
    try:
        gemini_purchase, raw = parse_purchase_from_ocr(ocr_text)
    except json.JSONDecodeError:
        return error("Gemini returned non-JSON", 500, extra={"raw": raw if "raw" in locals() else None})
    except ValidationError as ve:
        return error("Gemini schema validation failed", 422, extra=ve.errors())

    if gemini_purchase.amount is None:
        return error(
            "Could not extract total amount from receipt",
            422,
            extra={"ocrText": ocr_text, "gemini_raw": raw},
        )

    # 6) Cafe match
    cafe_id = lookup_cafe_id(gemini_purchase.merchant_name, gemini_purchase.merchant_address)
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
            extra={"reason": validation.reason, "details": validation.details},
        )

    result, purchase_row = insert_purchase(
        user_id=user_id,
        cafe_id=cafe_id,
        amount=gemini_purchase.amount,
        status="Approved",
        latitude=latitude,
        longitude=longitude,
        submission_token=submission_token,
        receipt_timestamp=receipt_timestamp,
    )

    saved = result.data[0] if getattr(result, "data", None) else None

    return success({
        "ocrText": ocr_text,
        "gemini": gemini_purchase.model_dump(),
        "purchase_insert": purchase_row,
        "saved": saved,
    }, status=200)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001, debug=True)