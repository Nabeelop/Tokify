"""
Tokify CEL (Common Expression Language) Policy Engine
Evaluates multi-variable policy rules embedded inside SD-JWTs offline or online.
Supports geo-fencing, Merchant Category Code (MCC) whitelisting, time-boxing, and fractional balances.
"""

import math
import time
import re
from typing import Dict, Any, List, Tuple


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance between two coordinates in kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class CELEngine:
    """
    Lightweight Common Expression Language evaluator tailored for financial subsidy policies.
    Example policy string:
    `mcc in ['5261', '5191'] && geo_distance_km(lat, lng, 28.6139, 77.2090) <= 50.0 && amount >= spend_request && now() <= exp`
    """

    @staticmethod
    def parse_policy(policy_str: str) -> Dict[str, Any]:
        """Extract policy constraints from standard Tokify CEL policy syntax."""
        rules = {
            "allowed_mccs": [],
            "geo_fence": None, # {"center_lat": float, "center_lng": float, "max_radius_km": float}
            "max_txn_amount": None,
            "expiry": None
        }
        
        # 1. Parse MCC Whitelist (e.g. merchant.mcc in ['5261', '5191'])
        mcc_match = re.search(r"mcc\s+in\s+\[(.*?)\]", policy_str, re.IGNORECASE)
        if mcc_match:
            raw_mccs = mcc_match.group(1).replace("'", "").replace('"', "").replace(" ", "").split(",")
            rules["allowed_mccs"] = [m.strip() for m in raw_mccs if m.strip()]
            
        # 2. Parse Geo-fence (e.g. geo_distance_km(lat, lng, 28.6139, 77.2090) <= 50.0)
        geo_match = re.search(r"geo_distance_km\(\s*lat\s*,\s*lng\s*,\s*([\d\.-]+)\s*,\s*([\d\.-]+)\s*\)\s*<=\s*([\d\.-]+)", policy_str)
        if geo_match:
            rules["geo_fence"] = {
                "center_lat": float(geo_match.group(1)),
                "center_lng": float(geo_match.group(2)),
                "max_radius_km": float(geo_match.group(3))
            }
            
        # 3. Parse Expiration check
        if "now() <= exp" in policy_str:
            rules["expiry"] = True

        return rules

    @classmethod
    def evaluate(
        cls,
        cel_policy_str: str,
        context: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """
        Evaluates policy rules against PoS presentation context:
        context = {
            "merchant_mcc": "5261",
            "pos_lat": 28.6140,
            "pos_lng": 77.2092,
            "request_amount": 15.0,
            "token_exp": 1758650000,
            "remaining_token_balance": 50.0
        }
        Returns (is_compliant, list_of_violations)
        """
        violations = []
        rules = cls.parse_policy(cel_policy_str)
        
        # Check MCC whitelist
        pos_mcc = str(context.get("merchant_mcc", ""))
        if rules["allowed_mccs"] and pos_mcc not in rules["allowed_mccs"]:
            violations.append(
                f"Merchant Category Code '{pos_mcc}' not permitted by subsidy policy. Allowed: {rules['allowed_mccs']}"
            )

        # Check Geo-fencing constraint
        if rules["geo_fence"]:
            pos_lat = context.get("pos_lat")
            pos_lng = context.get("pos_lng")
            if pos_lat is None or pos_lng is None:
                violations.append("PoS location coordinates (lat/lng) missing for geo-fence verification.")
            else:
                c_lat = rules["geo_fence"]["center_lat"]
                c_lng = rules["geo_fence"]["center_lng"]
                max_r = rules["geo_fence"]["max_radius_km"]
                dist = haversine_distance_km(pos_lat, pos_lng, c_lat, c_lng)
                if dist > max_r:
                    violations.append(
                        f"PoS location ({pos_lat}, {pos_lng}) is {dist:.2f}km away, exceeding allowed radius of {max_r}km."
                    )

        # Check expiration
        token_exp = context.get("token_exp")
        now = int(time.time())
        if token_exp and now > token_exp:
            violations.append(f"Subsidy token expired at timestamp {token_exp} (current time: {now}).")

        # Check fractional amount logic
        req_amt = context.get("request_amount", 0.0)
        bal = context.get("remaining_token_balance", 0.0)
        if req_amt > bal:
            violations.append(f"Requested spend amount (${req_amt:.2f}) exceeds remaining token balance (${bal:.2f}).")

        is_valid = len(violations) == 0
        return is_valid, violations
