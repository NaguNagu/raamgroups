"use client";
import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useAdminSession, type SessionInfo } from "@/lib/use-admin-session";
import { TeamSettings } from "./team-settings";
import { bannerImage } from "@/lib/banner";
import {
  authFetch,
  signInAdmin,
  signOutAdmin,
  resetAdminPassword,
  changeAdminPassword,
} from "@/lib/firebase-client";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from "ag-grid-community";
import {
  SquaresFour,
  Package,
  Receipt,
  ChartBar,
  ChatCircle,
  Truck,
  Gear,
  SignOut,
  List,
  Plus,
  Printer,
  Download,
  ArrowRight,
  Storefront,
  PencilSimple,
} from "@phosphor-icons/react";
import {
  initialStore,
  calculate,
  money,
  recordBill,
  periodStart,
  today,
  categories,
  productUnits,
  type Store,
  type Product,
  type Line,
  type Bill,
  type Settings,
} from "@/lib/domain";
import {
  productSchema,
  billSchema,
  settingsSchema,
  saveError,
} from "@/lib/validation";
import { Brand } from "./shop";
import { Drawer, Empty } from "./ui";
ModuleRegistry.registerModules([AllCommunityModule]);
const gridTheme = themeQuartz.withParams({
  accentColor: "#3f7334",
  backgroundColor: "#fff",
  foregroundColor: "#18231a",
  headerBackgroundColor: "#f0f3ee",
  borderColor: "#dce5d9",
  fontFamily: "Inter, Arial, sans-serif",
  fontSize: 14,
  rowHeight: 48,
  headerHeight: 42,
  browserColorScheme: "light",
});
export function DataGrid({
  rows,
  columns,
  onRow,
}: {
  rows: Record<string, unknown>[];
  columns: ColDef[];
  onRow?: (data: any) => void;
}) {
  return (
    <>
      <div className="mobile-records">
        {rows.length ? (
          rows.map((row, n) => (
            <article key={String(row.id || n)}>
              {columns
                .filter((c) => c.field)
                .map((c) => {
                  const value = row[c.field!];
                  const Renderer = c.cellRenderer;
                  return (
                    <div key={c.field}>
                      <span>{c.headerName || c.field}</span>
                      <strong>
                        {Renderer ? (
                          <Renderer data={row} value={value} />
                        ) : typeof c.valueFormatter === "function" ? (
                          c.valueFormatter({ value, data: row } as any)
                        ) : (
                          String(value ?? "—")
                        )}
                      </strong>
                    </div>
                  );
                })}
              {onRow && (
                <button className="text-link" onClick={() => onRow(row)}>
                  Open record →
                </button>
              )}
            </article>
          ))
        ) : (
          <Empty title="No records to display" />
        )}
      </div>
      <div className="data-grid">
        <AgGridReact
          theme={gridTheme}
          rowData={rows}
          columnDefs={columns}
          defaultColDef={{
            flex: 1,
            minWidth: 130,
            sortable: true,
            filter: true,
            resizable: true,
          }}
          pagination
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50]}
          domLayout="autoHeight"
          onRowClicked={(e) => onRow?.(e.data)}
          overlayNoRowsTemplate="No records to display"
        />
      </div>
    </>
  );
}
export function Admin({ demo = false }: { demo?: boolean }) {
  const [store, setStore] = useState<Store>(structuredClone(initialStore));
  const [authenticated, setAuthenticated] = useState(demo);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  useAdminSession(authenticated && !demo ? sessionInfo : null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [mobile, setMobile] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("reason") === "inactive"
    )
      setNotice(
        "Signed out after two hours of inactivity. Please sign in again.",
      );
    if (demo) {
      setLoading(false);
      try {
        const saved = localStorage.getItem("raam-admin-demo");
        if (saved) setStore(JSON.parse(saved));
      } catch {}
      return;
    }
    authFetch("/api/auth")
      .then((r) => r.json())
      .then(async (d) => {
        setConfigured(d.configured);
        if (d.authenticated) {
          setSessionInfo(d);
          const r = await authFetch("/api/store?admin=1");
          const x = await r.json();
          if (x.store) {
            setStore(x.store);
            setAuthenticated(true);
          } else setError(x.error);
        }
      })
      .catch(() => setError("Unable to connect. Please refresh."))
      .finally(() => setLoading(false));
  }, [demo]);
  async function save(action: string, data: any) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (action === "product") data = productSchema.parse(data);
      if (action === "bill") data = billSchema.parse(data);
      if (action === "settings") data = settingsSchema.parse(data);
      let result;
      if (demo) {
        const next = structuredClone(store);
        if (action === "product") {
          const index = next.products.findIndex((p) => p.id === data.id);
          if (index < 0) next.products.push(data);
          else next.products[index] = data;
        }
        if (action === "settings") next.settings = data;
        if (action === "bill") result = recordBill(next, data);
        if (action === "enquiry-status") {
          const item = next.enquiries.find((e) => e.id === data.id);
          if (item) item.status = data.status;
        }
        localStorage.setItem("raam-admin-demo", JSON.stringify(next));
        setStore(next);
      } else {
        const r = await authFetch("/api/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, data }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setStore(d.store);
        result = d.result;
      }
      setNotice(
        action === "bill" ? "Bill saved. Inventory updated." : "Changes saved.",
      );
      return { ok: true, result };
    } catch (e) {
      setError(saveError(e));
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    await completeLogin(String(data.email), String(data.password));
  }
  async function completeLogin(email: string, password?: string) {
    setBusy(true);
    try {
      const idToken = await signInAdmin(email, password);
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const sr = await authFetch("/api/store?admin=1");
      const sd = await sr.json();
      if (!sr.ok) throw new Error(sd.error);
      setStore(sd.store);
      setSessionInfo(d);
      setAuthenticated(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="login-page">
        <Brand />
        <p>Checking your session…</p>
      </div>
    );
  if (!authenticated)
    return (
      <div className="login-page">
        <Brand />
        <form className="login-panel panel" onSubmit={login}>
          <span className="eyebrow">BUSINESS WORKSPACE</span>
          <h1>Welcome back.</h1>
          <p className="muted">Sign in to manage your store and billing.</p>
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="username"
              defaultValue="sriraamrope@gmail.com"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            className="btn outline full"
            disabled={busy || !configured}
            onClick={() => completeLogin("sriraamrope@gmail.com")}
          >
            Sign in with Google
          </button>
          <button
            type="button"
            className="text-link"
            disabled={!configured}
            onClick={async (event) => {
              try {
                const field = event.currentTarget.form?.elements.namedItem(
                  "email",
                ) as HTMLInputElement;
                await resetAdminPassword(
                  field?.value || "sriraamrope@gmail.com",
                );
                setNotice(
                  "If this email has an account, a password reset email will be sent.",
                );
              } catch {
                setError(
                  "Unable to send a reset email. Use Google sign-in or check the Firebase user setup.",
                );
              }
            }}
          >
            Forgot password?
          </button>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          {!configured && (
            <p className="notice">
              Secure login needs database and administrator configuration. No
              default password is enabled.
            </p>
          )}
          <Link className="text-link" href="/admin/demo">
            Explore the admin demo →
          </Link>
          <Link className="muted small" href="/">
            ← Back to storefront
          </Link>
        </form>
      </div>
    );
  const nav = [
    ["Overview", SquaresFour],
    ["Inventory", Package],
    ["Billing", Receipt],
    ["Purchases", Truck],
    ["Enquiries", ChatCircle],
    ["Reports", ChartBar],
    ["Settings", Gear],
  ] as const;
  const sales = store.bills.filter((b) => b.kind === "sale");
  const daily = sales.filter((b) => b.date === today());
  const low = store.products.filter((p) => !p.sample && p.stock < 5);
  const newProduct = () =>
    setProduct({
      id: crypto.randomUUID(),
      name: "",
      category: "Ropes",
      description: "",
      unit: "kg",
      price: 0,
      stock: 0,
      gst: 0,
      hsn: "",
      image: "rope",
      active: false,
      sample: false,
    });
  return (
    <div className="admin-shell">
      {mobile && (
        <div className="sidebar-overlay" onClick={() => setMobile(false)} />
      )}
      <aside className={`admin-sidebar ${mobile ? "is-open" : ""}`}>
        <Brand />
        <span className="sidebar-label">BUSINESS WORKSPACE</span>
        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => {
                setTab(name);
                setMobile(false);
                setError("");
                setNotice("");
              }}
            >
              <Icon size={21} />
              {name}
              {name === "Enquiries" &&
                store.enquiries.filter((e) => e.status === "new").length >
                  0 && (
                  <span className="count">
                    {store.enquiries.filter((e) => e.status === "new").length}
                  </span>
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            <Storefront size={20} />
            View storefront
          </Link>
          {demo ? (
            <Link href="/admin">
              <SignOut size={20} />
              Exit demo
            </Link>
          ) : (
            <button
              onClick={async () => {
                await authFetch("/api/auth", { method: "DELETE" });
                await signOutAdmin();
                setSessionInfo(null);
                setAuthenticated(false);
              }}
            >
              <SignOut size={20} />
              Sign out
            </button>
          )}
          <small>
            Sri Raam Rope Merchants
            <br />
            Salem, Tamil Nadu
          </small>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="icon-btn mobile-menu"
            aria-label="Open admin menu"
            onClick={() => setMobile(true)}
          >
            <List size={24} />
          </button>
          <span>
            Store management <span className="muted">/ {tab}</span>
          </span>
          <div>
            <span className="badge">
              {demo ? "Demo workspace" : "Administrator"}
            </span>
            <span className="avatar">SR</span>
          </div>
        </header>
        {demo && (
          <div className="demo-notice">
            Demo mode · Changes are saved only in this browser. No live orders
            or financial records are changed.
          </div>
        )}
        <main className="admin-content">
          <div className="admin-page-head">
            <div>
              <span className="muted small">
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "full",
                  timeZone: "Asia/Kolkata",
                }).format(new Date())}
              </span>
              <h1>
                {tab === "Overview" ? "Your business, at a glance." : tab}
              </h1>
              <p className="muted">
                {
                  {
                    Overview: "A clear view of your store and the work ahead.",
                    Inventory: "Manage products, prices and available stock.",
                    Billing: "Create a bill in a few simple steps.",
                    Purchases:
                      "Record vendor purchases and add incoming stock.",
                    Enquiries: "Follow up on customer requirements.",
                    Reports:
                      "Review sales, purchases, enquiries and tax totals.",
                    Settings:
                      "Your business details, storefront banner and print preferences.",
                  }[tab]
                }
              </p>
            </div>
            {tab === "Inventory" && (
              <button className="btn primary" onClick={newProduct}>
                <Plus size={18} />
                Add product
              </button>
            )}
            {tab === "Overview" && (
              <button className="btn primary" onClick={() => setTab("Billing")}>
                <Plus size={18} />
                New bill
              </button>
            )}
          </div>
          {error && (
            <p className="error notice" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="success notice" role="status">
              {notice}
            </p>
          )}
          {tab === "Overview" && (
            <>
              <div className="stats-grid">
                <Stat
                  label="Today's sales"
                  value={money(daily.reduce((s, b) => s + b.total, 0))}
                  note={`${daily.length} bills created`}
                />
                <Stat
                  label="Products"
                  value={String(store.products.length)}
                  note={`${store.products.filter((p) => p.active).length} visible in catalogue`}
                />
                <Stat
                  label="New enquiries"
                  value={String(
                    store.enquiries.filter((e) => e.status === "new").length,
                  )}
                  note="Awaiting your response"
                />
                <Stat
                  label="Low stock"
                  value={String(low.length)}
                  note="Products below 5 units"
                />
              </div>
              <div className="panel">
                <div className="panel-head">
                  <h2>Recent sales</h2>
                  <button
                    className="text-link"
                    onClick={() => setTab("Billing")}
                  >
                    Create a bill →
                  </button>
                </div>
                <BillGrid bills={sales.slice(0, 10)} onSelect={setViewBill} />
              </div>
              <div className="panel quick-start">
                <h2>A simple daily workflow</h2>
                <p>
                  Add opening stock in Inventory, record supplier purchases,
                  then create customer bills. Saved bills update stock
                  automatically.
                </p>
                <div>
                  <button
                    className="btn outline"
                    onClick={() => setTab("Inventory")}
                  >
                    Manage inventory
                  </button>
                  <button
                    className="btn outline"
                    onClick={() => setTab("Purchases")}
                  >
                    Record a purchase
                  </button>
                </div>
              </div>
            </>
          )}
          {tab === "Inventory" && (
            <Inventory products={store.products} onEdit={setProduct} />
          )}
          {(tab === "Billing" || tab === "Purchases") && (
            <Billing
              key={tab}
              store={store}
              kind={tab === "Billing" ? "sale" : "purchase"}
              busy={busy}
              onSave={async (data) => {
                const r = await save("bill", data);
                if (r.ok && r.result) setViewBill(r.result);
                return r.ok;
              }}
              onSelect={setViewBill}
            />
          )}
          {tab === "Enquiries" && (
            <div className="panel">
              <DataGrid
                rows={store.enquiries as unknown as Record<string, unknown>[]}
                columns={[
                  {
                    field: "date",
                    headerName: "Received",
                    valueFormatter: (p) =>
                      new Date(p.value).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      }),
                  },
                  { field: "name", headerName: "Customer" },
                  { field: "phone" },
                  {
                    field: "message",
                    flex: 3,
                    wrapText: true,
                    autoHeight: true,
                  },
                  {
                    field: "status",
                    cellRenderer: (p: any) => (
                      <select
                        aria-label={`Status for ${p.data.name}`}
                        value={p.value}
                        onChange={(e) =>
                          save("enquiry-status", {
                            id: p.data.id,
                            status: e.target.value,
                          })
                        }
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                    ),
                  },
                  {
                    headerName: "Contact",
                    cellRenderer: (p: any) => (
                      <a
                        className="text-link"
                        href={`https://wa.me/91${p.data.phone}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp ↗
                      </a>
                    ),
                  },
                ]}
              />
            </div>
          )}
          {tab === "Reports" && <Reports store={store} />}
          {tab === "Settings" && (
            <>
              <SettingsForm
                settings={store.settings}
                busy={busy}
                onSave={(data) => save("settings", data)}
              />
              <PasswordSettings demo={demo} />
              <TeamSettings demo={demo} />
            </>
          )}
        </main>
      </div>
      <Drawer
        open={!!product}
        onClose={() => setProduct(null)}
        title={
          store.products.some((p) => p.id === product?.id)
            ? "Edit product"
            : "Add product"
        }
      >
        {product && (
          <ProductForm
            key={product.id}
            product={product}
            busy={busy}
            onSave={async (data) => {
              const r = await save("product", data);
              if (r.ok) setProduct(null);
            }}
          />
        )}
        {error && <p className="error drawer-body">{error}</p>}
      </Drawer>
      <Drawer
        open={!!viewBill}
        onClose={() => setViewBill(null)}
        title="Bill details"
      >
        {viewBill && <Invoice bill={viewBill} settings={store.settings} />}
      </Drawer>
    </div>
  );
}
function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="stat panel">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function BillGrid({
  bills,
  onSelect,
}: {
  bills: Bill[];
  onSelect: (bill: Bill) => void;
}) {
  return (
    <DataGrid
      rows={bills as unknown as Record<string, unknown>[]}
      onRow={onSelect}
      columns={[
        { field: "number", headerName: "Bill no." },
        { field: "date" },
        { field: "customer", headerName: "Customer / vendor", flex: 2 },
        {
          field: "total",
          headerName: "Amount",
          valueFormatter: (p) => money(p.value),
          type: "numericColumn",
        },
        {
          field: "status",
          cellRenderer: (p: any) => (
            <span className={`badge ${p.value === "unpaid" ? "warning" : ""}`}>
              {p.value}
            </span>
          ),
        },
        {
          headerName: "View",
          cellRenderer: (p: any) => (
            <button className="text-link" onClick={() => onSelect(p.data)}>
              View bill →
            </button>
          ),
        },
      ]}
    />
  );
}
function Inventory({
  products,
  onEdit,
}: {
  products: Product[];
  onEdit: (p: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All products");
  return (
    <div className="panel">
      <p className="help-text">
        Imported 255 item records from your 17 October stock report. Prices and
        GST rates need confirmation.{" "}
        <a href="/api/inventory-source">
          Download original stock and valuation CSV
        </a>
        .
      </p>
      <div className="admin-filters">
        <label>
          Search
          <input
            placeholder="Product name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <DataGrid
        rows={
          products.filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) &&
              (category === "All products" || p.category === category),
          ) as unknown as Record<string, unknown>[]
        }
        onRow={onEdit}
        columns={[
          { field: "name", headerName: "Product", flex: 2 },
          { field: "category", flex: 1.5 },
          {
            field: "price",
            headerName: "Selling price",
            valueFormatter: (p) =>
              p.data.sample || !p.value ? "Enquire" : money(p.value),
            type: "numericColumn",
          },
          {
            field: "stock",
            headerName: "Stock",
            type: "numericColumn",
            valueFormatter: (p) => `${p.value} ${p.data.unit}`,
          },
          {
            field: "gst",
            headerName: "GST",
            valueFormatter: (p) => `${p.value}%`,
            width: 90,
          },
          {
            field: "active",
            headerName: "Catalogue",
            cellRenderer: (p: any) => (
              <span className="badge">
                {p.data.sample
                  ? "Indicative"
                  : p.value
                    ? "Published"
                    : "Hidden"}
              </span>
            ),
          },
          {
            headerName: "Edit",
            cellRenderer: (p: any) => (
              <button
                className="icon-btn"
                aria-label={`Edit ${p.data.name}`}
                onClick={() => onEdit(p.data)}
              >
                <PencilSimple size={18} />
              </button>
            ),
          },
        ]}
      />
      <p className="small muted panel-foot">
        Click a row to edit. Negative stock includes balances from the supplied
        report and requires reconciliation. Hidden items with missing stock or
        units need review before publishing.
      </p>
    </div>
  );
}
async function readImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 8000000) throw new Error("Choose an image under 8 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image optimization is unavailable.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.7, 0.5]) {
      const result = canvas.toDataURL("image/webp", quality);
      if (result.length <= 750000) return result;
    }
    throw new Error("Choose a smaller image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ProductForm({
  product: p,
  busy,
  onSave,
}: {
  product: Product;
  busy: boolean;
  onSave: (p: Product) => void;
}) {
  const [image, setImage] = useState(p.image);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState(p.unit);
  const [active, setActive] = useState(p.active && p.unit !== "unconfirmed");
  const [processingImage, setProcessingImage] = useState(false);
  return (
    <form
      className="drawer-body form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        if (processingImage) return;
        const result = productSchema.safeParse({
          ...p,
          name: String(d.name),
          description: String(d.description),
          category: String(d.category),
          unit,
          price: Math.round(Number(d.price) * 100),
          stock: Number(d.stock),
          gst: Number(d.gst),
          hsn: String(d.hsn),
          active,
          showPrice: d.showPrice === "on",
          sample: d.sample === "on",
          image,
        });
        if (!result.success) {
          setError(saveError(result.error));
          const field = e.currentTarget.elements.namedItem(
            String(result.error.issues[0]?.path[0]),
          );
          if (field instanceof HTMLElement) field.focus();
          return;
        }
        setError("");
        onSave(result.data);
      }}
    >
      {p.importNote && <p className="help-text">{p.importNote}</p>}
      <label>
        Item name
        <input name="name" defaultValue={p.name} required maxLength={200} />
      </label>
      <label>
        Category
        <select name="category" defaultValue={p.category}>
          {categories.slice(1).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Description
        <textarea
          name="description"
          defaultValue={p.description}
          rows={3}
          maxLength={2000}
        />
      </label>
      <div className="form-grid">
        <label>
          Selling price (₹, before GST)
          <input
            name="price"
            type="number"
            defaultValue={p.price / 100}
            min="0"
            step="0.01"
            required
          />
        </label>
        <label>
          Unit
          <select
            name="unit"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              if (e.target.value === "unconfirmed") setActive(false);
            }}
          >
            {productUnits.map((x) => (
              <option key={x} value={x}>
                {x === "unconfirmed" ? "Choose unit…" : x}
              </option>
            ))}
          </select>
        </label>
        <label>
          Opening / current stock
          <input
            name="stock"
            type="number"
            defaultValue={p.stock}
            min="-10000000"
            step="0.001"
            required
          />
        </label>
        <label>
          GST rate
          <select name="gst" defaultValue={p.gst}>
            {[0, 5, 12, 18, 28, 40].map((n) => (
              <option key={n} value={n}>
                {n}%
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        HSN code
        <input name="hsn" defaultValue={p.hsn} maxLength={8} />
      </label>
      <label>
        Product photo
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            setProcessingImage(true);
            try {
              if (e.target.files?.[0])
                setImage(await readImage(e.target.files[0]));
              setError("");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setProcessingImage(false);
            }
          }}
        />
        <small>JPG, PNG or WebP, up to 8 MB. Optimized automatically.</small>
      </label>
      {(image.startsWith("data:") ||
        image.startsWith("/") ||
        image.startsWith("https://")) && (
        <img
          className="upload-preview"
          src={image}
          alt="Product upload preview"
        />
      )}
      <label className="check-label">
        <input
          type="checkbox"
          name="active"
          checked={active}
          disabled={unit === "unconfirmed"}
          onChange={(e) => setActive(e.target.checked)}
        />
        Show in storefront
      </label>
      {unit === "unconfirmed" && (
        <p className="help-text" role="status">
          Choose the selling unit above to publish this item. You can save its
          photo and details now as a hidden draft.
        </p>
      )}
      <label className="check-label">
        <input
          type="checkbox"
          name="showPrice"
          defaultChecked={p.showPrice !== false}
        />
        Show price in storefront
      </label>
      <p className="help-text">
        Switch off to show “Price on enquiry” in the store and cart. Your
        selling price stays available for billing.
      </p>
      <label className="check-label">
        <input type="checkbox" name="sample" defaultChecked={p.sample} />
        Confirm stock availability on enquiry
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary full" disabled={busy || processingImage}>
        {processingImage
          ? "Preparing photo…"
          : busy
            ? "Saving…"
            : "Save product"}
      </button>
    </form>
  );
}
const blankLine = (): Line => ({
  name: "",
  quantity: 1,
  price: 0,
  gst: 0,
  unit: "piece",
  hsn: "",
});
const states = [
  "Tamil Nadu",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
function Billing({
  store,
  kind,
  busy,
  onSave,
  onSelect,
}: {
  store: Store;
  kind: "sale" | "purchase";
  busy: boolean;
  onSave: (data: any) => Promise<boolean>;
  onSelect: (b: Bill) => void;
}) {
  const [items, setItems] = useState<Line[]>([blankLine()]);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [state, setState] = useState("Tamil Nadu");
  const [error, setError] = useState("");
  const totals = calculate(items, state);
  const change = (i: number, patch: Partial<Line>) =>
    setItems((rows) => rows.map((r, n) => (i === n ? { ...r, ...patch } : r)));
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const ok = await onSave({ ...data, kind, state, items, requestId });
    if (ok) {
      setRequestId(crypto.randomUUID());
      setItems([blankLine()]);
      form.reset();
      setState("Tamil Nadu");
    } else
      setError("Bill was not saved. Check the message above and try again.");
  }
  return (
    <>
      <form className="panel billing-form" onSubmit={submit}>
        <div className="panel-head">
          <h2>
            {kind === "sale" ? "New customer bill" : "New vendor purchase"}
          </h2>
          <span className="badge">
            {state === "Tamil Nadu" ? "CGST + SGST" : "IGST"}
          </span>
        </div>
        <div className="form-grid billing-customer">
          <label>
            {kind === "sale" ? "Customer name" : "Vendor name"}
            <input
              name="customer"
              required
              maxLength={200}
              placeholder={
                kind === "sale" ? "Customer / walk-in name" : "Supplier name"
              }
            />
          </label>
          <label>
            Mobile number
            <input
              name="phone"
              type="tel"
              pattern="\+?[0-9 -]{7,16}"
              placeholder="Optional"
            />
          </label>
          <label>
            Date
            <input type="date" name="date" defaultValue={today()} required />
          </label>
          <label>
            Place of supply
            <select value={state} onChange={(e) => setState(e.target.value)}>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Address
            <input
              name="address"
              maxLength={1000}
              placeholder="Customer or vendor address"
            />
          </label>
          <label>
            {kind === "sale" ? "Customer" : "Vendor"} GSTIN
            <input
              name="gstin"
              placeholder="Optional"
              maxLength={15}
              pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"
            />
          </label>
        </div>
        <div className="bill-table-wrap">
          <table className="bill-editor">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Item name</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Price ₹</th>
                <th>GST %</th>
                <th>HSN</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <input
                      aria-label={`Item ${i + 1} name`}
                      list={`product-options-${i}`}
                      value={item.name}
                      required
                      onChange={(e) => {
                        const p = store.products.find(
                          (p) => p.name === e.target.value,
                        );
                        change(
                          i,
                          p
                            ? {
                                productId: p.id,
                                name: p.name,
                                price: p.price,
                                gst: p.gst,
                                unit: p.unit,
                                hsn: p.hsn,
                              }
                            : { name: e.target.value, productId: undefined },
                        );
                      }}
                      placeholder="Select or type new item"
                    />
                    <datalist id={`product-options-${i}`}>
                      {store.products.map((p) => (
                        <option value={p.name} key={p.id}>
                          {p.stock} {p.unit}
                        </option>
                      ))}
                    </datalist>
                  </td>
                  <td>
                    <input
                      aria-label={`Item ${i + 1} quantity`}
                      type="number"
                      min="0.001"
                      step="0.001"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                        change(i, { quantity: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`Item ${i + 1} unit`}
                      value={item.unit}
                      onChange={(e) => change(i, { unit: e.target.value })}
                    >
                      {productUnits.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      aria-label={`Item ${i + 1} price`}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.price / 100}
                      onChange={(e) =>
                        change(i, {
                          price: Math.round(Number(e.target.value) * 100),
                        })
                      }
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`Item ${i + 1} GST rate`}
                      value={item.gst}
                      onChange={(e) =>
                        change(i, { gst: Number(e.target.value) })
                      }
                    >
                      {[0, 5, 12, 18, 28, 40].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                    <small className="tax-split">
                      {state === "Tamil Nadu"
                        ? `${item.gst / 2}% C + ${item.gst / 2}% S`
                        : `${item.gst}% I`}
                    </small>
                  </td>
                  <td>
                    <input
                      aria-label={`Item ${i + 1} HSN`}
                      value={item.hsn}
                      maxLength={8}
                      onChange={(e) => change(i, { hsn: e.target.value })}
                    />
                  </td>
                  <td className="money">
                    {money(calculate([item], state).total)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="remove-line"
                      aria-label={`Remove item ${i + 1}`}
                      disabled={items.length === 1}
                      onClick={() =>
                        setItems((rows) => rows.filter((_, n) => n !== i))
                      }
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="billing-lower">
          <div>
            <button
              type="button"
              className="btn outline"
              onClick={() => setItems((rows) => [...rows, blankLine()])}
            >
              <Plus size={17} />
              Add item
            </button>
            <p className="muted small">
              New items are added to inventory when you save.
              <br />
              Prices entered here exclude GST.
            </p>
            <label>
              Payment status
              <select name="status" defaultValue="paid">
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </label>
          </div>
          <div className="bill-totals">
            <div>
              <span>No. of items</span>
              <strong>
                {items.length} lines · {totals.units} units
              </strong>
            </div>
            <div>
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            {state === "Tamil Nadu" ? (
              <>
                <div>
                  <span>CGST</span>
                  <span>{money(totals.cgst)}</span>
                </div>
                <div>
                  <span>SGST</span>
                  <span>{money(totals.sgst)}</span>
                </div>
              </>
            ) : (
              <div>
                <span>IGST</span>
                <span>{money(totals.igst)}</span>
              </div>
            )}
            <div className="grand-total">
              <strong>Total amount</strong>
              <strong>{money(totals.total)}</strong>
            </div>
            <button disabled={busy} className="btn primary full" type="submit">
              {busy
                ? "Saving…"
                : kind === "sale"
                  ? "Save bill & update stock"
                  : "Save purchase & add stock"}
            </button>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </form>
      <div className="panel">
        <div className="panel-head">
          <h2>{kind === "sale" ? "Sales bills" : "Purchase history"}</h2>
          <span className="small muted">Click a bill to view or print</span>
        </div>
        <BillGrid
          bills={store.bills.filter((b) => b.kind === kind)}
          onSelect={onSelect}
        />
      </div>
    </>
  );
}
function Invoice({ bill: b, settings }: { bill: Bill; settings: Settings }) {
  const s = b.business || settings;
  const [paper, setPaper] = useState(settings.paper);
  return (
    <div className="drawer-body">
      <div className="print-actions">
        <label>
          Paper size
          <select
            value={paper}
            onChange={(e) => setPaper(e.target.value as "A4" | "A5")}
          >
            <option>A4</option>
            <option>A5</option>
          </select>
        </label>
        <button className="btn primary" onClick={() => window.print()}>
          <Printer size={18} />
          Print bill
        </button>
      </div>
      <style>{`@media print { @page {size: ${paper} portrait; margin: 10mm;} }`}</style>
      <div
        className={`invoice print-${paper.toLowerCase()}`}
        id="print-invoice"
      >
        <div className="invoice-header">
          <div>
            <h2>{s.name}</h2>
            <p>{s.address}</p>
            <p>Phone: +91 {s.phone}</p>
            {s.gstin && <p>GSTIN: {s.gstin}</p>}
          </div>
          <strong>
            {b.kind === "purchase"
              ? "PURCHASE RECORD"
              : b.cgst + b.sgst + b.igst > 0
                ? "TAX INVOICE"
                : "SALES BILL"}
          </strong>
        </div>
        <div className="invoice-meta">
          <div>
            <strong>
              {b.kind === "purchase" ? "Vendor" : "Bill to"}: {b.customer}
            </strong>
            {b.address && <p>{b.address}</p>}
            {b.phone && <p>Phone: {b.phone}</p>}
            {b.gstin && <p>GSTIN: {b.gstin}</p>}
            <p>Place of supply: {b.state}</p>
          </div>
          <div>
            <p>
              Bill: <strong>{b.number}</strong>
            </p>
            <p>Date: {b.date}</p>
            <p>Status: {b.status}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item / HSN</th>
              <th>Qty</th>
              <th>Price</th>
              <th>{b.state === "Tamil Nadu" ? "CGST / SGST" : "IGST"}</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {b.items.map((i, n) => (
              <tr key={n}>
                <td>{n + 1}</td>
                <td>
                  {i.name}
                  {i.hsn && <small>HSN: {i.hsn}</small>}
                </td>
                <td>
                  {i.quantity} {i.unit}
                </td>
                <td>{money(i.price)}</td>
                <td>
                  {b.state === "Tamil Nadu" ? (
                    <>
                      {i.gst / 2}% / {i.gst / 2}%
                      <small>
                        {money(calculate([i], b.state).cgst)} /{" "}
                        {money(calculate([i], b.state).sgst)}
                      </small>
                    </>
                  ) : (
                    <>
                      {i.gst}%
                      <small>{money(calculate([i], b.state).igst)}</small>
                    </>
                  )}
                </td>
                <td>{money(calculate([i], b.state).total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-summary">
          <p>
            No. of items: <strong>{b.items.length}</strong> · Total quantity:{" "}
            <strong>{b.units}</strong>
          </p>
          <div>
            <p>
              Subtotal <span>{money(b.subtotal)}</span>
            </p>
            {b.state === "Tamil Nadu" ? (
              <>
                <p>
                  CGST <span>{money(b.cgst)}</span>
                </p>
                <p>
                  SGST <span>{money(b.sgst)}</span>
                </p>
              </>
            ) : (
              <p>
                IGST <span>{money(b.igst)}</span>
              </p>
            )}
            <p className="grand-total">
              <strong>Grand total</strong>
              <strong>{money(b.total)}</strong>
            </p>
          </div>
        </div>
        <div className="invoice-footer">
          <span>Thank you for your business.</span>
          <span>
            For {s.name}
            <br />
            <br />
            Authorised signatory
          </span>
        </div>
      </div>
    </div>
  );
}
function Reports({ store }: { store: Store }) {
  const [period, setPeriod] = useState("month");
  const [type, setType] = useState("Sales");
  const [group, setGroup] = useState("Bill");
  const [from, setFrom] = useState(periodStart("month"));
  const [to, setTo] = useState(today());
  const bills = store.bills.filter(
    (b) =>
      b.date >= from &&
      b.date <= to &&
      b.kind === (type === "Purchases" ? "purchase" : "sale") &&
      (type !== "GST sales" || b.cgst + b.sgst + b.igst > 0),
  );
  const enquiries = store.enquiries.filter(
    (e) => today(new Date(e.date)) >= from && today(new Date(e.date)) <= to,
  );
  const grouped: Record<
    string,
    {
      name: string;
      quantity: number;
      subtotal: number;
      cgst: number;
      sgst: number;
      igst: number;
      total: number;
    }
  > = {};
  for (const b of bills)
    for (const i of b.items) {
      const key =
        group === "Item"
          ? i.name
          : group === "Vendor"
            ? b.customer
            : `${i.gst}%`;
      const tax = calculate([i], b.state);
      const row = (grouped[key] ??= {
        name: key,
        quantity: 0,
        subtotal: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
      });
      row.quantity += i.quantity;
      row.subtotal += tax.subtotal;
      row.cgst += tax.cgst;
      row.sgst += tax.sgst;
      row.igst += tax.igst;
      row.total += tax.total;
    }
  const numeric = (field: string, headerName: string): ColDef => ({
    field,
    headerName,
    type: "numericColumn",
    valueFormatter: (p) => money(p.value),
  });
  const rows: Record<string, unknown>[] =
    type === "Enquiries"
      ? enquiries
      : group === "Bill"
        ? bills
        : Object.values(grouped);
  const cols: ColDef[] =
    type === "Enquiries"
      ? [
          { field: "date" },
          { field: "name" },
          { field: "phone" },
          { field: "message", flex: 3 },
          { field: "status" },
        ]
      : group === "Bill"
        ? [
            { field: "number", headerName: "Bill" },
            { field: "date" },
            {
              field: "customer",
              headerName: type === "Purchases" ? "Vendor" : "Customer",
            },
            numeric("subtotal", "Taxable"),
            numeric("cgst", "CGST"),
            numeric("sgst", "SGST"),
            numeric("igst", "IGST"),
            numeric("total", "Total"),
          ]
        : [
            { field: "name", headerName: group },
            { field: "quantity", type: "numericColumn" },
            numeric("subtotal", "Taxable"),
            numeric("cgst", "CGST"),
            numeric("sgst", "SGST"),
            numeric("igst", "IGST"),
            numeric("total", "Total"),
          ];
  function exportCsv() {
    const fields = cols.map((c) => c.field!);
    const quote = (v: unknown) => {
      let value = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(value)) value = "'" + value;
      return '"' + value.replaceAll('"', '""') + '"';
    };
    const content = [
      cols.map((c) => quote(c.headerName || c.field)).join(","),
      ...rows.map((row) =>
        fields
          .map((f) =>
            quote(
              ["subtotal", "cgst", "sgst", "igst", "total"].includes(f)
                ? Number(row[f]) / 100
                : row[f],
            ),
          )
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `sri-raam-${type.toLowerCase()}-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="panel admin-filters">
        <label>
          Report
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setGroup("Bill");
            }}
          >
            {["Sales", "GST sales", "Purchases", "Enquiries"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Period
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              if (e.target.value !== "custom") {
                setFrom(periodStart(e.target.value));
                setTo(today());
              }
            }}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="custom">Custom dates</option>
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              setFrom(e.target.value);
              setPeriod("custom");
            }}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => {
              setTo(e.target.value);
              setPeriod("custom");
            }}
          />
        </label>
        {type !== "Enquiries" && (
          <label>
            Group by
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option>Bill</option>
              <option>Item</option>
              <option>GST rate</option>
              {type === "Purchases" && <option>Vendor</option>}
            </select>
          </label>
        )}
        <button
          className="btn outline"
          onClick={exportCsv}
          disabled={!rows.length}
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>
      <div className="stats-grid">
        <Stat
          label={type === "Enquiries" ? "Enquiries" : "Records"}
          value={String(type === "Enquiries" ? enquiries.length : bills.length)}
          note={`${from} to ${to}`}
        />
        <Stat
          label="Taxable value"
          value={money(bills.reduce((s, b) => s + b.subtotal, 0))}
          note="Before GST"
        />
        <Stat
          label="GST total"
          value={money(bills.reduce((s, b) => s + b.cgst + b.sgst + b.igst, 0))}
          note="CGST + SGST + IGST"
        />
        <Stat
          label="Total amount"
          value={money(bills.reduce((s, b) => s + b.total, 0))}
          note="Including tax"
        />
      </div>
      <div className="panel">
        <DataGrid rows={rows} columns={cols} />
        <p className="small muted panel-foot">
          Currency values in CSV are in rupees. Reports include saved records
          only. Weeks start on Monday; dates follow India time.
        </p>
      </div>
    </>
  );
}
function SettingsForm({
  settings: s,
  busy,
  onSave,
}: {
  settings: Settings;
  busy: boolean;
  onSave: (s: Settings) => Promise<any>;
}) {
  const [banner, setBanner] = useState(s.banner);
  const [error, setError] = useState("");
  return (
    <form
      className="settings-form"
      onSubmit={(e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        onSave({ ...d, banner } as Settings);
      }}
    >
      <section className="panel">
        <h2>Business details</h2>
        <div className="form-grid">
          <label>
            Business / invoice name
            <input name="name" defaultValue={s.name} required maxLength={200} />
          </label>
          <label>
            Contact number
            <input
              name="phone"
              defaultValue={s.phone}
              pattern="[0-9]{10}"
              required
            />
          </label>
          <label>
            WhatsApp (country code + number)
            <input
              name="whatsapp"
              defaultValue={s.whatsapp}
              pattern="91[0-9]{10}"
              required
            />
          </label>
          <label>
            Email
            <input type="email" name="email" defaultValue={s.email} required />
          </label>
          <label>
            GSTIN
            <input
              name="gstin"
              defaultValue={s.gstin}
              placeholder="Required before issuing GST invoices"
              pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"
              maxLength={15}
            />
          </label>
          <label>
            Invoice prefix
            <input
              name="invoicePrefix"
              defaultValue={s.invoicePrefix}
              pattern="[A-Z0-9-]{1,12}"
              required
            />
          </label>
        </div>
        <label>
          Business address
          <textarea name="address" defaultValue={s.address} required rows={2} />
        </label>
      </section>
      <section className="panel">
        <h2>Storefront hero banner</h2>
        <p className="muted small">
          Upload an occasion banner. A 3:2 landscape image works best. Keep the
          full subject inside the frame.
        </p>
        <img
          className="banner-preview"
          src={bannerImage(banner)}
          alt="Current hero banner"
        />
        <label>
          Upload banner
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              try {
                if (e.target.files?.[0])
                  setBanner(await readImage(e.target.files[0]));
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
          <small>JPG, PNG or WebP, up to 8 MB. Optimized automatically.</small>
        </label>
        <label>
          Hero headline
          <textarea
            name="heroTitle"
            defaultValue={s.heroTitle}
            required
            maxLength={120}
            rows={2}
          />
        </label>
        <label>
          Hero description
          <textarea
            name="heroText"
            defaultValue={s.heroText}
            required
            maxLength={300}
            rows={2}
          />
        </label>
      </section>
      <section className="panel">
        <h2>Print preferences</h2>
        <label>
          Default invoice paper size
          <select name="paper" defaultValue={s.paper}>
            <option>A4</option>
            <option>A5</option>
          </select>
        </label>
        <p className="small muted">
          You can also change paper size before printing an individual bill.
        </p>
      </section>
      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={busy}>
        Save settings
      </button>
    </form>
  );
}

function PasswordSettings({ demo }: { demo: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="settings-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (demo) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const current = String(data.get("currentPassword") || "");
        const next = String(data.get("newPassword") || "");
        if (next !== String(data.get("confirmPassword"))) {
          setError("New passwords do not match.");
          return;
        }
        setBusy(true);
        setError("");
        setMessage("");
        try {
          await changeAdminPassword(current, next);
          form.reset();
          setMessage("Your administrator password has been changed.");
        } catch (e) {
          const code = (e as { code?: string }).code;
          setError(
            code === "auth/invalid-credential" || code === "auth/wrong-password"
              ? "Your current password is incorrect."
              : code === "auth/too-many-requests"
                ? "Too many attempts. Please try again later."
                : "Unable to change your password. Check your current password and try again, or use Forgot password on the login page.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className="panel">
        <h2>Your login password</h2>
        <p>
          Change the password for your signed-in store account. This does not
          change your Google account password.
        </p>
        {demo ? (
          <p className="small muted">
            Password changes are available only in the live administrator
            workspace.
          </p>
        ) : (
          <>
            <div className="form-grid">
              <label>
                Current password
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={busy}
                />
              </label>
              <label>
                New password
                <input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={busy}
                />
              </label>
              <label>
                Confirm new password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={busy}
                />
              </label>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {message && <p role="status">{message}</p>}
            <button className="btn primary" disabled={busy}>
              {busy ? "Changing password…" : "Change password"}
            </button>
          </>
        )}
      </section>
    </form>
  );
}
