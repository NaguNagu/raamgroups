import { cookies, headers } from "next/headers";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore/lite";
import { firebaseConfigured } from "./firebase-config";
import { verifyFirebaseToken } from "./firebase-token";
import { firestore } from "./firebase-server";
import {
  accountAllowed,
  sessionId,
  sessionActive,
  type TeamMember,
} from "./access";
export const cookieName = "raam_firebase_session";
export async function requestToken() {
  const bearer = (await headers()).get("authorization");
  return bearer?.startsWith("Bearer ")
    ? bearer.slice(7)
    : (await cookies()).get(cookieName)?.value;
}
export async function verifyAdminToken(token: string) {
  const claims = await verifyFirebaseToken(token);
  const db = await firestore(true, token);
  const member = await getDoc(doc(db, "teamMembers", claims.sub!));
  if (
    !accountAllowed(
      { ...claims, sub: claims.sub! },
      member.exists() ? (member.data() as TeamMember) : undefined,
    )
  )
    throw new Error("This account has not been granted store access.");
  return claims;
}
function plainSession(value: any) {
  return value
    ? { ...value, lastActive: value.lastActive?.toMillis() }
    : undefined;
}
export async function activeIdentity(token?: string) {
  const value = token || (await requestToken());
  if (!value || !firebaseConfigured()) throw new Error("Sign in to continue.");
  const claims = await verifyAdminToken(value);
  const db = await firestore(true, value);
  const snapshot = await getDoc(
    doc(db, "authSessions", sessionId({ ...claims, sub: claims.sub! })),
  );
  if (
    !sessionActive(
      { ...claims, sub: claims.sub! },
      snapshot.exists() ? plainSession(snapshot.data()) : undefined,
    )
  )
    throw new Error("Your session expired. Please sign in again.");
  return {
    ...claims,
    sub: claims.sub!,
    lastActive: snapshot.data()!.lastActive.toMillis(),
    sessionKey: sessionId({ ...claims, sub: claims.sub! }),
  };
}
export async function isAdmin() {
  try {
    await activeIdentity();
    return true;
  } catch {
    return false;
  }
}
export async function startOrTouchSession(token: string, touch = false) {
  const claims = await verifyAdminToken(token);
  const identity = { ...claims, sub: claims.sub! };
  const db = await firestore(true, token);
  const ref = doc(db, "authSessions", sessionId(identity));
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists()) {
      if (!sessionActive(identity, plainSession(snapshot.data())))
        throw new Error("Session expired. Sign in again.");
      transaction.update(ref, { lastActive: serverTimestamp() });
    } else {
      if (touch || Date.now() / 1000 - claims.auth_time > 300)
        throw new Error("Sign in again.");
      transaction.set(ref, {
        uid: claims.sub,
        email: claims.email.toLowerCase(),
        authTime: claims.auth_time,
        ended: false,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });
    }
  });
  return {
    ...identity,
    lastActive: Date.now(),
    sessionKey: sessionId(identity),
  };
}
export async function endSession() {
  try {
    const identity = await activeIdentity();
    const db = await firestore();
    await runTransaction(db, async (transaction) => {
      const ref = doc(db, "authSessions", identity.sessionKey);
      const s = await transaction.get(ref);
      if (s.exists()) transaction.update(ref, { ended: true });
    });
  } catch {}
}
