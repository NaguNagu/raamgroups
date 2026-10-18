"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useShop, ProductCard } from "./shop";
import { categories } from "@/lib/domain";
import { Empty } from "./ui";
export function Catalogue() {
  const params = useSearchParams();
  const [category, setCategory] = useState(
    params.get("category") || "All products",
  );
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const { products, error } = useShop();
  const filtered = products
    .filter(
      (p) =>
        (category === "All products" || category === p.category) &&
        `${p.name} ${p.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "price"
          ? a.price - b.price
          : 0,
    );
  return (
    <>
      <section className="page-intro shell">
        <span className="eyebrow">OUR COLLECTION</span>
        <h1>Essentials you can rely on.</h1>
        <p>
          For your farm, your home and the work you do. Explore our range and
          send your requirements on WhatsApp.
        </p>
      </section>
      <section className="shell catalogue">
        <div className="catalogue-toolbar">
          <label className="search-field">
            <MagnifyingGlass size={20} />
            <input
              aria-label="Search products"
              placeholder="Search ropes, bells, brassware…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="sort-label">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="name">Name A–Z</option>
              <option value="price">Price: low to high</option>
            </select>
          </label>
        </div>
        <div className="category-tabs" aria-label="Product categories">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="catalogue-meta">
          <span>{filtered.length} products</span>
          <span>Wholesale & retail enquiries welcome</span>
        </div>
        {error && <p className="notice">{error}</p>}
        {filtered.length ? (
          <div className="product-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty title="No products found">
            <p>Try another search or category.</p>
            <button
              className="btn primary"
              onClick={() => {
                setCategory("All products");
                setSearch("");
              }}
            >
              Reset filters
            </button>
          </Empty>
        )}
        <p className="catalogue-note">
          Current catalogue is indicative. Products marked “Price on enquiry”
          need stock and price confirmation. Product imagery is representative.
        </p>
      </section>
    </>
  );
}
