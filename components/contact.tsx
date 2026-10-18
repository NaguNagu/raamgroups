"use client";
import { useState } from "react";
import {
  WhatsappLogo,
  Phone,
  Envelope,
  MapPin,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { useShop } from "./shop";
export function Contact() {
  const { settings: s } = useShop();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const r = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(
        "Thank you. Your enquiry has been saved. Our team will get back to you.",
      );
      form.reset();
    } catch (err) {
      setStatus(
        err instanceof Error
          ? err.message
          : "Unable to send. Please contact us on WhatsApp.",
      );
    }
    setBusy(false);
  }
  return (
    <>
      <section className="shell page-intro">
        <span className="eyebrow">VISIT. CALL. CONNECT.</span>
        <h1>
          Good conversations
          <br />
          start here.
        </h1>
        <p>
          Need a product, a wholesale quote or a little advice? We’re happy to
          help.
        </p>
      </section>
      <section className="shell contact-grid">
        <div>
          <h2>Find us in Shevapet.</h2>
          <div className="contact-line">
            <MapPin size={23} />
            <div>
              <h3>Visit the store</h3>
              <p>{s.address}</p>
              <a
                className="text-link"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + " " + s.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions
                <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
          <div className="contact-line">
            <Phone size={23} />
            <div>
              <h3>Give us a call</h3>
              <a href={`tel:+91${s.phone}`}>+91 {s.phone}</a>
              <a href="tel:+919842888852">+91 98428 88852</a>
            </div>
          </div>
          <div className="contact-line">
            <Envelope size={23} />
            <div>
              <h3>Write to us</h3>
              <a href={`mailto:${s.email}`}>{s.email}</a>
            </div>
          </div>
          <a
            className="btn primary"
            href={`https://wa.me/${s.whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsappLogo size={21} />
            Chat on WhatsApp
            <ArrowUpRight size={18} />
          </a>
          <p className="muted small">
            Please call to confirm store hours before travelling.
          </p>
        </div>
        <form className="contact-form panel" onSubmit={submit}>
          <h2>Send an enquiry</h2>
          <p className="muted">Tell us what you’re looking for.</p>
          <label>
            Your name
            <input
              name="name"
              required
              minLength={2}
              maxLength={200}
              autoComplete="name"
            />
          </label>
          <label>
            Mobile number
            <input
              name="phone"
              type="tel"
              required
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              placeholder="10-digit mobile number"
              autoComplete="tel-national"
            />
          </label>
          <label>
            How can we help?
            <textarea
              name="message"
              required
              minLength={5}
              maxLength={4000}
              rows={5}
              placeholder="Product, size, quantity and delivery location…"
            />
          </label>
          <small className="muted">
            Your details are used to respond to your enquiry.
          </small>
          <button className="btn primary" disabled={busy}>
            {busy ? "Sending…" : "Send enquiry"}
            <ArrowUpRight size={18} />
          </button>
          {status && (
            <p role="status" className="notice">
              {status}
            </p>
          )}
        </form>
      </section>
    </>
  );
}
