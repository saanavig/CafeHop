import json
from pydantic import ValidationError
from config import gemini_model
from models.gemini_purchase import GeminiPurchase
from utils.text_utils import extract_json

def build_prompt(ocr_text: str) -> str:
    # NOTE: include merchant_address + receipt_number now
    return f"""
You are extracting structured purchase data from receipt OCR text for insertion into a Postgres table named public.purchases.

Return ONLY valid JSON. No markdown, no backticks, no explanations.

We need:
- merchant_name: string | null
- merchant_address: string | null
- amount: number | null  (TOTAL amount paid, e.g. 5.67)
- receipt_timestamp: string | null (ISO 8601 if present; else null)
- receipt_number: string | null (receipt/order/check number if present; else null)

Rules:
- amount must be a number, not a string.
- Prefer the final charged amount labeled like "Total", "Amount", "Balance Due".
- Do NOT invent address, timestamp, or receipt_number.

OCR TEXT:
{ocr_text}

Return exactly:
{{
  "merchant_name": string | null,
  "merchant_address": string | null,
  "amount": number | null,
  "receipt_timestamp": string | null,
  "receipt_number": string | null
}}
""".strip()

def parse_purchase_from_ocr(ocr_text: str) -> tuple[GeminiPurchase, str]:
    prompt = build_prompt(ocr_text)
    resp = gemini_model.generate_content(prompt)
    raw = resp.text or ""
    json_str = extract_json(raw)

    parsed = json.loads(json_str)
    purchase = GeminiPurchase(**parsed)
    return purchase, raw