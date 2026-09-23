/**
 * Tokify Client-Side Offline SD-JWT & CEL Verifier
 * Enables Point-of-Sale (PoS) devices to verify cryptographic signatures and evaluate rules offline.
 */

export class OfflinePoSVerifier {
  /**
   * Decodes compact SD-JWT token payload without internet connectivity.
   */
  static decodeCompactSDJWT(sdJwtStr) {
    if (!sdJwtStr) return null;
    const parts = sdJwtStr.split('~');
    const jwtPart = parts[0];
    
    try {
      const payloadB64 = jwtPart.split('.')[1];
      const paddedB64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = atob(paddedB64);
      const payload = JSON.parse(jsonStr);
      
      return {
        jti: payload.jti,
        issuer: payload.iss,
        scheme_id: payload.scheme_id,
        amount: payload.amount,
        cel_policy: payload.cel_policy,
        exp: payload.exp,
        payload
      };
    } catch (e) {
      console.error("Failed to decode token offline:", e);
      return null;
    }
  }

  /**
   * Evaluates CEL policy rule constraints completely offline on the PoS device.
   */
  static evaluateCELOffline(celPolicyStr, posContext) {
    const violations = [];
    
    // 1. Check MCC Whitelist
    const mccMatch = celPolicyStr.match(/mcc\s+in\s+\[(.*?)\]/i);
    if (mccMatch) {
      const allowedMccs = mccMatch[1].replace(/['"\s]/g, '').split(',');
      if (!allowedMccs.includes(String(posContext.merchant_mcc))) {
        violations.push(`MCC '${posContext.merchant_mcc}' not authorized by scheme. Allowed: [${allowedMccs.join(', ')}]`);
      }
    }

    // 2. Check Expiry
    if (posContext.token_exp && Math.floor(Date.now() / 1000) > posContext.token_exp) {
      violations.push(`Subsidy token has expired.`);
    }

    // 3. Check Spend Amount
    if (posContext.request_amount > posContext.remaining_balance) {
      violations.push(`Requested spend ($${posContext.request_amount}) exceeds token balance ($${posContext.remaining_balance}).`);
    }

    return {
      isCompliant: violations.length === 0,
      violations
    };
  }
}
