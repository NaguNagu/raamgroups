import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialStore,
  storefrontPrice,
  storefrontProduct,
  whatsappMessage,
} from "../lib/domain";
import { productSchema, saveError } from "../lib/validation";

const product = () => ({
  ...initialStore.products[0],
  price: 12345,
  unit: "bundle" as const,
  active: true,
});

test("hidden storefront price is removed from catalogue and WhatsApp without changing billing price", () => {
  const p = { ...product(), showPrice: false };
  assert.equal(storefrontPrice(p), 0);
  assert.equal(storefrontProduct(p).price, 0);
  assert.equal(p.price, 12345);
  const message = whatsappMessage("Customer", "9842888851", [
    { product: p, quantity: 2 },
  ]);
  assert.ok(message.includes("2 bundle"));
  assert.ok(!message.includes("123.45"));
  assert.ok(!message.includes("×"));
});

test("existing products keep their displayed price until explicitly hidden", () => {
  for (const showPrice of [undefined, true]) {
    const p = { ...product(), showPrice };
    assert.equal(storefrontPrice(p), 12345);
    assert.equal(storefrontProduct(p).price, 12345);
    assert.match(
      whatsappMessage("Customer", "9842888851", [{ product: p, quantity: 1 }]),
      /123\.45/,
    );
  }
});

test("photo and price choice can save on an unpublished item with an unconfirmed unit", () => {
  const p = {
    ...product(),
    image: "data:image/webp;base64,UklGRg==",
    unit: "unconfirmed",
    active: false,
    showPrice: false,
  };
  const saved = productSchema.parse(p);
  assert.equal(saved.image, p.image);
  assert.equal(saved.showPrice, false);
  assert.equal(saved.price, 12345);
});

test("publishing still requires a confirmed unit and returns a readable error", () => {
  const result = productSchema.safeParse({ ...product(), unit: "unconfirmed" });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      saveError(result.error),
      "unit: Confirm the item unit before publishing.",
    );
    assert.ok(!saveError(result.error).includes('"code"'));
  }
  assert.equal(
    productSchema.safeParse({ ...product(), showPrice: false }).success,
    true,
  );
});

test("price visibility must be a boolean on product creation and editing", () => {
  assert.equal(
    productSchema.safeParse({ ...product(), showPrice: "false" }).success,
    false,
  );
  assert.equal(
    saveError(new Error("Choose a smaller image.")),
    "Choose a smaller image.",
  );
});
