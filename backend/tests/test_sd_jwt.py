"""
Pytest unit tests for Tokify SD-JWT cryptographic engine.
"""

from app.core.crypto import issue_sd_jwt, verify_sd_jwt


def test_issue_and_verify_sd_jwt():
    disclosable = {
        "beneficiary_name": "Ramesh Kumar",
        "state": "Uttar Pradesh",
        "farmer_id": "UP-8921"
    }
    
    issued = issue_sd_jwt(
        issuer="Government of India - DBT",
        subject="BEN_1001",
        scheme_id="scheme_agri_2026",
        amount=5000.0,
        cel_policy="mcc in ['5261'] && now() <= exp",
        disclosable_claims=disclosable
    )
    
    assert "sd_jwt" in issued
    assert issued["jti"].startswith("tok_")
    
    # Verify using the returned public key
    verified = verify_sd_jwt(issued["sd_jwt"], public_key_pem=issued["public_key"])
    
    assert verified["valid"] is True
    assert verified["amount"] == 5000.0
    assert verified["revealed_claims"]["beneficiary_name"] == "Ramesh Kumar"
    assert verified["revealed_claims"]["farmer_id"] == "UP-8921"
    assert verified["verified_disclosures_count"] == 3


def test_tampered_sd_jwt_fails():
    issued = issue_sd_jwt(
        issuer="Government of India - DBT",
        subject="BEN_1001",
        scheme_id="scheme_agri_2026",
        amount=1000.0,
        cel_policy="mcc in ['5261'] && now() <= exp",
        disclosable_claims={"name": "Test Beneficiary"}
    )
    
    # Tamper with the compact token
    tampered_sd_jwt = issued["sd_jwt"] + "tampered_suffix"
    verified = verify_sd_jwt(tampered_sd_jwt, public_key_pem=issued["public_key"])
    
    assert verified["valid"] is False
