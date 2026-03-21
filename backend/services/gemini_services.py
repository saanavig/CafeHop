import json
from pydantic import BaseModel, ValidationError, Field
from config import gemini_model
from models.gemini_purchase import GeminiPurchase
from utils.text_utils import extract_json
from typing import Optional, List, Tuple

def build_purchase_prompt(ocr_text: str) -> str:
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
    prompt = build_purchase_prompt(ocr_text)
    resp = gemini_model.generate_content(prompt)
    raw = resp.text or ""
    json_str = extract_json(raw)

    parsed = json.loads(json_str)
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
    "wants_outlets": user_prefs.get("wants_outlets"),
    "preferred_price_level": user_prefs.get("preferred_price_level"),
    "preferred_noise_level": user_prefs.get("preferred_noise_level"),
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