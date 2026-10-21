"use client";
import Link from "next/link";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  ShoppingBag,
  List,
  Phone,
  ArrowUpRight,
  Truck,
  Handshake,
  Plant,
  Minus,
  Plus,
  Trash,
  WhatsappLogo,
  MapPin,
  Envelope,
} from "@phosphor-icons/react";
import {
  initialStore,
  money,
  storefrontPrice,
  whatsappMessage,
  type Product,
  type Settings,
} from "@/lib/domain";
import { Drawer, ProductImage, Empty, Arrow } from "./ui";
type CartItem = { product: Product; quantity: number };
const Context = createContext<ReturnType<typeof useShopState> | null>(null);
function useShopState() {
  const [products, setProducts] = useState(initialStore.products);
  const [settings, setSettings] = useState(initialStore.settings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("raam-cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {}
    setReady(true);
    fetch("/api/store")
      .then((r) => r.json())
      .then((d) => {
        if (d.products) {
          setProducts(d.products);
          setSettings(d.settings);
          setCart((current) =>
            current.flatMap((i) => {
              const p = d.products.find((p: Product) => p.id === i.product.id);
              return p ? [{ product: p, quantity: i.quantity }] : [];
            }),
          );
        } else setError(d.error);
      })
      .catch(() =>
        setError(
          "Catalogue could not refresh. Please confirm availability by phone.",
        ),
      );
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("raam-cart", JSON.stringify(cart));
  }, [cart, ready]);
  const add = (p: Product) => {
    setCart((c) =>
      c.some((i) => i.product.id === p.id)
        ? c.map((i) =>
            i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...c, { product: p, quantity: 1 }],
    );
    setCartOpen(true);
  };
  return {
    products,
    settings,
    cart,
    setCart,
    cartOpen,
    setCartOpen,
    add,
    error,
  };
}
export function useShop() {
  return useContext(Context)!;
}
export function ShopProvider({ children }: { children: ReactNode }) {
  const state = useShopState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Sri Raam Rope Merchants home">
      <span className="brand-mark">
        <img src="/raam-logo.png" alt="" />
      </span>
      <span>
        <strong>SRI RAAM</strong>
        <small>ROPE MERCHANTS</small>
      </span>
    </Link>
  );
}
export function Header() {
  const { cart, setCartOpen } = useShop();
  const [menu, setMenu] = useState(false);
  return (
    <>
      <div className="announcement">
        <span>Rooted in tradition. Trusted for generations.</span>
        <span>
          Wholesale & retail <span className="announcement-dot">·</span> Serving
          across India
        </span>
      </div>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/about">Our story</Link>
            <Link href="/products">Products</Link>
            <Link href="/contact">Contact us</Link>
          </nav>
          <div className="header-actions">
            <a href="tel:+919842888851" className="header-phone">
              <Phone size={18} /> Speak to us
            </a>
            <button
              className="cart-button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart, ${cart.reduce((s, i) => s + i.quantity, 0)} items`}
            >
              <ShoppingBag size={23} />
              <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            </button>
            <button
              className="icon-btn mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <List size={26} />
            </button>
          </div>
        </div>
      </header>
      <Drawer
        open={menu}
        onClose={() => setMenu(false)}
        title="Explore Sri Raam"
      >
        <nav className="mobile-nav">
          {[
            ["/", "Home"],
            ["/about", "Our story"],
            ["/products", "Products"],
            ["/contact", "Contact us"],
          ].map(([href, label]) => (
            <Link onClick={() => setMenu(false)} key={href} href={href}>
              {label}
              <Arrow />
            </Link>
          ))}
        </nav>
      </Drawer>
      <CartDrawer />
    </>
  );
}
export function CartDrawer() {
  const { cart, setCart, cartOpen, setCartOpen, settings } = useShop();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const knownTotal = cart.reduce(
    (s, i) => s + storefrontPrice(i.product) * i.quantity,
    0,
  );
  const update = (id: string, n: number) =>
    setCart((c) =>
      c.flatMap((i) =>
        i.product.id === id ? (n > 0 ? [{ ...i, quantity: n }] : []) : [i],
      ),
    );
  async function order(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter your name and a valid 10-digit mobile number.");
      return;
    }
    setSending(true);
    setError("");
    const message = whatsappMessage(name.trim(), phone, cart);
    const link = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`;
    const win = window.open(link, "_blank", "noopener,noreferrer");
    try {
      await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message }),
      });
    } catch {}
    setSending(false);
    if (!win) window.location.href = link;
  }
  return (
    <Drawer
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title={`Your cart (${cart.length})`}
    >
      {!cart.length ? (
        <Empty title="Your cart is waiting">
          <p>Find the right products for your next order.</p>
          <Link
            className="btn primary"
            href="/products"
            onClick={() => setCartOpen(false)}
          >
            Explore products
            <Arrow />
          </Link>
        </Empty>
      ) : (
        <>
          <div className="drawer-body cart-items">
            {cart.map(({ product: p, quantity: q }) => (
              <div className="cart-row" key={p.id}>
                <ProductImage image={p.image} name={p.name} />
                <div>
                  <strong>{p.name}</strong>
                  <small>
                    {storefrontPrice(p)
                      ? `${money(storefrontPrice(p))} / ${p.unit}`
                      : "Price on enquiry"}
                  </small>
                  <div className="quantity">
                    <button
                      aria-label={`Decrease ${p.name}`}
                      onClick={() => update(p.id, q - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      aria-label={`Quantity for ${p.name}`}
                      type="number"
                      min="1"
                      max="100000"
                      value={q}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isInteger(n) && n > 0 && n <= 100000)
                          update(p.id, n);
                      }}
                    />
                    <button
                      aria-label={`Increase ${p.name}`}
                      onClick={() => update(p.id, q + 1)}
                    >
                      <Plus size={14} />
                    </button>
                    <span>{p.unit}</span>
                  </div>
                </div>
                <button
                  className="icon-btn"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => update(p.id, 0)}
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
          <form className="cart-checkout" onSubmit={order}>
            <div className="total-row">
              <span>
                {cart.length} products ·{" "}
                {cart.reduce((s, i) => s + i.quantity, 0)} units
              </span>
              <strong>
                {knownTotal ? money(knownTotal) : "Request a quote"}
              </strong>
            </div>
            <p className="muted small">
              Final prices, GST, stock and delivery will be confirmed by our
              team on WhatsApp.
            </p>
            <label>
              Your name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={100}
              />
            </label>
            <label>
              Mobile number
              <input
                required
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              disabled={sending}
              className="btn primary full"
              type="submit"
            >
              <WhatsappLogo size={22} />
              {sending ? "Opening WhatsApp…" : "Buy now on WhatsApp"}
              <ArrowUpRight size={18} />
            </button>
            <small className="muted">
              Your details and cart will be shared with Sri Raam. Sending the
              message in WhatsApp places an order request.
            </small>
          </form>
        </>
      )}
    </Drawer>
  );
}
export function ProductCard({ product: p }: { product: Product }) {
  const { add } = useShop();
  return (
    <article className="product-card">
      <Link href={`/products/${p.id}`} className="product-image-link">
        <ProductImage image={p.image} name={p.name} />
      </Link>
      <div className="product-card-body">
        <small>{p.category}</small>
        <Link href={`/products/${p.id}`}>
          <h3>{p.name}</h3>
        </Link>
        <div className="product-bottom">
          <span>
            {storefrontPrice(p) ? (
              <>
                <strong>{money(storefrontPrice(p))}</strong>
                <small> / {p.unit}</small>
              </>
            ) : (
              "Price on enquiry"
            )}
          </span>
          <button
            className="add-button"
            aria-label={`Add ${p.name} to cart`}
            onClick={() => add(p)}
            disabled={!p.sample && p.stock <= 0}
          >
            {!p.sample && p.stock <= 0 ? (
              "Out of stock"
            ) : (
              <>
                <Plus size={16} />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
export function Footer() {
  const { settings: s } = useShop();
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Brand />
          <p>
            Stronger connections,
            <br />
            for a brighter tomorrow.
          </p>
          <span className="small muted">A Raam Groups business</span>
        </div>
        <div>
          <h4>Explore</h4>
          <Link href="/about">Our story</Link>
          <Link href="/products">Our products</Link>
          <Link href="/contact">Visit & contact</Link>
          <Link href="/admin">Business login</Link>
        </div>
        <div>
          <h4>Our collection</h4>
          <Link href="/products?category=Ropes">Ropes</Link>
          <Link href="/products?category=Cattle%20accessories">
            Cattle essentials
          </Link>
          <Link href="/products?category=Brass%20%26%20pooja">
            Brass & pooja
          </Link>
          <Link href="/products?category=Cot%20tape%20rolls">
            Cot tape rolls
          </Link>
        </div>
        <div>
          <h4>Let’s talk</h4>
          <a href={`tel:+91${s.phone}`}>
            <Phone size={17} />
            +91 {s.phone}
          </a>
          <a href="tel:+919842888852">
            <Phone size={17} />
            +91 98428 88852
          </a>
          <a href={`mailto:${s.email}`}>
            <Envelope size={17} />
            {s.email}
          </a>
          <p>
            <MapPin size={18} />
            {s.address}
          </p>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Sri Raam Rope Merchants</span>
        <span>
          Salem, Tamil Nadu · Wholesale & retail ·{" "}
          <Link href="/image-credits">Photo credits</Link>
        </span>
      </div>
    </footer>
  );
}
export function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <ShopProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </ShopProvider>
  );
}
export function TrustBand() {
  return (
    <div className="trust-band shell">
      <div>
        <Handshake size={28} />
        <span>
          <strong>50+ years of trust</strong>
          <small>A legacy of quality & service</small>
        </span>
      </div>
      <div>
        <Plant size={28} />
        <span>
          <strong>Made for everyday work</strong>
          <small>For farms, homes & businesses</small>
        </span>
      </div>
      <div>
        <Truck size={28} />
        <span>
          <strong>Wholesale & retail</strong>
          <small>Enquiries welcome across India</small>
        </span>
      </div>
    </div>
  );
}
