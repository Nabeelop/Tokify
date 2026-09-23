"""
Tokify Deferred Batch Settlement API
Processes offline verified transactions from PoS devices, checks double-spending using RedisBloom filter,
burns tokens fractionally, and triggers instant UPI payout to merchant bank accounts.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import time
from app.core.bloom_filter import double_spend_guard

router = APIRouter(prefix="/api/settlement", tags=["Settlement"])

# Mock database of settled transactions
SETTLED_TRANSACTIONS_DB = []


class PosOfflineClaim(BaseModel):
    pos_txn_id: str = Field(..., example="pos_tx_90123")
    jti: str = Field(..., example="tok_a8b9c1d2")
    scheme_id: str = Field(..., example="scheme_agri_2026")
    merchant_id: str = Field(..., example="MERCHANT_AGRI_441")
    merchant_mcc: str = Field(..., example="5261")
    burn_amount: float = Field(..., example=500.0)
    pos_lat: Optional[float] = Field(None, example=28.6139)
    pos_lng: Optional[float] = Field(None, example=77.2090)
    offline_timestamp: int = Field(..., example=1758650000)
    pos_signature: str = Field(..., description="PoS cryptographic signature over offline receipt")


class BatchSettlementRequest(BaseModel):
    pos_device_id: str = Field(..., example="POS_DEV_DELHI_09")
    claims: List[PosOfflineClaim]


@router.post("/batch", response_model=dict)
def process_batch_settlement(req: BatchSettlementRequest):
    processed_count = 0
    rejected_count = 0
    total_fiat_settled = 0.0
    results = []

    for claim in req.claims:
        # 1. Sub-millisecond double-spend guard check
        if double_spend_guard.is_double_spend(claim.jti, str(claim.offline_timestamp)):
            rejected_count += 1
            results.append({
                "pos_txn_id": claim.pos_txn_id,
                "jti": claim.jti,
                "status": "REJECTED_DOUBLE_SPEND",
                "reason": "Token JTI + timestamp already burned in ledger"
            })
            continue

        # 2. Mark JTI + timestamp as burned
        double_spend_guard.mark_burned(claim.jti, str(claim.offline_timestamp))

        # 3. Trigger instant simulated UPI settlement payout
        upi_rrn = f"UPI{int(time.time())}{uuid.uuid4().hex[:6].upper()}"
        settled_record = {
            "pos_txn_id": claim.pos_txn_id,
            "jti": claim.jti,
            "scheme_id": claim.scheme_id,
            "merchant_id": claim.merchant_id,
            "burn_amount": claim.burn_amount,
            "upi_rrn": upi_rrn,
            "status": "SETTLED_VIA_UPI",
            "synced_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        SETTLED_TRANSACTIONS_DB.append(settled_record)
        processed_count += 1
        total_fiat_settled += claim.burn_amount
        results.append(settled_record)

    return {
        "pos_device_id": req.pos_device_id,
        "batch_status": "COMPLETED",
        "processed_count": processed_count,
        "rejected_count": rejected_count,
        "total_fiat_settled": total_fiat_settled,
        "details": results
    }


@router.get("/ledger", response_model=List[dict])
def list_settlement_ledger():
    return SETTLED_TRANSACTIONS_DB
