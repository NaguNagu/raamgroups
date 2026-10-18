import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase/app";
import {
  setLogLevel,
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  where,
} from "firebase/firestore/lite";
const app = initializeApp(
  {
    projectId: "sri-raam-rope",
    apiKey: "AIzaSyBpf9-v7RCUYHr17oz0EKnw6v598ySFTdI",
  },
  "public-rules-check",
);
setLogLevel("silent");
const db = getFirestore(app);
let passed = 0;
async function denied(label, action) {
  await assert.rejects(action, (e) => e.code === "permission-denied");
  console.log("PASS", label);
  passed++;
}
await getDoc(doc(db, "public", "settings"));
console.log("PASS public business settings readable");
passed++;
await getDocs(query(collection(db, "products"), where("active", "==", true)));
console.log("PASS published-product query allowed");
passed++;
await denied("private business metadata denied", () =>
  getDoc(doc(db, "private", "business")),
);
await denied("original stock report denied", () =>
  getDoc(doc(db, "private", "openingStockReport")),
);
await denied("invoice listing denied", () => getDocs(collection(db, "bills")));
await denied("customer enquiry listing denied", () =>
  getDocs(collection(db, "enquiries")),
);
await denied("unfiltered inventory listing denied", () =>
  getDocs(collection(db, "products")),
);
await denied("anonymous product write denied", () =>
  setDoc(doc(db, "products", "forbidden-test"), { name: "Invalid test" }),
);
await denied("incomplete enquiry write denied", () =>
  setDoc(doc(db, "enquiries", "forbidden-test"), { name: "Invalid test" }),
);
await denied("role self-assignment denied", () =>
  setDoc(doc(db, "users", "forbidden-test"), { admin: true }),
);
await deleteApp(app);
console.log(
  `${passed} live public-access checks passed; no documents created.`,
);
