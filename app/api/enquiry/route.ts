import { NextRequest, NextResponse } from "next/server";
import { createEnquiry } from "@/lib/db";
import { enquirySchema } from "@/lib/validation";
import { firebaseConfigured } from "@/lib/firebase-config";
import { createHash } from "node:crypto";
const limits = new Map<string, { count: number; until: number }>();
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!firebaseConfigured())
    return NextResponse.json(
      {
        error:
          "Please contact us on WhatsApp while online enquiries are being set up.",
      },
      { status: 503 },
    );
  try {
    const data = enquirySchema.parse(await req.json());
    const key = createHash("sha256").update(data.phone).digest("hex");
    const now = Date.now();
    let limit = limits.get(key);
    if (!limit || limit.until < now) {
      limit = { count: 0, until: now + 3600000 };
      limits.set(key, limit);
    }
    if (++limit.count > 5)
      return NextResponse.json(
        { error: "Please call us for further enquiries." },
        { status: 429 },
      );
    if (limits.size > 10000)
      for (const [key, value] of limits)
        if (value.until < now) limits.delete(key);
    const id = crypto.randomUUID();
    await createEnquiry({
      ...data,
      id,
      date: new Date().toISOString(),
      status: "new",
    });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to save your enquiry. Check your name, mobile number and message, or contact us on WhatsApp.",
      },
      { status: 400 },
    );
  }
}
