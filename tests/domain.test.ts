import { test } from "node:test";
import assert from "node:assert/strict";
import {
  today,
  calculate,
  initialStore,
  recordBill,
  whatsappMessage,
  type Line,
} from "../lib/domain";
import { billSchema, productSchema } from "../lib/validation";
const line: Line = {
  name: "Test rope",
  quantity: 2,
  price: 10000,
  gst: 18,
  unit: "kg",
  hsn: "5607",
};
const input = () => ({
  requestId: crypto.randomUUID(),
  kind: "sale" as const,
  date: "2026-10-17",
  customer: "Test customer",
  phone: "9842888851",
  address: "Salem",
  gstin: "",
  state: "Tamil Nadu",
  items: [{ ...line }],
  status: "paid" as const,
});
test("Tamil Nadu splits GST equally and calculates totals in paise", () => {
  assert.deepEqual(calculate([line], "Tamil Nadu"), {
    subtotal: 20000,
    cgst: 1800,
    sgst: 1800,
    igst: 0,
    total: 23600,
    units: 2,
  });
});
test("outside Tamil Nadu uses IGST only", () => {
  assert.deepEqual(calculate([line], "Kerala"), {
    subtotal: 20000,
    cgst: 0,
    sgst: 0,
    igst: 3600,
    total: 23600,
    units: 2,
  });
});
test("fractional quantities and mixed tax rates", () => {
  const t = calculate(
    [
      { ...line, quantity: 0.25, price: 10100, gst: 5 },
      { ...line, quantity: 1, price: 10000, gst: 0 },
    ],
    "Tamil Nadu",
  );
  assert.equal(t.subtotal, 12525);
  assert.equal(t.cgst, 63);
  assert.equal(t.sgst, 63);
  assert.equal(t.total, 12651);
  assert.equal(t.units, 1.25);
});
test("first-time billing creates hidden inventory record and tracks owed stock", () => {
  const store = structuredClone(initialStore);
  store.settings.gstin = "33AAAAA0000A1Z5";
  const bill = recordBill(store, input());
  const p = store.products.find((p) => p.name === line.name)!;
  assert.ok(p);
  assert.equal(p.active, false);
  assert.equal(p.stock, -2);
  assert.equal(bill.total, 23600);
  assert.equal(bill.number, "SR-00001");
});
test("purchase adds incoming stock, sale reduces stock", () => {
  const s = structuredClone(initialStore);
  s.settings.gstin = "33AAAAA0000A1Z5";
  recordBill(s, {
    ...input(),
    kind: "purchase",
    items: [{ ...line, quantity: 10 }],
  });
  assert.equal(s.products.find((p) => p.name === line.name)!.stock, 10);
  recordBill(s, input());
  assert.equal(s.products.find((p) => p.name === line.name)!.stock, 8);
});
test("insufficient stock rolls back every line and invoice sequence", () => {
  const s = structuredClone(initialStore);
  s.settings.gstin = "33AAAAA0000A1Z5";
  recordBill(s, {
    ...input(),
    kind: "purchase",
    items: [{ ...line, quantity: 1 }],
  });
  const before = structuredClone(s);
  assert.throws(
    () =>
      recordBill(s, {
        ...input(),
        items: [{ ...line, name: "Brand new item" }, line],
      }),
    /Insufficient stock/,
  );
  assert.deepEqual(s, before);
});
test("repeated request does not double bill or deduct stock twice", () => {
  const s = structuredClone(initialStore);
  s.settings.gstin = "33AAAAA0000A1Z5";
  const data = input();
  const a = recordBill(s, data);
  const b = recordBill(s, data);
  assert.equal(a.id, b.id);
  assert.equal(s.bills.length, 1);
  assert.equal(s.products.find((p) => p.name === line.name)!.stock, -2);
});
test("saved invoice snapshots survive business and price changes", () => {
  const s = structuredClone(initialStore);
  s.settings.gstin = "33AAAAA0000A1Z5";
  const b = recordBill(s, input());
  s.settings.name = "Changed name";
  s.products.find((p) => p.name === line.name)!.price = 20000;
  assert.equal(b.business!.name, initialStore.settings.name);
  assert.equal(b.items[0].price, 10000);
  assert.equal(b.total, 23600);
});
test("GST billing requires GSTIN", () => {
  assert.throws(
    () => recordBill(structuredClone(initialStore), input()),
    /GSTIN/,
  );
});
test("schema rejects negative prices, zero quantities and unsupported rates", () => {
  assert.equal(
    billSchema.safeParse({ ...input(), items: [{ ...line, price: -1 }] })
      .success,
    false,
  );
  assert.equal(
    billSchema.safeParse({ ...input(), items: [{ ...line, quantity: 0 }] })
      .success,
    false,
  );
  assert.equal(
    productSchema.safeParse({ ...initialStore.products[0], gst: 7 }).success,
    false,
  );
});
test("WhatsApp includes customer identity and quantity without invented price", () => {
  const text = whatsappMessage("Prasanth", "9842888851", [
    { product: initialStore.products[0], quantity: 3 },
  ]);
  assert.match(text, /Prasanth/);
  assert.match(text, /9842888851/);
  assert.match(text, new RegExp(`3 ${initialStore.products[0].unit}`));
  assert.match(text, /confirm price/);
  assert.doesNotMatch(text, /₹0/);
});

test("enquiry report dates follow India time across UTC midnight", () => {
  assert.equal(today(new Date("2026-10-16T20:00:00Z")), "2026-10-17");
  assert.equal(today(new Date("2026-10-16T18:29:00Z")), "2026-10-16");
});
