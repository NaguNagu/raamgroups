import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  readStore,
  mutateStore,
  readCatalogue,
  saveImageAsset,
} from "@/lib/db";
import { recordBill } from "@/lib/domain";
import { productSchema, billSchema, settingsSchema } from "@/lib/validation";
import { firebaseConfigured } from "@/lib/firebase-config";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const admin = req.nextUrl.searchParams.get("admin") === "1";
  if (admin && !(await isAdmin()))
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  try {
    if (admin) return NextResponse.json({ store: await readStore() });
    const catalogue = await readCatalogue();
    return NextResponse.json({
      ...catalogue,
      configured: firebaseConfigured(),
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "The catalogue is temporarily unavailable. Please call the shop.",
      },
      { status: 503 },
    );
  }
}
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin || !(await isAdmin()))
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  if (Number(req.headers.get("content-length") || 0) > 2500000)
    return NextResponse.json({ error: "File is too large." }, { status: 413 });
  try {
    const { action, data } = await req.json();
    if (action === "product") {
      const p = productSchema.parse(data);
      data.image = await saveImageAsset(p.image);
    }
    if (action === "settings") {
      const settings = settingsSchema.parse(data);
      data.banner = await saveImageAsset(settings.banner);
    }
    const result = await mutateStore((store) => {
      switch (action) {
        case "product": {
          const p = productSchema.parse(data);
          const index = store.products.findIndex((x) => x.id === p.id);
          if (index < 0) store.products.push(p);
          else store.products[index] = p;
          return p;
        }
        case "bill":
          return recordBill(store, billSchema.parse(data));
        case "settings":
          store.settings = settingsSchema.parse(data);
          return store.settings;
        case "enquiry-status": {
          if (!["new", "contacted", "closed"].includes(data.status))
            throw new Error("Invalid status");
          const item = store.enquiries.find((x) => x.id === data.id);
          if (!item) throw new Error("Enquiry not found.");
          item.status = data.status;
          return item;
        }
        default:
          throw new Error("Unknown action.");
      }
    });
    return NextResponse.json({ result, store: await readStore() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save." },
      { status: 400 },
    );
  }
}
