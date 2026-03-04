from typing import Optional
from rapidfuzz import fuzz
from config import supabase
from utils.text_utils import normalize_address

def lookup_cafe_id(name: Optional[str], address: Optional[str]) -> Optional[str]:
    if not name:
        return None

    result = (
        supabase.table("cafes")
        .select("id,name,address")
        .ilike("name", f"%{name}%")
        .limit(20)
        .execute()
    )

    cafes = result.data or []
    if not cafes:
        return None

    addr_input = normalize_address(address)
    best_score = -1
    best_id = None

    # If no address extracted, don't guess among duplicates
    if not addr_input:
        return None

    for cafe in cafes:
        cafe_addr = normalize_address(cafe.get("address"))
        score = fuzz.token_set_ratio(addr_input, cafe_addr)
        if score > best_score:
            best_score = score
            best_id = cafe["id"]

    return best_id if best_score >= 80 else None