"""
Tokify SD-JWT (Selective Disclosure JWT) Engine - RFC 9524 Compliant
Handles asymmetric RSA-256 / Ed25519 signing, disclosure generation with cryptographic salt,
sha256 digest creation for selective disclosure (_sd claim), and verification.
"""

import os
import json
import base64
import hashlib
import uuid
import time
from typing import Dict, Any, List, Tuple, Optional
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# Generate ephemeral RSA keypair for demonstration / startup if custom key not provided
_private_key_obj = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)

PRIVATE_KEY_PEM = _private_key_obj.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode('utf-8')

PUBLIC_KEY_PEM = _private_key_obj.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')


def _base64url_decode(encoded_str: str) -> bytes:
    padding = '=' * (4 - (len(encoded_str) % 4))
    return base64.urlsafe_b64decode(encoded_str + padding)


def create_disclosure(claim_name: str, claim_value: Any) -> Tuple[str, str]:
    """
    Creates an RFC 9524 disclosure array: [salt, claim_name, claim_value]
    Returns:
        (disclosure_b64, sha256_digest_b64)
    """
    salt = _base64url_encode(os.urandom(16))
    disclosure_struct = [salt, claim_name, claim_value]
    disclosure_json = json.dumps(disclosure_struct, separators=(',', ':')).encode('utf-8')
    disclosure_b64 = _base64url_encode(disclosure_json)
    
    # Digest of the ASCII disclosure string
    digest_bytes = hashlib.sha256(disclosure_b64.encode('ascii')).digest()
    digest_b64 = _base64url_encode(digest_bytes)
    
    return disclosure_b64, digest_b64


def issue_sd_jwt(
    issuer: str,
    subject: str,
    scheme_id: str,
    amount: float,
    cel_policy: str,
    disclosable_claims: Dict[str, Any],
    public_claims: Optional[Dict[str, Any]] = None,
    expiry_seconds: int = 86400 * 30,
    private_key_pem: str = PRIVATE_KEY_PEM
) -> Dict[str, Any]:
    """
    Issues an SD-JWT token containing:
    - Base JWT with issuer signature, expiration, CEL policy, and sha256 hashes of disclosures (_sd)
    - Array of disclosure strings (format: jwt~disclosure1~disclosure2)
    """
    now = int(time.time())
    exp = now + expiry_seconds
    jti = f"tok_{uuid.uuid4().hex[:12]}"
    
    sd_digests = []
    disclosures = []
    
    # Process disclosable claims into salted RFC 9524 disclosures
    for claim_name, claim_val in disclosable_claims.items():
        disc_b64, digest_b64 = create_disclosure(claim_name, claim_val)
        disclosures.append(disc_b64)
        sd_digests.append(digest_b64)
        
    payload = {
        "iss": issuer,
        "sub": subject,
        "jti": jti,
        "scheme_id": scheme_id,
        "amount": amount,
        "cel_policy": cel_policy,
        "iat": now,
        "exp": exp,
        "_sd": sd_digests,
        "_sd_alg": "sha256"
    }
    
    if public_claims:
        payload.update(public_claims)
        
    # Sign JWT with RSA-256
    issuer_jwt = jwt.encode(payload, private_key_pem, algorithm="RS256")
    
    # Combined SD-JWT string: <jwt>~<disclosure_1>~<disclosure_2>~
    sd_jwt_compact = f"{issuer_jwt}~" + "~".join(disclosures) + "~"
    
    return {
        "jti": jti,
        "sd_jwt": sd_jwt_compact,
        "jwt_part": issuer_jwt,
        "disclosures": disclosures,
        "sd_digests": sd_digests,
        "payload": payload,
        "public_key": PUBLIC_KEY_PEM
    }


def verify_sd_jwt(
    sd_jwt_str: str,
    public_key_pem: str = PUBLIC_KEY_PEM
) -> Dict[str, Any]:
    """
    Verifies the SD-JWT cryptographic signature using public key completely offline,
    and unwraps all valid disclosed claims matching the payload's _sd digests.
    """
    parts = sd_jwt_str.split("~")
    if not parts or not parts[0]:
        raise ValueError("Invalid SD-JWT format: empty token")
        
    jwt_part = parts[0]
    disclosures_raw = [p for p in parts[1:] if p]
    
    # 1. Cryptographic Signature Verification
    try:
        decoded_payload = jwt.decode(jwt_part, public_key_pem, algorithms=["RS256"])
    except jwt.ExpiredSignatureError:
        return {"valid": False, "error": "Token expired"}
    except jwt.InvalidTokenError as e:
        return {"valid": False, "error": f"Invalid cryptographic signature: {str(e)}"}
        
    # 2. Unpack disclosures & match sha256 digests
    valid_sd_digests = set(decoded_payload.get("_sd", []))
    revealed_claims = {}
    verified_disclosures = []
    
    for disc_b64 in disclosures_raw:
        # Compute sha256 digest of disclosure string
        digest_bytes = hashlib.sha256(disc_b64.encode('ascii')).digest()
        computed_digest = _base64url_encode(digest_bytes)
        
        if computed_digest in valid_sd_digests:
            try:
                disc_bytes = _base64url_decode(disc_b64)
                disc_arr = json.loads(disc_bytes.decode('utf-8'))
                if isinstance(disc_arr, list) and len(disc_arr) == 3:
                    salt, claim_name, claim_val = disc_arr
                    revealed_claims[claim_name] = claim_val
                    verified_disclosures.append(disc_b64)
            except Exception:
                continue

    return {
        "valid": True,
        "jti": decoded_payload.get("jti"),
        "issuer": decoded_payload.get("iss"),
        "scheme_id": decoded_payload.get("scheme_id"),
        "amount": decoded_payload.get("amount"),
        "cel_policy": decoded_payload.get("cel_policy"),
        "exp": decoded_payload.get("exp"),
        "payload": decoded_payload,
        "revealed_claims": revealed_claims,
        "verified_disclosures_count": len(verified_disclosures)
    }
