"""
Tokify Token Issuance & Verification API Endpoints
Issues Selective Disclosure JSON Web Tokens (SD-JWTs) for beneficiaries.
Allows selective disclosure unwrapping and cryptographic signature verification.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.core.crypto import issue_sd_jwt, verify_sd_jwt
from app.core.cel_engine import CELEngine

router = APIRouter(prefix="/api/tokens", tags=["Tokens"])

# Mock memory cache of issued tokens
ISSUED_TOKENS_DB = {}


class TokenMintRequest(BaseModel):
    scheme_id: str = Field(..., example="scheme_agri_2026")
    beneficiary_id: str = Field(..., example="BEN_892104")
    amount: float = Field(..., example=2500.0)
    disclosable_claims: Dict[str, Any] = Field(
        default={
            "beneficiary_name": "Ramesh Kumar",
            "state_code": "UP",
            "farmer_category": "Smallholder"
        },
        example={
            "beneficiary_name": "Ramesh Kumar",
            "state_code": "UP"
        }
    )
    custom_cel_policy: Optional[str] = Field(None)


class TokenVerifyRequest(BaseModel):
    sd_jwt: str = Field(..., description="Full compact SD-JWT string")
    public_key_pem: Optional[str] = Field(None, description="Issuer public key (optional if embedded)")
    pos_context: Optional[Dict[str, Any]] = Field(
        None,
        example={
            "merchant_mcc": "5261",
            "pos_lat": 28.6139,
            "pos_lng": 77.2090,
            "request_amount": 500.0
        }
    )


@router.post("/mint", response_model=dict)
def mint_token(req: TokenMintRequest):
    # Default CEL policy if not provided
    cel_policy = req.custom_cel_policy or "mcc in ['5261', '5191'] && geo_distance_km(lat, lng, 28.6139, 77.2090) <= 100.0 && now() <= exp"
    
    sd_jwt_result = issue_sd_jwt(
        issuer="Government of India - Direct Benefit Transfer Auth",
        subject=req.beneficiary_id,
        scheme_id=req.scheme_id,
        amount=req.amount,
        cel_policy=cel_policy,
        disclosable_claims=req.disclosable_claims
    )
    
    ISSUED_TOKENS_DB[sd_jwt_result["jti"]] = sd_jwt_result
    return sd_jwt_result


@router.post("/verify", response_model=dict)
def verify_token(req: TokenVerifyRequest):
    pub_key = req.public_key_pem or None
    try:
        if pub_key:
            res = verify_sd_jwt(req.sd_jwt, public_key_pem=pub_key)
        else:
            res = verify_sd_jwt(req.sd_jwt)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")
        
    if not res.get("valid"):
        return res
        
    # If PoS context provided, evaluate CEL policy constraints
    if req.pos_context:
        cel_policy = res.get("cel_policy", "")
        pos_ctx = req.pos_context
        pos_ctx["token_exp"] = res.get("exp")
        pos_ctx["remaining_token_balance"] = res.get("amount")
        
        compliant, violations = CELEngine.evaluate(cel_policy, pos_ctx)
        res["cel_compliant"] = compliant
        res["cel_violations"] = violations
    else:
        res["cel_compliant"] = True
        res["cel_violations"] = []

    return res
