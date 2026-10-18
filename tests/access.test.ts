import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountAllowed,
  sessionActive,
  sessionId,
  IDLE_TIMEOUT_MS,
} from "../lib/access";
const identity = {
  sub: "member-123",
  email: "team@example.com",
  auth_time: 12345,
  email_verified: false,
};
const member = {
  uid: identity.sub,
  email: identity.email,
  name: "Trusted member",
  active: true,
};
test("only the verified owner or an explicitly approved UID/email can enter", () => {
  assert.equal(
    accountAllowed({
      ...identity,
      email: "sriraamrope@gmail.com",
      email_verified: true,
    }),
    true,
  );
  assert.equal(
    accountAllowed({
      ...identity,
      email: "sriraamrope@gmail.com",
      email_verified: false,
    }),
    false,
  );
  assert.equal(accountAllowed(identity), false);
  assert.equal(accountAllowed(identity, member), true);
  assert.equal(accountAllowed(identity, { ...member, active: false }), false);
  assert.equal(
    accountAllowed(identity, { ...member, uid: "another-uid" }),
    false,
  );
  assert.equal(
    accountAllowed(identity, { ...member, email: "other@example.com" }),
    false,
  );
});
test("session expires at two hours of inactivity, irrespective of refreshed tokens", () => {
  const now = 2000000000000;
  const session = {
    uid: identity.sub,
    authTime: identity.auth_time,
    lastActive: now - IDLE_TIMEOUT_MS + 1,
    ended: false,
  };
  assert.equal(sessionActive(identity, session, now), true);
  assert.equal(
    sessionActive(
      identity,
      { ...session, lastActive: now - IDLE_TIMEOUT_MS },
      now,
    ),
    false,
  );
  assert.equal(
    sessionActive(
      { ...identity, iat: now / 1000 } as typeof identity,
      { ...session, lastActive: now - IDLE_TIMEOUT_MS - 1 },
      now,
    ),
    false,
  );
  assert.equal(
    sessionActive(identity, { ...session, ended: true }, now),
    false,
  );
  assert.equal(
    sessionActive(identity, { ...session, uid: "another" }, now),
    false,
  );
  assert.equal(
    sessionActive(identity, { ...session, authTime: 1 }, now),
    false,
  );
  assert.equal(sessionActive(identity, undefined, now), false);
  assert.equal(
    sessionActive(identity, { ...session, lastActive: now + 6000 }, now),
    false,
  );
  assert.equal(sessionId(identity), "member-123_12345");
});
