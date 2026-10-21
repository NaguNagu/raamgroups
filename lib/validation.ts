import { z } from "zod";
import { productUnits } from "./domain";
const text = z.string().trim().max(200);
export const productSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: text.min(1),
    category: z.enum([
      "Ropes",
      "Cattle accessories",
      "Brass & pooja",
      "Cot tape rolls",
      "Threads & weaving",
      "Hardware & chains",
      "Farm tools",
      "Pet accessories",
    ]),
    description: z.string().max(2000),
    unit: z.enum(productUnits),
    price: z.number().int().min(0).max(100000000),
    stock: z.number().min(-10000000).max(10000000),
    gst: z.number().refine((n) => [0, 5, 12, 18, 28, 40].includes(n)),
    hsn: z.string().max(8),
    image: z
      .string()
      .max(750000)
      .refine(
        (v) =>
          ["", "rope", "colour", "bells", "brass", "tape"].includes(v) ||
          /^\/product-images\/[a-z-]+\.jpg$/.test(v) ||
          /^\/api\/images\/[a-f0-9]{64}$/.test(v) ||
          /^data:image\/(png|jpeg|webp);base64,/.test(v) ||
          /^https:\/\//.test(v),
      ),
    active: z.boolean(),
    sample: z.boolean().optional(),
    showPrice: z.boolean().optional(),
    importNote: z.string().max(1000).optional(),
  })
  .refine((p) => !p.active || p.unit !== "unconfirmed", {
    message: "Confirm the item unit before publishing.",
    path: ["unit"],
  });
export const lineSchema = z.object({
  productId: z.string().max(100).optional(),
  name: text.min(1),
  quantity: z.number().positive().max(1000000),
  price: z.number().int().nonnegative().max(100000000),
  gst: z.number().refine((n) => [0, 5, 12, 18, 28, 40].includes(n)),
  unit: text.min(1),
  hsn: z.string().max(8),
});
export const billSchema = z.object({
  requestId: z.uuid(),
  kind: z.enum(["sale", "purchase"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customer: text.min(1),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]{7,16}$/)
    .or(z.literal("")),
  address: z.string().max(1000),
  gstin: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
    .or(z.literal("")),
  state: text.min(1),
  items: z.array(lineSchema).min(1).max(100),
  status: z.enum(["paid", "unpaid"]),
});
export const settingsSchema = z.object({
  name: text.min(1),
  address: z.string().min(1).max(1000),
  phone: z.string().regex(/^\d{10}$/),
  whatsapp: z.string().regex(/^91\d{10}$/),
  email: z.email(),
  gstin: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
    .or(z.literal("")),
  paper: z.enum(["A4", "A5"]),
  banner: z
    .string()
    .max(750000)
    .refine(
      (v) =>
        v === "/business-poster.png" ||
        /^\/api\/images\/[a-f0-9]{64}$/.test(v) ||
        /^data:image\/(png|jpeg|webp);base64,/.test(v) ||
        /^https:\/\//.test(v),
    ),
  heroTitle: z.string().min(1).max(120),
  heroText: z.string().min(1).max(300),
  invoicePrefix: z.string().regex(/^[A-Z0-9-]{1,12}$/),
});
export const enquirySchema = z.object({
  name: text.min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  message: z.string().trim().min(5).max(4000),
});

export function saveError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return issue
      ? `${issue.path.join(" → ") || "Product"}: ${issue.message}`
      : "Please check the form.";
  }
  return error instanceof Error ? error.message : "Unable to save.";
}
