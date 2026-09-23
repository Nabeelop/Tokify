"""
Tokify Scheme Management API Endpoints
Allows government agencies to configure subsidy schemes with embedded CEL policy constraints.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import time

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])

# In-memory mock DB fallback for easy standalone demonstration
MOCK_SCHEMES_DB = {
    "scheme_agri_2026": {
        "id": "scheme_agri_2026",
        "name": "PM Kisan Fertilizer Subsidy 2026",
        "description": "Direct subsidy voucher for registered farmers, restricted to fertilizer & seed merchants.",
        "budget_allocated": 500000.0,
        "budget_disbursed": 125000.0,
        "cel_policy": "mcc in ['5261', '5191'] && geo_distance_km(lat, lng, 28.6139, 77.2090) <= 100.0 && now() <= exp",
        "allowed_mccs": ["5261", "5191"],
        "geo_center_lat": 28.6139,
        "geo_center_lng": 77.2090,
        "geo_radius_km": 100.0,
        "expiry_days": 30,
        "created_at": "2026-09-01T10:00:00Z"
    },
    "scheme_health_2026": {
        "id": "scheme_health_2026",
        "name": "Ayushman Bharat Medicine Voucher",
        "description": "Targeted health voucher for essential medicines at verified pharmacies.",
        "budget_allocated": 1000000.0,
        "budget_disbursed": 430000.0,
        "cel_policy": "mcc in ['5912', '8099'] && now() <= exp",
        "allowed_mccs": ["5912", "8099"],
        "geo_center_lat": None,
        "geo_center_lng": None,
        "geo_radius_km": None,
        "expiry_days": 60,
        "created_at": "2026-09-10T14:30:00Z"
    }
}


class SchemeCreateRequest(BaseModel):
    name: str = Field(..., example="Kisan Seed Subsidy")
    description: Optional[str] = Field(None, example="Seed subsidy for smallholding farmers")
    budget_allocated: float = Field(..., example=100000.0)
    allowed_mccs: List[str] = Field(default=["5261"], example=["5261", "5191"])
    geo_center_lat: Optional[float] = Field(None, example=28.6139)
    geo_center_lng: Optional[float] = Field(None, example=77.2090)
    geo_radius_km: Optional[float] = Field(None, example=50.0)
    expiry_days: int = Field(30, example=30)


@router.get("", response_model=List[dict])
def list_schemes():
    return list(MOCK_SCHEMES_DB.values())


@router.post("", response_model=dict)
def create_scheme(req: SchemeCreateRequest):
    scheme_id = f"scheme_{uuid.uuid4().hex[:8]}"
    
    # Generate CEL policy string dynamically from parameters
    mcc_list_str = str(req.allowed_mccs)
    cel_parts = [f"mcc in {mcc_list_str}"]
    if req.geo_center_lat and req.geo_center_lng and req.geo_radius_km:
        cel_parts.append(
            f"geo_distance_km(lat, lng, {req.geo_center_lat}, {req.geo_center_lng}) <= {req.geo_radius_km}"
        )
    cel_parts.append("now() <= exp")
    cel_policy_str = " && ".join(cel_parts)

    scheme_data = {
        "id": scheme_id,
        "name": req.name,
        "description": req.description,
        "budget_allocated": req.budget_allocated,
        "budget_disbursed": 0.0,
        "cel_policy": cel_policy_str,
        "allowed_mccs": req.allowed_mccs,
        "geo_center_lat": req.geo_center_lat,
        "geo_center_lng": req.geo_center_lng,
        "geo_radius_km": req.geo_radius_km,
        "expiry_days": req.expiry_days,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    MOCK_SCHEMES_DB[scheme_id] = scheme_data
    return scheme_data


@router.get("/{scheme_id}", response_model=dict)
def get_scheme(scheme_id: str):
    if scheme_id not in MOCK_SCHEMES_DB:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return MOCK_SCHEMES_DB[scheme_id]
