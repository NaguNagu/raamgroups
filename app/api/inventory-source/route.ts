import { isAdmin } from "@/lib/auth";
import { doc, getDoc } from "firebase/firestore/lite";
import { firestore } from "@/lib/firebase-server";
import { z } from "zod";
const reportSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().max(200),
        quantity: z.number().nullable(),
        sourceUnit: z.string().max(30).nullable(),
        closingValue: z.number().nullable(),
        page: z.number().int().positive(),
      }),
    )
    .max(10000),
});
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isAdmin()))
    return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const snapshot = await getDoc(
    doc(await firestore(), "private", "openingStockReport"),
  );
  if (!snapshot.exists())
    return Response.json(
      { error: "The original source report is unavailable." },
      { status: 503 },
    );
  const source = reportSchema.parse(snapshot.data());
  const cell = (v: unknown) =>
    '"' + String(v ?? "").replaceAll('"', '""') + '"';
  const rows = [
    [
      "Item name",
      "Closing quantity",
      "Original unit",
      "Closing stock value INR (not selling price)",
      "Source page",
    ],
    ...source.items.map((r) => [
      r.name,
      r.quantity,
      r.sourceUnit,
      r.closingValue,
      r.page,
    ]),
  ];
  return new Response(
    "\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          "attachment; filename=opening-stock-2026-10-17.csv",
        "Cache-Control": "private, no-store",
      },
    },
  );
}
