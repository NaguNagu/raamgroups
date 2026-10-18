import Link from "next/link";
export const metadata = { title: "Our story" };
export default function About() {
  return (
    <>
      <section className="page-intro shell">
        <span className="eyebrow">OUR STORY</span>
        <h1>
          Built on trust.
          <br />
          Bound by tradition.
        </h1>
        <p>
          A family-business spirit, a practical approach and over 50 years of
          serving everyday needs.
        </p>
      </section>
      <section className="shell about-story">
        <img
          src="/_next/image?url=%2Fbusiness-poster.png&w=1920&q=75"
          alt="Sri Raam Rope Merchants business poster"
        />
        <div>
          <h2>
            From Shevapet,
            <br />
            with a lasting commitment.
          </h2>
          <p>
            Sri Raam Rope Merchants brings together ropes, cattle accessories,
            ghungroos and bells, brass items, pooja bells and cot tape rolls
            under one roof.
          </p>
          <p>
            Our store at Chekkan Kadu Lane in Salem serves retail customers and
            wholesale buyers. Whether you’re buying for your farm, home or
            business, our team takes time to understand what you need.
          </p>
          <p>
            We believe good service is straightforward: useful products, clear
            conversations and relationships that continue long after a purchase.
          </p>
          <Link className="btn primary" href="/products">
            Explore the collection →
          </Link>
        </div>
      </section>
      <section className="shell values">
        <h2>The way we do business</h2>
        <div>
          <article>
            <span>01</span>
            <h3>Practical guidance</h3>
            <p>
              Tell us about your application and we’ll help you choose from
              available materials, sizes and finishes.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Retail & wholesale</h3>
            <p>
              From individual essentials to business requirements, speak to us
              about quantities and current pricing.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Personal service</h3>
            <p>
              Visit our Salem store or start a conversation on WhatsApp. You’ll
              speak with people who know the products.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
