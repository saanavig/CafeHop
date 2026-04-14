import re
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
from typing import Optional

from database.supabase_client import supabase


ITEM_STOPWORDS = {
    "the",
    "and",
    "with",
    "for",
    "extra",
    "add",
    "added",
    "modifier",
    "size",
    "small",
    "medium",
    "large",
    "hot",
    "iced",
    "ice",
    "cup",
    "oz",
    "item",
    "items",
}


CATEGORY_KEYWORDS = {
    "matcha": "tea",
    "tea": "tea",
    "chai": "tea",
    "latte": "coffee",
    "espresso": "coffee",
    "americano": "coffee",
    "cappuccino": "coffee",
    "mocha": "coffee",
    "coffee": "coffee",
    "croissant": "pastry",
    "muffin": "pastry",
    "scone": "pastry",
    "cookie": "dessert",
    "brownie": "dessert",
    "cake": "dessert",
    "sandwich": "sandwich",
    "panini": "sandwich",
    "wrap": "sandwich",
    "smoothie": "smoothie",
    "juice": "juice",
    "boba": "boba",
}


def normalize_text_token(value):
    if not value:
        return None

    cleaned = re.sub(r"[^a-zA-Z0-9\s&/\-]", "", str(value).strip().lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or None


def safe_int(value, default=None):
    try:
        if value is None:
            return default
        return int(value)
    except Exception:
        return default


def safe_decimal(value, default=None):
    if value is None or value == "":
        return default

    try:
        cleaned = str(value).replace("$", "").replace(",", "").strip()
        return Decimal(cleaned)
    except (InvalidOperation, ValueError, TypeError):
        return default


def normalize_item_name(name):
    token = normalize_text_token(name)
    if not token:
        return None

    token = re.sub(r"\b\d+\s?oz\b", "", token)
    token = re.sub(r"\bsmall\b|\bmedium\b|\blarge\b", "", token)
    token = re.sub(r"\bhot\b|\biced\b|\bice\b", "", token)
    token = re.sub(r"\s+", " ", token).strip()

    return token or None


def infer_item_category(item_name, provided_category=None):
    category = normalize_text_token(provided_category)
    if category:
        return category

    normalized_name = normalize_item_name(item_name)
    if not normalized_name:
        return "other"

    for keyword, mapped_category in CATEGORY_KEYWORDS.items():
        if keyword in normalized_name:
            return mapped_category

    return "other"


def build_item_attributes(item_name, item_category=None):
    text = " ".join(filter(None, [
        normalize_item_name(item_name),
        normalize_text_token(item_category),
    ]))

    return {
        "contains_matcha": "matcha" in text,
        "contains_chai": "chai" in text,
        "contains_coffee": any(
            word in text for word in
            ["coffee", "espresso", "latte", "americano", "mocha", "cappuccino"]
        ),
        "is_pastry": any(
            word in text for word in
            ["croissant", "muffin", "scone", "pastry", "danish"]
        ),
        "is_dessert": any(
            word in text for word in
            ["cookie", "cake", "brownie", "dessert", "cheesecake"]
        ),
        "is_tea": any(word in text for word in ["tea", "matcha", "chai"]),
        "is_sandwich": any(word in text for word in ["sandwich", "panini", "wrap"]),
        "is_sweet": any(
            word in text for word in
            ["vanilla", "caramel", "strawberry", "chocolate", "mocha", "honey"]
        ),
    }


def clean_receipt_item_row(row):
    item_name = row.get("item_name") or row.get("name")
    normalized_name = normalize_item_name(item_name)
    item_category = infer_item_category(
        item_name=item_name,
        provided_category=row.get("item_category") or row.get("category"),
    )

    return {
        **row,
        "item_name": item_name,
        "normalized_name": normalized_name,
        "quantity": safe_int(row.get("quantity"), 1) or 1,
        "item_price": safe_decimal(row.get("item_price") or row.get("price")),
        "item_category": item_category,
        "attributes": build_item_attributes(item_name, item_category),
    }


def parse_receipt_items_from_purchase_model(purchase):
    """
    Works with GeminiPurchase objects after you expand them to include .items.
    Also works with dict-like objects.
    """
    raw_items = []

    if hasattr(purchase, "items"):
        raw_items = getattr(purchase, "items") or []
    elif isinstance(purchase, dict):
        raw_items = purchase.get("items") or []

    cleaned_items = []

    for item in raw_items:
        if hasattr(item, "model_dump"):
            item = item.model_dump()
        elif hasattr(item, "dict"):
            item = item.dict()

        if not isinstance(item, dict):
            continue

        cleaned = clean_receipt_item_row({
            "item_name": item.get("item_name") or item.get("name"),
            "quantity": item.get("quantity"),
            "item_price": item.get("item_price") or item.get("price"),
            "item_category": item.get("item_category") or item.get("category"),
        })

        if cleaned.get("normalized_name"):
            cleaned_items.append(cleaned)

    return cleaned_items


def get_receipt_items_for_purchase(purchase_id: str):
    response = (
        supabase.table("receipt_items")
        .select("*")
        .eq("purchase_id", purchase_id)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data or []


def get_receipt_items_for_user(user_id: str, limit=500):
    response = (
        supabase.table("receipt_items")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


def insert_receipt_items(
    purchase_id: str,
    user_id: str,
    cafe_id: Optional[str],
    items: list[dict],
):
    rows_to_insert = []

    for item in items:
        cleaned = clean_receipt_item_row(item)
        normalized_name = cleaned.get("normalized_name")

        if not normalized_name:
            continue

        row = {
            "purchase_id": purchase_id,
            "user_id": user_id,
            "cafe_id": cafe_id,
            "item_name": cleaned["item_name"],
            "quantity": cleaned["quantity"],
            "item_price": float(cleaned["item_price"]) if cleaned["item_price"] is not None else None,
            "normalized_name": normalized_name,
            "item_category": cleaned["item_category"],
        }
        rows_to_insert.append(row)

    if not rows_to_insert:
        return []

    response = supabase.table("receipt_items").insert(rows_to_insert).execute()
    return response.data or []


def replace_receipt_items_for_purchase(
    purchase_id: str,
    user_id: str,
    cafe_id: Optional[str],
    items: list[dict],
):
    supabase.table("receipt_items").delete().eq("purchase_id", purchase_id).execute()

    inserted = insert_receipt_items(
        purchase_id=purchase_id,
        user_id=user_id,
        cafe_id=cafe_id,
        items=items,
    )

    update_user_item_preferences(user_id)
    return inserted


def aggregate_user_item_preferences_from_receipts(user_id: str):
    rows = get_receipt_items_for_user(user_id, limit=1000)

    item_counter = Counter()
    latest_order = {}
    category_counter = Counter()
    cafe_item_counter = defaultdict(Counter)

    for row in rows:
        normalized_name = normalize_item_name(
            row.get("normalized_name") or row.get("item_name")
        )
        if not normalized_name:
            continue

        quantity = safe_int(row.get("quantity"), 1) or 1
        item_counter[normalized_name] += quantity

        item_category = normalize_text_token(row.get("item_category"))
        if item_category:
            category_counter[item_category] += quantity

        created_at = row.get("created_at")
        if normalized_name not in latest_order:
            latest_order[normalized_name] = created_at
        elif created_at and latest_order[normalized_name] and created_at > latest_order[normalized_name]:
            latest_order[normalized_name] = created_at

        cafe_id = row.get("cafe_id")
        if cafe_id:
            cafe_item_counter[cafe_id][normalized_name] += quantity

    aggregated_rows = []
    for normalized_item, order_count in item_counter.items():
        item_category = infer_item_category(normalized_item)
        score = float(order_count)

        aggregated_rows.append({
            "user_id": user_id,
            "normalized_item": normalized_item,
            "score": score,
            "order_count": int(order_count),
            "last_ordered_at": latest_order.get(normalized_item),
            "item_category": item_category,
        })

    aggregated_rows.sort(
        key=lambda row: (row["score"], row["order_count"], row["normalized_item"]),
        reverse=True,
    )

    return {
        "items": aggregated_rows,
        "favorite_categories": [name for name, _ in category_counter.most_common(10)],
        "by_cafe": {
            cafe_id: dict(counter)
            for cafe_id, counter in cafe_item_counter.items()
        },
    }


def update_user_item_preferences(user_id: str):
    """
    Rebuild user_item_preferences from receipt_items.
    """
    aggregated = aggregate_user_item_preferences_from_receipts(user_id)
    rows = aggregated["items"]

    try:
        supabase.table("user_item_preferences").delete().eq("user_id", user_id).execute()
    except Exception:
        return {
            "updated": False,
            "reason": "user_item_preferences table missing or inaccessible",
            "items": rows,
        }

    if not rows:
        return {
            "updated": True,
            "count": 0,
            "items": [],
        }

    response = supabase.table("user_item_preferences").insert(rows).execute()
    inserted = response.data or []

    return {
        "updated": True,
        "count": len(inserted),
        "items": inserted,
    }


def sync_purchase_items_and_preferences(
    purchase_id: str,
    user_id: str,
    cafe_id: Optional[str],
    purchase,
):
    """
    One-call helper after Gemini receipt parsing:
    1. read purchase.items
    2. store them in receipt_items
    3. rebuild user_item_preferences
    """
    items = parse_receipt_items_from_purchase_model(purchase)

    inserted_items = replace_receipt_items_for_purchase(
        purchase_id=purchase_id,
        user_id=user_id,
        cafe_id=cafe_id,
        items=items,
    )

    pref_result = update_user_item_preferences(user_id)

    return {
        "receipt_items": inserted_items,
        "preference_update": pref_result,
    }


def get_top_user_items(user_id: str, limit=10):
    try:
        response = (
            supabase.table("user_item_preferences")
            .select("*")
            .eq("user_id", user_id)
            .order("score", desc=True)
            .order("order_count", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
    except Exception:
        aggregated = aggregate_user_item_preferences_from_receipts(user_id)
        return aggregated["items"][:limit]


def get_user_item_insights(user_id: str):
    aggregated = aggregate_user_item_preferences_from_receipts(user_id)
    top_items = aggregated["items"][:10]
    favorite_categories = aggregated["favorite_categories"]

    traits = {
        "matcha_affinity": False,
        "chai_affinity": False,
        "coffee_affinity": False,
        "pastry_affinity": False,
    }

    for item in top_items:
        normalized_item = item.get("normalized_item", "")
        if "matcha" in normalized_item:
            traits["matcha_affinity"] = True
        if "chai" in normalized_item:
            traits["chai_affinity"] = True
        if any(word in normalized_item for word in ["latte", "coffee", "espresso", "americano", "mocha", "cappuccino"]):
            traits["coffee_affinity"] = True
        if any(word in normalized_item for word in ["croissant", "muffin", "scone", "pastry", "cookie"]):
            traits["pastry_affinity"] = True

    return {
        "top_items": top_items,
        "favorite_categories": favorite_categories,
        "traits": traits,
    }