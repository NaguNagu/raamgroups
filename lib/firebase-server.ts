import { initializeServerApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore/lite";
import { headers } from "next/headers";
import { firebaseConfig, firebaseConfigured } from "./firebase-config";
import { requestToken } from "./auth";
export async function firestore(authenticated = true, token?: string) {
  if (!firebaseConfigured())
    throw new Error("Firebase web configuration is missing.");
  const h = await headers();
  const app = initializeServerApp(firebaseConfig, {
    authIdToken: authenticated ? token || (await requestToken()) : undefined,
    releaseOnDeref: h,
  });
  await getAuth(app).authStateReady();
  return getFirestore(app);
}
