"use client";
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";
import { firebaseConfig, adminEmail } from "./firebase-config";
export function clientAuth() {
  return getAuth(
    getApps().find((a) => a.name === "raam-browser") ||
      initializeApp(firebaseConfig, "raam-browser"),
  );
}
export async function authFetch(url: string, options: RequestInit = {}) {
  const auth = clientAuth();
  await auth.authStateReady();
  const headers = new Headers(options.headers);
  if (auth.currentUser)
    headers.set(
      "Authorization",
      `Bearer ${await auth.currentUser.getIdToken()}`,
    );
  return fetch(url, { ...options, headers });
}
export async function signInAdmin(email: string, password?: string) {
  const auth = clientAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = password
    ? await signInWithEmailAndPassword(auth, email, password)
    : await signInWithPopup(auth, provider);
  if (!result.user.email) {
    await signOut(auth);
    throw new Error("Use an email-based store account.");
  }
  return result.user.getIdToken();
}
export async function signOutAdmin() {
  await signOut(clientAuth());
}
export async function resetAdminPassword(email = adminEmail) {
  await sendPasswordResetEmail(clientAuth(), email.trim());
}

export async function changeAdminPassword(
  currentPassword: string,
  nextPassword: string,
) {
  const auth = clientAuth();
  const user = auth.currentUser;
  if (!user || !user.email)
    throw new Error("Sign in with the business administrator account first.");
  if (nextPassword.length < 8)
    throw new Error("Use at least 8 characters for your new password.");
  await reauthenticateWithCredential(
    user,
    EmailAuthProvider.credential(user.email, currentPassword),
  );
  await updatePassword(user, nextPassword);
  const idToken = await user.getIdToken(true);
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    await signOut(auth);
    window.location.assign("/admin");
  }
}

// A separate, in-memory Auth instance avoids signing the administrator out.
export async function createTeamLogin(email: string, password: string) {
  const app =
    getApps().find((a) => a.name === "raam-team-provision") ||
    initializeApp(firebaseConfig, "raam-team-provision");
  const auth = getAuth(app);
  await setPersistence(auth, inMemoryPersistence);
  try {
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/email-already-in-use")
        throw error;
      credential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
    }
    return await credential.user.getIdToken();
  } finally {
    await signOut(auth);
  }
}
