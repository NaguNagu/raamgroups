"use client";
import Link from "next/link";
import { useShop, ProductCard } from "./shop";
import { ProductImage } from "./ui";
import { money } from "@/lib/domain";
export function ProductDetail({ id }: { id: string }) {
  const { products, add } = useShop();
  const p = products.find((p) => p.id === id);
  if (!p)
    return (
      <div className="shell page-intro">
        <h1>Product unavailable</h1>
        <Link href="/products">Explore our products →</Link>
      </div>
    );
  return (
    <div className="shell detail-page">
      <div className="breadcrumb">
        <Link href="/products">All products</Link> / {p.category} / {p.name}
      </div>
      <div className="detail-grid">
        <ProductImage image={p.image} name={p.name} />
        <div>
          <span className="eyebrow">{p.category}</span>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <h3>
            {p.price ? `${money(p.price)} / ${p.unit}` : "Price on enquiry"}
          </h3>
          <p className="muted small">
            {p.sample
              ? "Contact us for available sizes and current stock."
              : p.stock > 0
                ? `${p.stock} ${p.unit} available`
                : "Currently out of stock"}
            {p.price > 0
              ? " · GST and delivery confirmed with your order."
              : ""}
          </p>
          <button
            className="btn primary"
            disabled={!p.sample && p.stock <= 0}
            onClick={() => add(p)}
          >
            Add to cart →
          </button>
          <div className="detail-note">
            <strong>A little guidance goes a long way.</strong>
            <p>
              Share your intended use, required size and quantity on WhatsApp.
              Our team will confirm suitable options before you buy.
            </p>
          </div>
        </div>
      </div>
      <section className="related">
        <h2>You may also need</h2>
        <div className="product-grid">
          {products
            .filter((x) => x.id !== id)
            .slice(0, 4)
            .map((x) => (
              <ProductCard key={x.id} product={x} />
            ))}
        </div>
      </section>
    </div>
  );
}
