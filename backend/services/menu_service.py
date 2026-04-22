import re
from collections import Counter, defaultdict

from database.supabase_client import supabase


MENU_KEYWORD_STOPWORDS = {
    "the",
    "and",
    "with",
    "for",
    "from",
    "our",
    "fresh",
    "house",
    "style",
    "served",
    "signature",
    "classic",
    "special",
    "drink",
    "drinks",
    "item",
    "items",
    "food",
    "hot",
    "iced",
    "ice",
    "small",
    "medium",
    "large",
    "oz",
    "cup",
}

CATEGORY_NORMALIZATION = {
    "coffee": "coffee",
    "espresso": "coffee",
    "latte": "coffee",
    "tea": "tea",
    "matcha": "tea",
    "chai": "tea",
    "pastry": "pastry",
    "pastries": "pastry",
    "bakery": "pastry",
    "dessert": "dessert",
    "breakfast": "breakfast",
    "brunch": "brunch",
    "sandwich": "sandwich",
    "sandwiches": "sandwich",
    "toast": "toast",
    "salad": "salad",
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


def tokenize_text(value):
    normalized = normalize_text_token(value)
    if not normalized:
        return []

    parts = re.split(r"[\s/&\-]+", normalized)
    tokens = []

    for part in parts:
        token = part.strip()
        if not token or len(token) <= 1:
            continue
        if token in MENU_KEYWORD_STOPWORDS:
            continue
        tokens.append(token)

    return tokens


def normalize_category(category):
    token = normalize_text_token(category)
    if not token:
        return "other"

    if token in CATEGORY_NORMALIZATION:
        return CATEGORY_NORMALIZATION[token]

    for key, normalized in CATEGORY_NORMALIZATION.items():
        if key in token:
            return normalized

    return token


def infer_category(name, category=None, description=None):
    normalized_category = normalize_category(category)
    if normalized_category != "other":
        return normalized_category

    text = " ".join(filter(None, [
        normalize_text_token(name),
        normalize_text_token(description),
    ]))

    if not text:
        return "other"

    if any(word in text for word in ["matcha", "chai", "tea"]):
        return "tea"
    if any(word in text for word in ["latte", "espresso", "americano", "mocha", "cappuccino", "coffee"]):
        return "coffee"
    if any(word in text for word in ["croissant", "muffin", "scone", "danish", "cookie", "pastry"]):
        return "pastry"
    if any(word in text for word in ["cake", "tiramisu", "brownie", "dessert", "cheesecake"]):
        return "dessert"
    if any(word in text for word in ["sandwich", "panini", "wrap"]):
        return "sandwich"
    if any(word in text for word in ["smoothie"]):
        return "smoothie"
    if any(word in text for word in ["juice"]):
        return "juice"
    if any(word in text for word in ["boba", "bubble tea"]):
        return "boba"

    return "other"


def normalize_menu_item_name(name):
    token = normalize_text_token(name)
    if not token:
        return None

    token = re.sub(r"\b12oz\b|\b16oz\b|\b20oz\b", "", token)
    token = re.sub(r"\bsmall\b|\bmedium\b|\blarge\b", "", token)
    token = re.sub(r"\s+", " ", token).strip()

    return token or None


def extract_menu_keywords(name, category=None, description=None, max_keywords=8):
    text_parts = [
        normalize_menu_item_name(name),
        normalize_text_token(category),
        normalize_text_token(description),
    ]

    counter = Counter()

    for part in text_parts:
        if not part:
            continue
        for token in tokenize_text(part):
            counter[token] += 1

    return [word for word, _ in counter.most_common(max_keywords)]


def build_menu_item_attributes(name, category=None, description=None):
    text = " ".join(filter(None, [
        normalize_menu_item_name(name),
        normalize_text_token(category),
        normalize_text_token(description),
    ]))

    attributes = {
        "contains_matcha": "matcha" in text,
        "contains_chai": "chai" in text,
        "contains_coffee": any(word in text for word in ["coffee", "espresso", "latte", "americano", "cappuccino", "mocha"]),
        "is_pastry": any(word in text for word in ["croissant", "muffin", "scone", "pastry", "danish"]),
        "is_dessert": any(word in text for word in ["cake", "cookie", "brownie", "dessert", "cheesecake"]),
        "is_tea": any(word in text for word in ["tea", "matcha", "chai"]),
        "is_sandwich": any(word in text for word in ["sandwich", "panini", "wrap"]),
        "is_sweet": any(word in text for word in ["vanilla", "caramel", "strawberry", "mocha", "chocolate", "sweet", "honey"]),
        "is_cold": any(word in text for word in ["iced", "cold"]),
        "is_hot": "hot" in text,
    }

    return attributes


def parse_price_to_numeric(price_value):
    if price_value is None:
        return None

    text = str(price_value).strip()
    match = re.search(r"(\d+(?:\.\d{1,2})?)", text)
    if not match:
        return None

    try:
        return float(match.group(1))
    except Exception:
        return None


def clean_menu_item_row(row):
    name = row.get("name")
    description = row.get("description")
    category = row.get("category")
    price = row.get("price")

    normalized_name = normalize_menu_item_name(name)
    cleaned_category = infer_category(
        name=name,
        category=category,
        description=description,
    )
    keywords = extract_menu_keywords(
        name=name,
        category=cleaned_category,
        description=description,
    )
    attributes = build_menu_item_attributes(
        name=name,
        category=cleaned_category,
        description=description,
    )

    return {
        **row,
        "normalized_name": normalized_name,
        "category": cleaned_category,
        "price_numeric": parse_price_to_numeric(price),
        "keywords": keywords,
        "attributes": attributes,
    }


def group_menu_items_by_cafe(menu_rows):
    grouped = defaultdict(list)

    for row in menu_rows:
        cafe_id = row.get("cafe_id")
        if not cafe_id:
            continue
        grouped[cafe_id].append(clean_menu_item_row(row))

    return grouped


def get_menu_items_for_cafe(cafe_id: str):
    response = (
        supabase.table("menu_items")
        .select("*")
        .eq("cafe_id", cafe_id)
        .order("created_at", desc=False)
        .execute()
    )
    rows = response.data or []
    return [clean_menu_item_row(row) for row in rows]


def get_all_menu_items():
    response = (
        supabase.table("menu_items")
        .select("*")
        .execute()
    )
    rows = response.data or []
    return [clean_menu_item_row(row) for row in rows]


def get_menu_keywords_for_cafe(cafe_id: str, top_n=20):
    rows = get_menu_items_for_cafe(cafe_id)
    counter = Counter()

    for row in rows:
        for keyword in row.get("keywords", []):
            counter[keyword] += 1

    return [word for word, _ in counter.most_common(top_n)]


def get_menu_category_counts_for_cafe(cafe_id: str):
    rows = get_menu_items_for_cafe(cafe_id)
    counter = Counter()

    for row in rows:
        category = row.get("category") or "other"
        counter[category] += 1

    return dict(counter)


def create_menu_items_for_cafe(cafe_id: str, items: list[dict]):
    rows_to_insert = []

    for item in items:
        cleaned = clean_menu_item_row(item)

        row = {
            "cafe_id": cafe_id,
            "name": item.get("name"),
            "price": str(item.get("price") or ""),
            "category": cleaned["category"],
            "image_url": item.get("image_url"),
        }

        # only include these if your DB later adds them
        if item.get("description") is not None:
            row["description"] = item.get("description")
        if cleaned.get("normalized_name") is not None:
            row["normalized_name"] = cleaned["normalized_name"]
        if cleaned.get("price_numeric") is not None:
            row["price_numeric"] = cleaned["price_numeric"]
        if cleaned.get("attributes") is not None:
            row["attributes"] = cleaned["attributes"]

        rows_to_insert.append(row)

    response = supabase.table("menu_items").insert(rows_to_insert).execute()
    return response.data or []


def replace_menu_items_for_cafe(cafe_id: str, items: list[dict]):
    supabase.table("menu_items").delete().eq("cafe_id", cafe_id).execute()
    return create_menu_items_for_cafe(cafe_id, items)


def build_cafe_menu_profile(cafe_id: str):
    rows = get_menu_items_for_cafe(cafe_id)

    keywords = Counter()
    categories = Counter()
    item_names = []
    matcha_items = []
    pastry_items = []

    for row in rows:
        normalized_name = row.get("normalized_name")
        if normalized_name:
            item_names.append(normalized_name)

        for keyword in row.get("keywords", []):
            keywords[keyword] += 1

        categories[row.get("category") or "other"] += 1

        attributes = row.get("attributes") or {}

        if attributes.get("contains_matcha"):
            matcha_items.append(normalized_name)
        if attributes.get("is_pastry"):
            pastry_items.append(normalized_name)

    return {
        "cafe_id": cafe_id,
        "item_names": list(dict.fromkeys([name for name in item_names if name])),
        "top_keywords": [word for word, _ in keywords.most_common(20)],
        "category_counts": dict(categories),
        "matcha_items": list(dict.fromkeys([name for name in matcha_items if name])),
        "pastry_items": list(dict.fromkeys([name for name in pastry_items if name])),
    }
def insert_menu_item(cafe_id: str, item: dict):
    cleaned = clean_menu_item_row(item)

    row = {
        "cafe_id": cafe_id,
        "name": item.get("name"),
        "price": str(item.get("price") or ""),
        "category": cleaned["category"],
        "image_url": item.get("image_url"),
    }

    if item.get("description") is not None:
        row["description"] = item.get("description")
    if cleaned.get("normalized_name") is not None:
        row["normalized_name"] = cleaned["normalized_name"]
    if cleaned.get("price_numeric") is not None:
        row["price_numeric"] = cleaned["price_numeric"]
    if cleaned.get("attributes") is not None:
        row["attributes"] = cleaned["attributes"]

    response = supabase.table("menu_items").insert(row).execute()
    return response.data[0] if response.data else None

def delete_menu_item(item_id: str):
    response = supabase.table("menu_items").delete().eq("id", item_id).execute()
    return response.data or []