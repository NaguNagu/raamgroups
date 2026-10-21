import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  addDoc,
  setDoc,
} from "firebase/firestore/lite";
import { firestore } from "./firebase-server";
import {
  initialStore,
  storefrontProduct,
  type Store,
  type Product,
  type Enquiry,
} from "./domain";
export { initialStore };
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
function data(snapshot: any) {
  const { createdAt, updatedAt, ...value } = snapshot.data();
  return { ...value, id: snapshot.id };
}
async function snapshotStore() {
  const db = await firestore();
  const meta = await getDoc(doc(db, "private", "business"));
  if (!meta.exists())
    throw new Error(
      "Business storage is not initialized. Restore the business records before creating bills.",
    );
  const [products, bills, enquiries] = await Promise.all(
    ["products", "bills", "enquiries"].map((name) =>
      getDocs(collection(db, name)),
    ),
  );
  return {
    db,
    version: Number(meta.data().version),
    store: {
      sequence: meta.data().sequence,
      settings: meta.data().settings,
      products: products.docs.map(data),
      bills: bills.docs
        .map(data)
        .sort((a: any, b: any) => b.number.localeCompare(a.number)),
      enquiries: enquiries.docs
        .map(data)
        .sort((a: any, b: any) => b.date.localeCompare(a.date)),
    } as Store,
  };
}
export async function readStore() {
  return (await snapshotStore()).store;
}
export async function readCatalogue() {
  const db = await firestore(false);
  const [settings, products] = await Promise.all([
    getDoc(doc(db, "public", "settings")),
    getDocs(query(collection(db, "products"), where("active", "==", true))),
  ]);
  if (!settings.exists())
    return {
      products: initialStore.products
        .filter((p) => p.active)
        .map(storefrontProduct),
      settings: initialStore.settings,
    };
  return {
    products: (products.docs.map(data) as Product[]).map(storefrontProduct),
    settings: settings.data() as Store["settings"],
  };
}
export async function mutateStore<T>(fn: (store: Store) => T): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { db, version, store } = await snapshotStore();
    const before = structuredClone(store);
    const result = fn(store);
    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, "private", "business");
        const meta = await transaction.get(ref);
        if ((meta.exists() ? Number(meta.data().version) : 0) !== version)
          throw new Error("RETRY_REVISION");
        for (const name of ["products", "bills", "enquiries"] as const) {
          const previous = new Map(
            before[name].map((item) => [item.id, JSON.stringify(item)]),
          );
          for (const item of store[name]) {
            if (
              version === 0 ||
              previous.get(item.id) !== JSON.stringify(item)
            ) {
              transaction.set(
                doc(db, name, item.id),
                {
                  ...plain(item),
                  updatedAt: serverTimestamp(),
                  ...(previous.has(item.id) && version > 0
                    ? {}
                    : { createdAt: serverTimestamp() }),
                },
                { merge: true },
              );
            }
          }
        }
        transaction.set(ref, {
          version: version + 1,
          sequence: store.sequence,
          settings: plain(store.settings),
          updatedAt: serverTimestamp(),
        });
        transaction.set(doc(db, "public", "settings"), plain(store.settings));
      });
      return result;
    } catch (e) {
      if ((e as Error).message === "RETRY_REVISION") continue;
      throw e;
    }
  }
  throw new Error("The store changed while saving. Please try again.");
}
export async function createEnquiry(enquiry: Enquiry) {
  const db = await firestore(false);
  await setDoc(doc(db, "enquiries", enquiry.id), {
    ...enquiry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function saveImageAsset(image: string) {
  if (!image.startsWith("data:")) return image;
  const match =
    /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!match || image.length > 750000)
    throw new Error("Choose a smaller image.");
  const { createHash } = await import("node:crypto");
  const id = createHash("sha256").update(image).digest("hex");
  const db = await firestore();
  const ref = doc(db, "assets", id);
  if (!(await getDoc(ref)).exists())
    await setDoc(ref, {
      contentType: match[1],
      body: match[2],
      createdAt: serverTimestamp(),
    });
  return `/api/images/${id}`;
}
export async function readImageAsset(id: string) {
  return getDoc(doc(await firestore(false), "assets", id));
}
