"use client";
import Link from "next/link";
import Image from "next/image";
import { defaultBanner } from "@/lib/banner";
import { ArrowUpRight, WhatsappLogo, ArrowRight } from "@phosphor-icons/react";
import { useShop, ProductCard, TrustBand } from "@/components/shop";
import { ProductImage } from "@/components/ui";
export default function Home() {
  const { products, settings: s, error } = useShop();
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">SRI RAAM ROPE MERCHANTS · SALEM</span>
            <h1>
              {s.heroTitle.split("\n").map((t, i) => (
                <span key={i}>
                  {t}
                  <br />
                </span>
              ))}
            </h1>
            <p>{s.heroText}</p>
            <div className="hero-actions">
              <Link className="btn gold" href="/products">
                Explore our products
                <ArrowRight size={20} />
              </Link>
              <a
                className="hero-contact"
                href={`https://wa.me/${s.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsappLogo size={21} />
                Talk to our team
                <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div className="hero-visual">
            {s.banner === "/business-poster.png" ? (
              <Image
                src={defaultBanner}
                alt="Decorated Kangeyam bull standing in a lush field with coconut palms"
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1320px) 50vw, 620px"
                preload
              />
            ) : (
              <img src={s.banner} alt="Sri Raam seasonal banner" />
            )}
          </div>
        </div>
      </section>
      <TrustBand />
      <section className="shell collection-section">
        <div className="section-title">
          <span className="eyebrow">THE SRI RAAM COLLECTION</span>
          <h2>
            Good products.
            <br />
            Honest relationships.
          </h2>
          <p>
            From a dependable rope to a familiar ringing bell, find the
            essentials that keep your day moving.
          </p>
        </div>
        <div className="category-grid">
          {[
            {
              name: "Ropes",
              image: "rope",
              text: "Strength for every task",
              to: "Ropes",
            },
            {
              name: "Cattle essentials",
              image: "bells",
              text: "Care, tied to tradition",
              to: "Cattle accessories",
            },
            {
              name: "Brass & pooja",
              image: "brass",
              text: "A little everyday tradition",
              to: "Brass & pooja",
            },
            {
              name: "Cot tape rolls",
              image: "tape",
              text: "Comfort, woven together",
              to: "Cot tape rolls",
            },
          ].map((c) => (
            <Link
              key={c.name}
              className="category-card"
              href={`/products?category=${encodeURIComponent(c.to)}`}
            >
              <ProductImage image={c.image} name={c.name} />
              <div>
                <span>
                  <h3>{c.name}</h3>
                  <small>{c.text}</small>
                </span>
                <ArrowUpRight size={23} />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="featured-section">
        <div className="shell">
          <div className="section-row">
            <div>
              <h2>Everyday essentials</h2>
              <p className="muted">
                Familiar favourites from our store in Shevapet.
              </p>
            </div>
            <Link className="text-link" href="/products">
              View all products
              <ArrowRight size={19} />
            </Link>
          </div>
          {error && (
            <p role="status" className="notice">
              {error}
            </p>
          )}
          <div className="product-grid">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <p className="catalogue-note">
            Images are representative selections from our business poster.
            Contact us for current sizes, finishes and availability.
          </p>
        </div>
      </section>
      <section className="shell heritage">
        <div className="heritage-image">
          <img
            src="/_next/image?url=%2Fbusiness-poster.png&w=1920&q=75"
            alt="Sri Raam Rope Merchants business poster featuring our product range and 50+ years of trust"
            loading="lazy"
          />
        </div>
        <div className="heritage-copy">
          <span className="eyebrow">OUR ROOTS. YOUR TRUST.</span>
          <h2>
            A Salem tradition.
            <br />A promise that lasts.
          </h2>
          <p>
            For over 50 years, Sri Raam Rope Merchants has been part of the
            everyday lives of farming families, homes and local businesses.
          </p>
          <p>
            From our shop in Shevapet, we bring together practical essentials,
            personal guidance and the care of a business built on lasting
            relationships.
          </p>
          <Link className="text-link" href="/about">
            Get to know Sri Raam
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>
      <section className="visit-strip">
        <div className="shell">
          <div>
            <h2>Not sure which rope is right?</h2>
            <p>
              Tell us what you need it for. We’ll help you find a suitable
              option.
            </p>
          </div>
          <Link className="btn primary" href="/contact">
            Speak to our team
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
