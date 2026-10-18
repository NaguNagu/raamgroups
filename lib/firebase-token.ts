import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { adminEmail, firebaseConfig } from "./firebase-config";
const googleKeys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);
export async function verifyFirebaseToken(
  token: string,
  keys: JWTVerifyGetKey = googleKeys,
) {
  const { payload } = await jwtVerify(token, keys, {
    issuer: `https://securetoken.google.com/${firebaseConfig.projectId}`,
    audience: firebaseConfig.projectId,
    algorithms: ["RS256"],
    requiredClaims: ["exp", "iat", "auth_time", "sub", "iss", "aud"],
  });
  const now = Math.floor(Date.now() / 1000);
  if (
    typeof payload.iat !== "number" ||
    payload.iat > now + 5 ||
    typeof payload.auth_time !== "number" ||
    payload.auth_time > now + 5 ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.sub.length > 128
  )
    throw new Error("Invalid Firebase token claims.");
  if (typeof payload.email !== "string" || !payload.email.includes("@"))
    throw new Error("An email identity is required.");
  return {
    ...payload,
    email: payload.email,
    email_verified: payload.email_verified,
    sub: payload.sub,
    exp: payload.exp!,
    auth_time: payload.auth_time,
  };
}

// Owner-only helper retained for explicit owner checks and signature tests.
export async function verifyFirebaseAdminJWT(
  token: string,
  keys: JWTVerifyGetKey = googleKeys,
) {
  const claims = await verifyFirebaseToken(token, keys);
  if (
    claims.email.toLowerCase() !== adminEmail ||
    claims.email_verified !== true
  )
    throw new Error("Verified owner required.");
  return claims;
}
