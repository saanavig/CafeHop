import json
from io import BytesIO
from typing import Optional, List
from PIL import Image
from pydantic import BaseModel, Field

from config import gemini_model
from utils.text_utils import extract_json


class ReceiptLineItem(BaseModel):
    name: str
    quantity: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None


class GeminiPurchase(BaseModel):
    merchant_name: Optional[str] = None
    merchant_address: Optional[str] = None
    amount: Optional[float] = None
    receipt_timestamp: Optional[str] = None
    receipt_number: Optional[str] = None
    items: List[ReceiptLineItem] = Field(default_factory=list)


def build_purchase_prompt_from_text(ocr_text: str) -> str:
    return f"""
You are extracting structured purchase data from noisy receipt OCR text for insertion into a Postgres table named public.purchases.

Return ONLY valid JSON.
No markdown, no backticks, no explanations, no extra text.

Extract:
- merchant_name: string | null
- merchant_address: string | null
- amount: number | null
- receipt_timestamp: string | null
- receipt_number: string | null
- items: array of purchased line items

Each item must use:
- name: string
- quantity: integer | null
- price: number | null
- category: string | null

Rules for amount:
- amount must be the FINAL amount paid as a JSON number.
- ALWAYS extract the final total if it appears anywhere in the receipt.
- Look for labels like: "Total", "TOTAL", "Grand Total", "Amount", "Amount Due", "Balance Due".
- If a line contains "Total" followed by a dollar amount, extract that number.
- If multiple amounts exist, ignore item prices, subtotal, and tax; choose the final charged total.
- Only return null if there is absolutely no final total visible.

Rules for timestamp:
- If a clear date and time are present, return ISO 8601 format.
- Otherwise return null.

Rules for receipt number:
- Use a receipt/order/check/auth/reference number only if clearly present.
- Do not invent one.

Rules for address:
- Use a merchant address only if clearly present.
- Do not confuse coordinates with the merchant address.

Rules for items:
- Extract actual purchased menu items when visible.
- Ignore subtotal, tax, tip, total, discounts, payment method, card digits, and loyalty lines.
- Ignore clearly non-item metadata such as cashier name, order number, terminal ID, etc.
- If quantity is shown, return it as an integer.
- If an item price is shown, return it as a JSON number.
- category should be a simple label like "drink", "food", "dessert", or null if unclear.
- If no line items are visible, return an empty array.

OCR TEXT:
{ocr_text}

Return exactly:
{{
  "merchant_name": string | null,
  "merchant_address": string | null,
  "amount": number | null,
  "receipt_timestamp": string | null,
  "receipt_number": string | null,
  "items": [
    {{
      "name": string,
      "quantity": integer | null,
      "price": number | null,
      "category": string | null
    }}
  ]
}}
""".strip()


def build_purchase_prompt_from_image() -> str:
    return """
You are extracting structured purchase data from a receipt image for insertion into a Postgres table named public.purchases.

Return ONLY valid JSON.
No markdown, no backticks, no explanations, no extra text.

Extract:
- merchant_name: string | null
- merchant_address: string | null
- amount: number | null
- receipt_timestamp: string | null
- receipt_number: string | null
- items: array of purchased line items

Each item must use:
- name: string
- quantity: integer | null
- price: number | null
- category: string | null

Rules for amount:
- amount must be the FINAL amount paid as a JSON number.
- ALWAYS extract the final total if it appears anywhere in the receipt image.
- Look for labels like: "Total", "TOTAL", "Grand Total", "Amount", "Amount Due", "Balance Due".
- If multiple amounts exist, ignore item prices, subtotal, and tax; choose the final charged total.
- If the receipt shows a clearly emphasized final amount near the bottom, use that as the total.
- Only return null if there is absolutely no final total visible.

Rules for timestamp:
- If a clear date and time are present, return ISO 8601 format.
- Otherwise return null.

Rules for receipt number:
- Use a receipt/order/check/auth/reference number only if clearly present.
- Do not invent one.

Rules for address:
- Use a merchant address only if clearly present.
- Do not confuse coordinates with the merchant address.

Rules for items:
- Extract actual purchased menu items when visible.
- Ignore subtotal, tax, tip, total, discounts, payment method, card digits, and loyalty lines.
- Ignore clearly non-item metadata such as cashier name, order number, terminal ID, etc.
- If quantity is shown, return it as an integer.
- If an item price is shown, return it as a JSON number.
- category should be a simple label like "drink", "food", "dessert", or null if unclear.
- If no line items are visible, return an empty array.

Return exactly:
{
  "merchant_name": string | null,
  "merchant_address": string | null,
  "amount": number | null,
  "receipt_timestamp": string | null,
  "receipt_number": string | null,
  "items": [
    {
      "name": string,
      "quantity": integer | null,
      "price": number | null,
      "category": string | null
    }
  ]
}
""".strip()


