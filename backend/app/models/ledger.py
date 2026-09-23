"""
Tokify Ledger Database Models
Immutable record keeping for government schemes, issued SD-JWT subsidy tokens,
PoS transaction events, and UPI settlement batches.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    budget_allocated = Column(Float, nullable=False, default=0.0)
    budget_disbursed = Column(Float, nullable=False, default=0.0)
    cel_policy = Column(Text, nullable=False)
    allowed_mccs = Column(JSON, nullable=False, default=list) # e.g. ["5261", "5191"]
    geo_center_lat = Column(Float, nullable=True)
    geo_center_lng = Column(Float, nullable=True)
    geo_radius_km = Column(Float, nullable=True)
    expiry_days = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)


class BeneficiaryToken(Base):
    __tablename__ = "beneficiary_tokens"

    jti = Column(String(100), primary_key=True)
    scheme_id = Column(String(50), nullable=False)
    beneficiary_id_hash = Column(String(100), nullable=False) # Hashed/Salted ID
    initial_amount = Column(Float, nullable=False)
    remaining_balance = Column(Float, nullable=False)
    cel_policy = Column(Text, nullable=False)
    sd_jwt_compact = Column(Text, nullable=False)
    public_key_pem = Column(Text, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String(20), default="ACTIVE") # ACTIVE, EXHAUSTED, REVOKED


class TransactionLedger(Base):
    __tablename__ = "transaction_ledger"

    id = Column(String(100), primary_key=True) # PoS Txn UUID
    jti = Column(String(100), nullable=False)
    scheme_id = Column(String(50), nullable=False)
    merchant_id = Column(String(100), nullable=False)
    merchant_mcc = Column(String(10), nullable=False)
    burn_amount = Column(Float, nullable=False)
    pos_lat = Column(Float, nullable=True)
    pos_lng = Column(Float, nullable=True)
    offline_verified_at = Column(DateTime, nullable=False)
    synced_at = Column(DateTime, default=datetime.utcnow)
    settlement_status = Column(String(30), default="SETTLED_VIA_UPI")
    upi_ref_id = Column(String(100), nullable=True)
