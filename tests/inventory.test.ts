import { test } from "node:test";
import assert from "node:assert/strict";
import { publicCatalogue } from "../lib/public-catalogue";
import { productSchema } from "../lib/validation";
import { initialStore, recordBill } from "../lib/domain";
test("public opening catalogue contains only valid published records and no valuations", () => {
  assert.ok(publicCatalogue.length > 0);
  assert.equal(
    new Set(publicCatalogue.map((p) => p.id)).size,
    publicCatalogue.length,
  );
  for (const p of publicCatalogue) {
    assert.equal(productSchema.safeParse(p).success, true, p.name);
    assert.equal(p.active, true);
    assert.ok(p.stock > 0);
    assert.notEqual(p.unit, "unconfirmed");
    assert.equal("closingValue" in p, false);
    assert.equal("importNote" in p, false);
  }
  assert.equal(
    publicCatalogue.find((p) => p.name === "1 No Kambili Coir")?.unit,
    "bundle",
  );
  assert.equal(
    publicCatalogue.find((p) => p.name === "4 pasi Black / Red Nool Sangu")
      ?.unit,
    "pair",
  );
});
test("units missing in the source must be confirmed before publishing or billing", () => {
  const p = {
    ...publicCatalogue[0],
    id: "test-unconfirmed-unit",
    name: "Test unconfirmed item",
    unit: "unconfirmed",
    active: false,
  };
  assert.equal(productSchema.safeParse({ ...p, active: true }).success, false);
  assert.throws(
    () =>
      recordBill(structuredClone(initialStore), {
        requestId: crypto.randomUUID(),
        kind: "sale",
        date: "2026-10-17",
        customer: "Test",
        phone: "",
        address: "",
        gstin: "",
        state: "Tamil Nadu",
        items: [
          {
            productId: p.id,
            name: p.name,
            quantity: 1,
            unit: p.unit,
            price: 100,
            gst: 0,
            hsn: "",
          },
        ],
        status: "paid",
      }),
    /correct unit/,
  );
});
