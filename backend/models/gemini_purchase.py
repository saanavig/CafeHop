from pydantic import BaseModel, field_validator
from typing import Optional

class GeminiPurchase(BaseModel):
    merchant_name: Optional[str] = None
    merchant_address: Optional[str] = None
    amount: Optional[float] = None
    receipt_timestamp: Optional[str] = None
    receipt_number: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def valid_amount(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError("Amount must be positive")
        return v