"""
Tokify Live SMS Gateway Integration
Dispatches real carrier SMS messages containing SD-JWT subsidy voucher details directly to beneficiaries' mobile phones.
"""

import os
import json
import logging
import urllib.parse
import urllib.request
import base64
from typing import Dict, Any, Optional

logger = logging.getLogger("tokify.sms")


class LiveSMSService:
    """
    Real SMS Gateway dispatch using Twilio REST API.
    Enables live carrier delivery to Indian (+91) and international mobile numbers.
    """

    @staticmethod
    def send_real_sms(
        phone_number: str,
        beneficiary_name: str,
        scheme_name: str,
        amount: float,
        jti: str,
        sd_jwt_compact: str,
        twilio_sid: Optional[str] = None,
        twilio_token: Optional[str] = None,
        twilio_from: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches real SMS to a mobile phone number using Twilio credentials.
        """
        claim_code = jti.replace("tok_", "").upper()
        short_jwt = sd_jwt_compact[:30] + "..."
        
        sms_body = (
            f"Govt of India Welfare Alert: Dear {beneficiary_name}, your subsidy voucher of Rs.{amount:.2f} "
            f"for '{scheme_name}' is issued!\n"
            f"Voucher ID: {jti}\n"
            f"Claim Code: {claim_code}\n"
            f"Token: {short_jwt}\n"
            f"Present at any verified merchant PoS offline."
        )

        # Resolve credentials (from parameter or environment)
        account_sid = twilio_sid or os.environ.get("TWILIO_ACCOUNT_SID")
        auth_token = twilio_token or os.environ.get("TWILIO_AUTH_TOKEN")
        from_phone = twilio_from or os.environ.get("TWILIO_PHONE_NUMBER")

        if not account_sid or not auth_token or not from_phone:
            logger.warning("[SMS] Twilio credentials missing. Falling back to simulated delivery preview.")
            return {
                "success": True,
                "mode": "Simulated (Credentials Required for Live Carrier Delivery)",
                "phone_number": phone_number,
                "sms_body": sms_body,
                "error": "To receive real SMS on your mobile phone, enter your Twilio Account SID, Auth Token, and From Number in the dashboard SMS settings."
            }

        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            post_params = {
                "From": from_phone,
                "To": phone_number,
                "Body": sms_body
            }
            encoded_data = urllib.parse.urlencode(post_params).encode("utf-8")

            auth_str = f"{account_sid}:{auth_token}"
            b64_auth = base64.b64encode(auth_str.encode()).decode("ascii")

            req = urllib.request.Request(
                url,
                data=encoded_data,
                headers={
                    "Authorization": f"Basic {b64_auth}",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            with urllib.request.urlopen(req) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                return {
                    "success": True,
                    "mode": "Live Carrier SMS Dispatched via Twilio",
                    "sid": resp_json.get("sid"),
                    "status": resp_json.get("status"),
                    "phone_number": phone_number,
                    "sms_body": sms_body
                }
        except Exception as e:
            logger.error(f"[SMS ERROR] Failed to send real SMS: {str(e)}")
            return {
                "success": False,
                "mode": "Error",
                "phone_number": phone_number,
                "error": str(e),
                "sms_body": sms_body
            }
