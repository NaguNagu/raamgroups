import { adminEmail } from "./firebase-config";
export const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
export type Identity = {
  sub: string;
  email: string;
  email_verified?: unknown;
  auth_time: number;
};
export type TeamMember = {
  uid: string;
  email: string;
  name: string;
  active: boolean;
};
export function accountAllowed(identity: Identity, member?: TeamMember) {
  if (identity.email.toLowerCase() === adminEmail)
    return identity.email_verified === true;
  return (
    !!member &&
    member.active === true &&
    member.uid === identity.sub &&
    member.email.toLowerCase() === identity.email.toLowerCase()
  );
}
export const sessionId = (identity: Identity) =>
  `${identity.sub}_${identity.auth_time}`;
export function sessionActive(
  identity: Identity,
  session:
    | { uid?: string; authTime?: number; lastActive?: number; ended?: boolean }
    | undefined,
  now = Date.now(),
) {
  return (
    !!session &&
    session.ended !== true &&
    session.uid === identity.sub &&
    session.authTime === identity.auth_time &&
    typeof session.lastActive === "number" &&
    session.lastActive <= now + 5000 &&
    now - session.lastActive < IDLE_TIMEOUT_MS
  );
}
