import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from pydantic import ValidationError

from services.ocr_services import ocr_image
from services.gemini_services import parse_purchase_from_ocr
from services.cafe_matcher import lookup_cafe_id
from services.purchase_repo import insert_purchase
from services.receipt_validator import validate_receipt_submission
from utils.auth_utils import get_user_id


app = Flask(__name__)
CORS(app)

@app.post("/api/receipt")
def receipt_upload():
    # 1) Auth
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # 2) Required: file
    if "file" not in request.files:
        return jsonify({"error": "Missing file field 'file'"}), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # 3) Required: user location for 2-mile validation
    lat_str = 40.743
    lon_str = -73.985
    if lat_str is None or lon_str is None:
        return jsonify({"error": "Missing latitude/longitude"}), 400

    try:
        latitude = float(lat_str)
        longitude = float(lon_str)
    except ValueError:
        return jsonify({"error": "latitude/longitude must be numbers"}), 400

    # 4) OCR
    ocr_text = ocr_image(file.stream)
    if not ocr_text:
        return jsonify({"error": "No text found"}), 422

    # 5) Gemini parse (with safety)
    try:
        g, raw = parse_purchase_from_ocr(ocr_text)
    except json.JSONDecodeError:
        return jsonify({"error": "Gemini returned non-JSON"}), 500
    except ValidationError as ve:
        return jsonify({"error": "Gemini schema validation failed", "details": ve.errors()}), 422

    if g.amount is None:
        return jsonify({
            "error": "Could not extract total amount from receipt",
            "ocrText": ocr_text,
            "gemini_raw": raw
        }), 422

    # 6) Cafe match (name + address)
    cafe_id = lookup_cafe_id(g.merchant_name, g.merchant_address)
    if not cafe_id:
        return jsonify({"error": "Could not match cafe", "merchant_name": g.merchant_name}), 422

    # 7) Required fields for DB + validation
    submission_token = g.receipt_number 
    receipt_timestamp = g.receipt_timestamp  # must exist for "printed within last hour" rule

    # 8) Validate receipt rules BEFORE insert
    validation = validate_receipt_submission(
        user_id=user_id,
        cafe_id=cafe_id,
        user_lat=latitude,
        user_lon=longitude,
        receipt_timestamp_iso=receipt_timestamp,
    )

    if not validation.ok:
        return jsonify({
            "error": "Invalid receipt",
            "reason": validation.reason,
            "details": validation.details,
        }), 422

    # If receipt timestamp is missing, you can either reject (current behavior) or fallback to now_iso()
    # Here we set it after validation so DB insert always has a value.
    receipt_timestamp = receipt_timestamp

    # 9) Insert
    result, purchase_row = insert_purchase(
        user_id=user_id,
        cafe_id=cafe_id,
        amount=g.amount,
        status="Approved",
        latitude=latitude,
        longitude=longitude,
        submission_token=submission_token,
        receipt_timestamp=receipt_timestamp,
    )

    saved = result.data[0] if getattr(result, "data", None) else None

    return jsonify({
        "ocrText": ocr_text,
        "gemini": g.model_dump(),
        "purchase_insert": purchase_row,
        "saved": saved,
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001, debug=True)