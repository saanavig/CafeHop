from typing import Optional
from rapidfuzz import fuzz
from utils.text_utils import normalize_address
from database.supabase_client import supabase


def normalize_name(value: Optional[str]) -> str:
    return (
        (value or "")
        .lower()
        .replace("’", "'")
        .replace("'", "")
        .replace(".", "")
        .strip()
    )


def lookup_cafe_id(name: Optional[str], address: Optional[str]) -> Optional[str]:
    if not name:
        return None

    result = (
        supabase.table("cafes")
        .select("id,name,address")
        .execute()
    )

    cafes = result.data or []
    if not cafes:
        return None

    name_input = normalize_name(name)
    addr_input = normalize_address(address)

    if not addr_input:
        return None

    best_score = -1
    best_id = None

    for cafe in cafes:
        cafe_name = normalize_name(cafe.get("name"))
        cafe_addr = normalize_address(cafe.get("address"))

        name_score = fuzz.token_set_ratio(name_input, cafe_name)
        addr_score = fuzz.token_set_ratio(addr_input, cafe_addr)

        final_score = (name_score * 0.4) + (addr_score * 0.6)

        print("CAFE MATCH CHECK:", {
            "ocr_name": name_input,
            "db_name": cafe_name,
            "name_score": name_score,
            "ocr_addr": addr_input,
            "db_addr": cafe_addr,
            "addr_score": addr_score,
            "final_score": final_score,
        })

        if final_score > best_score:
            best_score = final_score
            best_id = cafe["id"]

    print("BEST CAFE MATCH SCORE:", best_score)

    return best_id if best_score >= 75 else None