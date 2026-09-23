"""
Pytest unit tests for CEL policy evaluator.
"""

from app.core.cel_engine import CELEngine, haversine_distance_km


def test_haversine_distance():
    # Distance between Delhi (28.6139, 77.2090) and Gurgaon (28.4595, 77.0266) is ~23 km
    dist = haversine_distance_km(28.6139, 77.2090, 28.4595, 77.0266)
    assert 20.0 < dist < 28.0


def test_cel_policy_evaluation_success():
    policy = "mcc in ['5261', '5191'] && geo_distance_km(lat, lng, 28.6139, 77.2090) <= 50.0 && now() <= exp"
    
    pos_context = {
        "merchant_mcc": "5261",
        "pos_lat": 28.6140,
        "pos_lng": 77.2092,
        "token_exp": 9999999999, # Far future
        "request_amount": 100.0,
        "remaining_token_balance": 500.0
    }
    
    compliant, violations = CELEngine.evaluate(policy, pos_context)
    assert compliant is True
    assert len(violations) == 0


def test_cel_policy_evaluation_mcc_violation():
    policy = "mcc in ['5261', '5191'] && now() <= exp"
    
    pos_context = {
        "merchant_mcc": "5999", # Invalid MCC
        "token_exp": 9999999999,
        "request_amount": 100.0,
        "remaining_token_balance": 500.0
    }
    
    compliant, violations = CELEngine.evaluate(policy, pos_context)
    assert compliant is False
    assert any("Merchant Category Code" in v for v in violations)
