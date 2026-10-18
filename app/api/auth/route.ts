import { NextRequest, NextResponse } from "next/server";
import {
  cookieName,
  activeIdentity,
  startOrTouchSession,
  endSession,
} from "@/lib/auth";
import { firebaseConfigured } from "@/lib/firebase-config";
export async function GET() {
  try {
    const identity = await activeIdentity();
    return NextResponse.json({
      authenticated: true,
      configured: firebaseConfigured(),
      email: identity.email,
      lastActive: identity.lastActive,
      sessionKey: identity.sessionKey,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      configured: firebaseConfigured(),
    });
  }
}
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!firebaseConfigured())
    return NextResponse.json(
      { error: "Firebase authentication is not configured." },
      { status: 503 },
    );
  try {
    const { idToken, action } = await req.json();
    if (typeof idToken !== "string" || idToken.length > 10000)
      throw new Error("Invalid login token.");
    const claims = await startOrTouchSession(idToken, action === "activity");
    const response = NextResponse.json({
      ok: true,
      email: claims.email,
      lastActive: claims.lastActive,
      sessionKey: claims.sessionKey,
    });
    response.cookies.set(cookieName, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.max(0, claims.exp - Math.floor(Date.now() / 1000)),
    });
    return response;
  } catch {
    return NextResponse.json(
      {
        error:
          "Sign in with an active store account. Your session may have expired.",
      },
      { status: 401 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  await endSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  return response;
}
