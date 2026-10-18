import { test, before } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from "jose";
import { verifyFirebaseAdminJWT } from "../lib/firebase-token";
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
let keys: ReturnType<typeof createLocalJWKSet>;
before(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  jwk.kid = "test";
  keys = createLocalJWKSet({ keys: [jwk] });
});
async function token(patch: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    iss: "https://securetoken.google.com/sri-raam-rope",
    aud: "sri-raam-rope",
    sub: "test-owner",
    iat: now,
    exp: now + 3600,
    auth_time: now,
    email: "sriraamrope@gmail.com",
    email_verified: true,
    ...patch,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .sign(privateKey);
}
test("verified business identity with valid Firebase claims is accepted", async () =>
  assert.equal(
    (await verifyFirebaseAdminJWT(await token(), keys)).email,
    "sriraamrope@gmail.com",
  ));
test("another verified email is denied", async () =>
  assert.rejects(() =>
    token({ email: "other@example.com" }).then((t) =>
      verifyFirebaseAdminJWT(t, keys),
    ),
  ));
test("unverified business email is denied", async () =>
  assert.rejects(() =>
    token({ email_verified: false }).then((t) =>
      verifyFirebaseAdminJWT(t, keys),
    ),
  ));
test("wrong project, issuer and expired tokens are denied", async () => {
  for (const patch of [
    { aud: "other-project" },
    { iss: "https://attacker.example" },
    { exp: 1 },
  ])
    await assert.rejects(() =>
      token(patch).then((t) => verifyFirebaseAdminJWT(t, keys)),
    );
});
test("future authentication time and invalid subjects are denied", async () => {
  for (const patch of [
    { auth_time: Date.now() / 1000 + 500 },
    { iat: Date.now() / 1000 + 500 },
    { sub: "" },
    { sub: "x".repeat(129) },
  ])
    await assert.rejects(() =>
      token(patch).then((t) => verifyFirebaseAdminJWT(t, keys)),
    );
});
test("a forged signature is denied", async () => {
  const other = await generateKeyPair("RS256");
  const forged = await new SignJWT({
    email: "sriraamrope@gmail.com",
    email_verified: true,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .sign(other.privateKey);
  await assert.rejects(() => verifyFirebaseAdminJWT(forged, keys));
});
