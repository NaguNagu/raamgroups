import { publicCatalogue } from "./public-catalogue";
export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  price: number;
  stock: number;
  gst: number;
  hsn: string;
  image: string;
  active: boolean;
  sample?: boolean;
  showPrice?: boolean;
  importNote?: string;
};
export function storefrontPrice(product: Product): number {
  return product.showPrice === false ? 0 : product.price;
}
export function storefrontProduct(product: Product): Product {
  return { ...product, price: storefrontPrice(product) };
}
export type Line = {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  gst: number;
  unit: string;
  hsn: string;
};
export type Bill = {
  requestId?: string;
  id: string;
  number: string;
  kind: "sale" | "purchase";
  date: string;
  customer: string;
  phone: string;
  address: string;
  gstin: string;
  state: string;
  items: Line[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  units: number;
  status: "paid" | "unpaid";
  business?: Settings;
};
export type Enquiry = {
  id: string;
  date: string;
  name: string;
  phone: string;
  message: string;
  status: "new" | "contacted" | "closed";
};
export type Settings = {
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  gstin: string;
  paper: "A4" | "A5";
  banner: string;
  heroTitle: string;
  heroText: string;
  invoicePrefix: string;
};
export type Store = {
  products: Product[];
  bills: Bill[];
  enquiries: Enquiry[];
  settings: Settings;
  sequence: number;
};
export const categories = [
  "All products",
  "Ropes",
  "Cattle accessories",
  "Brass & pooja",
  "Cot tape rolls",
  "Threads & weaving",
  "Hardware & chains",
  "Farm tools",
  "Pet accessories",
];
export const productUnits = [
  "kg",
  "metre",
  "piece",
  "roll",
  "set",
  "bundle",
  "pair",
  "packet",
  "box",
  "unconfirmed",
] as const;
export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n / 100);
export const round = (n: number) => Math.round(n);
export function calculate(items: Line[], state: string) {
  let subtotal = 0,
    cgst = 0,
    sgst = 0,
    igst = 0;
  for (const item of items) {
    const base = round(item.price * item.quantity);
    subtotal += base;
    if (state === "Tamil Nadu") {
      const half = round((base * item.gst) / 200);
      cgst += half;
      sgst += half;
    } else igst += round((base * item.gst) / 100);
  }
  return {
    subtotal,
    cgst,
    sgst,
    igst,
    total: subtotal + cgst + sgst + igst,
    units: items.reduce((s, i) => s + i.quantity, 0),
  };
}
export function whatsappMessage(
  name: string,
  phone: string,
  items: { product: Product; quantity: number }[],
) {
  return `Hello Sri Raam Rope Merchants, I would like to order:\n\n${items.map((i, n) => `${n + 1}. ${i.product.name} — ${i.quantity} ${i.product.unit}${storefrontPrice(i.product) ? ` × ${money(storefrontPrice(i.product))}` : ""}`).join("\n")}\n\nCustomer: ${name}\nPhone: ${phone}\nPlease confirm price, stock, GST and delivery charges before confirming my order.`;
}
export const initialStore: Store = {
  sequence: 0,
  bills: [],
  enquiries: [],
  settings: {
    name: "Sri Raam Rope Merchants",
    address: "#1, Chekkan Kadu Lane, Shevapet, Salem – 636002, Tamil Nadu",
    phone: "9842888851",
    whatsapp: "919842888851",
    email: "sriraamrope@gmail.com",
    gstin: "",
    paper: "A4",
    banner: "/business-poster.png",
    heroTitle: "Strong ropes.\nStronger relationships.",
    heroText:
      "Ropes, cattle essentials and traditional brassware. Serving farms, homes and businesses for generations.",
    invoicePrefix: "SR",
  },
  products: publicCatalogue,
};
export function recordBill(
  store: Store,
  input: Omit<
    Bill,
    | "id"
    | "number"
    | "subtotal"
    | "cgst"
    | "sgst"
    | "igst"
    | "total"
    | "units"
    | "business"
  >,
): Bill {
  const existing = store.bills.find(
    (b) => input.requestId && b.requestId === input.requestId,
  );
  if (existing) return existing;
  const originalStore = store;
  store = structuredClone(store);
  const createdIds = new Set<string>();
  if (
    input.kind === "sale" &&
    input.items.some((i) => i.gst > 0) &&
    !store.settings.gstin
  )
    throw new Error(
      "Add the business GSTIN in Settings before issuing a GST invoice.",
    );
  const totals = calculate(input.items, input.state);
  const bill: Bill = {
    ...input,
    ...totals,
    id: crypto.randomUUID(),
    number: `${store.settings.invoicePrefix}-${String(++store.sequence).padStart(5, "0")}`,
    business: { ...store.settings },
  };
  for (const line of input.items) {
    if (line.unit === "unconfirmed")
      throw new Error(
        `Select the correct unit for ${line.name} before billing.`,
      );
    let product = store.products.find((p) => p.id === line.productId);
    if (!product)
      product = store.products.find(
        (p) =>
          p.name.toLowerCase() === line.name.trim().toLowerCase() &&
          p.unit === line.unit,
      );
    const isNew = !product;
    if (!product) {
      product = {
        id: crypto.randomUUID(),
        name: line.name.trim(),
        category: "Ropes",
        description: "",
        unit: line.unit,
        price: line.price,
        stock: 0,
        gst: line.gst,
        hsn: line.hsn,
        image: "rope",
        active: false,
      };
      store.products.push(product);
      createdIds.add(product.id);
    }
    if (product.unit !== line.unit)
      throw new Error(
        `Unit mismatch for ${product.name}. Use ${product.unit} or create a separate item.`,
      );
    if (
      input.kind === "sale" &&
      product.stock < line.quantity &&
      !product.sample &&
      !isNew &&
      !createdIds.has(product.id)
    )
      throw new Error(
        `Insufficient stock for ${product.name}. Record a purchase or update opening stock first.`,
      );
    product.stock =
      round(
        (product.stock +
          (input.kind === "purchase" ? line.quantity : -line.quantity)) *
          1000,
      ) / 1000;
  }
  store.bills.unshift(bill);
  Object.assign(originalStore, store);
  return bill;
}
export function periodStart(period: string, now = new Date()) {
  const date = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  date.setHours(0, 0, 0, 0);
  if (period === "week")
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  if (period === "month") date.setDate(1);
  if (period === "year") {
    date.setMonth(0, 1);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function today(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
