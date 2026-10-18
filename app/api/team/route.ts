import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore/lite";
import { z } from "zod";
import { activeIdentity } from "@/lib/auth";
import { verifyFirebaseToken } from "@/lib/firebase-token";
import { firestore } from "@/lib/firebase-server";
import { adminEmail } from "@/lib/firebase-config";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const identity = await activeIdentity();
    const db = await firestore();
    const list = await getDocs(collection(db, "teamMembers"));
    return NextResponse.json(
      {
        email: identity.email,
        members: list.docs.map((d) => ({
          uid: d.id,
          name: d.data().name,
          email: d.data().email,
          active: d.data().active,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Sign in to manage your team." },
      { status: 401 },
    );
  }
}
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const identity = await activeIdentity();
    const body = z
      .object({
        name: z.string().trim().min(1).max(100),
        memberToken: z.string().min(1).max(10000),
      })
      .parse(await req.json());
    const member = await verifyFirebaseToken(body.memberToken);
    if (
      member.email.toLowerCase() === adminEmail ||
      member.sub === identity.sub ||
      Date.now() / 1000 - member.auth_time > 300
    )
      return NextResponse.json(
        { error: "Use a separate, freshly authenticated team account." },
        { status: 400 },
      );
    const db = await firestore();
    const ref = doc(db, "teamMembers", member.sub!);
    await runTransaction(db, async (tx) => {
      const existing = await tx.get(ref);
      if (existing.exists())
        throw new Error(
          "This account is already listed. Use Activate if its access is disabled.",
        );
      tx.set(ref, {
        uid: member.sub,
        email: member.email.toLowerCase(),
        name: body.name,
        active: true,
        createdBy: identity.sub,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create team member.",
      },
      { status: 400 },
    );
  }
}
export async function PATCH(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const identity = await activeIdentity();
    const data = z
      .object({
        uid: z
          .string()
          .min(1)
          .max(128)
          .refine((s) => !s.includes("/")),
        active: z.boolean(),
      })
      .parse(await req.json());
    if (data.uid === identity.sub)
      return NextResponse.json(
        { error: "You cannot deactivate your own login." },
        { status: 400 },
      );
    const db = await firestore();
    const ref = doc(db, "teamMembers", data.uid);
    await runTransaction(db, async (tx) => {
      const member = await tx.get(ref);
      if (!member.exists() || member.data().email === adminEmail)
        throw new Error("Team account not found.");
      tx.update(ref, { active: data.active, updatedAt: serverTimestamp() });
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to update team access. Sign in and try again." },
      { status: 400 },
    );
  }
}