def parse_purchase_from_ocr(ocr_text: str) -> tuple[GeminiPurchase, str]:
    prompt = build_purchase_prompt_from_text(ocr_text)
    resp = gemini_model.generate_content(prompt)
    raw = resp.text or ""
    json_str = extract_json(raw)

    parsed = json.loads(json_str)

    if "items" not in parsed or parsed["items"] is None:
        parsed["items"] = []

    purchase = GeminiPurchase(**parsed)
    return purchase, raw


def parse_purchase_from_image(file) -> tuple[GeminiPurchase, str]:
    """
    Accepts a Flask FileStorage object from request.files["file"].
    Sends the image directly to Gemini instead of relying on OCR text.
    """
    file.stream.seek(0)
    image_bytes = file.read()
    file.stream.seek(0)

    image = Image.open(BytesIO(image_bytes))

    prompt = build_purchase_prompt_from_image()
    resp = gemini_model.generate_content([prompt, image])
    raw = resp.text or ""
    json_str = extract_json(raw)

    parsed = json.loads(json_str)

    if "items" not in parsed or parsed["items"] is None:
        parsed["items"] = []

    purchase = GeminiPurchase(**parsed)
    return purchase, raw


class CafeReviewSummary(BaseModel):
    vibe_summary: Optional[str] = None
    positives: List[str] = Field(default_factory=list)
    negatives: List[str] = Field(default_factory=list)
    best_for: List[str] = Field(default_factory=list)


class CafeRecommendationExplanation(BaseModel):
    cafe_id: str
    explanation: str


def build_cafe_review_summary_prompt(cafe_name: str, review_rows: list[dict]) -> str:
    return f"""
You summarize cafe reviews into structured signals.

Return ONLY valid JSON. No markdown, no backticks, no explanations.

Cafe name:
{cafe_name}

Reviews:
{json.dumps(review_rows, indent=2)}

Return exactly:
{{
  "vibe_summary": string | null,
  "positives": [string, ...],
  "negatives": [string, ...],
  "best_for": [string, ...]
}}
""".strip()


def summarize_cafe_reviews_with_gemini(cafe_name: str, review_rows: Optional[List[dict]]) -> Optional[dict]:
    if not review_rows:
        return None

    prompt = build_cafe_review_summary_prompt(cafe_name, review_rows)
    resp = gemini_model.generate_content(prompt)
    raw = resp.text or ""
    json_str = extract_json(raw)

    parsed = json.loads(json_str)
    summary = CafeReviewSummary(**parsed)
    return summary.model_dump()


def build_recommendation_explanations_prompt(
    user_prefs: dict,
    user_tag_names: list[str],
    recommendations: list[dict],
) -> str:
    return f"""
You are explaining personalized cafe recommendations.

Return ONLY valid JSON. No markdown, no backticks, no explanations.

User preferences:
{json.dumps({
    "max_distance_miles": user_prefs.get("max_distance_miles"),
    "wants_wifi": user_prefs.get("wants_wifi"),
    "preferred_price_level": user_prefs.get("preferred_price_level"),
    "atmosphere": user_prefs.get("atmosphere"),
    "vibe": user_prefs.get("vibe"),
    "food_preferences": user_prefs.get("food_preferences"),
    "work_preferences": user_prefs.get("work_preferences"),
    "favorite_items": user_prefs.get("favorite_items"),
    "preferred_tags": user_tag_names
}, indent=2)}

Top cafe candidates:
{json.dumps(recommendations, indent=2)}

Return exactly:
[
  {{
    "cafe_id": string,
    "explanation": string
  }}
]
""".strip()


def generate_recommendation_explanations_with_gemini(
    user_prefs: dict,
    user_tag_names: list[str],
    recommendations: list[dict],
) -> list[dict]:
    if not recommendations:
        return []

    prompt = build_recommendation_explanations_prompt(
        user_prefs=user_prefs,
        user_tag_names=user_tag_names,
        recommendations=recommendations,
    )

    resp = gemini_model.generate_content(prompt)
    raw = resp.text or ""
    json_str = extract_json(raw)

    parsed = json.loads(json_str)

    validated = []
    for item in parsed:
        explanation = CafeRecommendationExplanation(**item)
        validated.append(explanation.model_dump())

    return validated