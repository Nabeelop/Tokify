"""
Tokify Token Issuance & Verification API Endpoints
Issues Selective Disclosure JSON Web Tokens (SD-JWTs) for beneficiaries.
Allows selective disclosure unwrapping, cryptographic signature verification, and SMS dispatch.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.core.crypto import issue_sd_jwt, verify_sd_jwt
from app.core.cel_engine import CELEngine
from app.core.sms import SMSService

router = APIRouter(prefix="/api/tokens", tags=["Tokens"])

ISSUED_TOKENS_DB = {}


class TokenMintRequest(BaseModel):
    scheme_id: str = Field(..., example="scheme_agri_2026")
    beneficiary_id: str = Field(..., example="BEN_892104")
    phone_number: Optional[str] = Field(None, example="+919876543210")
    amount: float = Field(..., example=2500.0)
    disclosable_claims: Dict[str, Any] = Field(
        default={
            "beneficiary_name": "Ramesh Kumar",
            "state_code": "UP",
            "farmer_category": "Smallholder"
        }
    )
    custom_cel_policy: Optional[str] = Field(None)
    send_sms: bool = Field(True, description="Whether to dispatch SMS alert to beneficiary phone")


class SendSMSRequest(BaseModel):
    phone_number: str = Field(..., example="+919876543210")
    beneficiary_name: str = Field(..., example="Ramesh Kumar")
    scheme_name: str = Field(..., example="PM Kisan Fertilizer Subsidy 2026")
    amount: float = Field(..., example=2500.0)
    jti: str = Field(..., example="tok_agri_98214a")
    sd_jwt: str = Field(..., example="compact_token_str")


@router.post("/mint", response_model=dict)
def mint_token(req: TokenMintRequest):
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
    
    # Trigger SMS Dispatch if phone number provided
    if req.send_sms and req.phone_number:
        b_name = req.disclosable_claims.get("beneficiary_name", "Beneficiary")
        sms_res = SMSService.send_subsidy_sms(
            phone_number=req.phone_number,
            beneficiary_name=b_name,
            scheme_name=req.scheme_id,
            amount=req.amount,
            jti=sd_jwt_result["jti"],
            sd_jwt_compact=sd_jwt_result["sd_jwt"]
        )
        sd_jwt_result["sms_dispatch"] = sms_res
        
    return sd_jwt_result


@router.post("/send-sms", response_model=dict)
def trigger_sms(req: SendSMSRequest):
    return SMSService.send_subsidy_sms(
        phone_number=req.phone_number,
        beneficiary_name=req.beneficiary_name,
        scheme_name=req.scheme_name,
        amount=req.amount,
        jti=req.jti,
        sd_jwt_compact=req.sd_jwt
    )


@router.post("/verify", response_model=dict)
def verify_token(req: Dict[str, Any]):
    sd_jwt = req.get("sd_jwt", "")
    pub_key = req.get("public_key_pem", None)
    pos_ctx = req.get("pos_context", None)

    try:
        if pub_key:
            res = verify_sd_jwt(sd_jwt, public_key_pem=pub_key)
        else:
            res = verify_sd_jwt(sd_jwt)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")
        
    if not res.get("valid"):
        return res
        
    if pos_ctx:
        cel_policy = res.get("cel_policy", "")
        pos_ctx["token_exp"] = res.get("exp")
        pos_ctx["remaining_token_balance"] = res.get("amount")
        
        compliant, violations = CELEngine.evaluate(cel_policy, pos_ctx)
        res["cel_compliant"] = compliant
        res["cel_violations"] = violations
    else:
        res["cel_compliant"] = True
        res["cel_violations"] = []

    return res
