import re
import secrets
from datetime import datetime, timezone
from typing import Optional

def extract_json(text: str) -> str:
    t = (text or "").strip()
    if "```" in t:
        m = re.search(r"```json\s*([\s\S]*?)\s*```", t, re.IGNORECASE)
        if m:
            return m.group(1).strip()
        m2 = re.search(r"```\s*([\s\S]*?)\s*```", t)
        if m2:
            return m2.group(1).strip()
    return t

def gen_submission_token() -> str:
    return "subm_" + secrets.token_urlsafe(12)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def normalize_address(addr: Optional[str]) -> str:
    if not addr:
        return ""
    addr = addr.lower().strip()
    addr = re.sub(r"[^a-z0-9\s]", " ", addr)
    addr = re.sub(r"\s+", " ", addr)
    return addr