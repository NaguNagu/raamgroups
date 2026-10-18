"use client";
import { useEffect } from "react";
import { authFetch, clientAuth, signOutAdmin } from "./firebase-client";
import { IDLE_TIMEOUT_MS } from "./access";
export type SessionInfo = {
  sessionKey: string;
  lastActive: number;
  email: string;
};
export function useAdminSession(session: SessionInfo | null) {
  useEffect(() => {
    if (!session) return;
    const key = `raam:activity:${session.sessionKey}`;
    let last = session.lastActive,
      sent = session.lastActive,
      ending = false,
      pending = false;
    try {
      const stored = Number(localStorage.getItem(key));
      if (stored > last && stored <= Date.now()) last = stored;
    } catch {}
    let timeout: ReturnType<typeof setTimeout>;
    const logout = async () => {
      if (ending) return;
      ending = true;
      clearTimeout(timeout);
      try {
        await authFetch("/api/auth", { method: "DELETE" });
      } catch {}
      try {
        await signOutAdmin();
      } finally {
        window.location.assign("/admin?reason=inactive");
      }
    };
    const check = () => {
      if (Date.now() - last >= IDLE_TIMEOUT_MS) {
        void logout();
        return false;
      }
      return true;
    };
    const arm = () => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () => {
          if (check()) arm();
        },
        Math.max(1, IDLE_TIMEOUT_MS - (Date.now() - last)),
      );
    };
    const activity = () => {
      if (ending || !check()) return;
      last = Date.now();
      try {
        localStorage.setItem(key, String(last));
      } catch {}
      arm();
    };
    const wake = () => {
      if (check()) arm();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        const next = Number(event.newValue);
        if (next > last && next <= Date.now()) {
          last = next;
          arm();
        }
      }
    };
    const heartbeat = setInterval(async () => {
      if (ending || pending || !check() || last <= sent) return;
      pending = true;
      const checkpoint = last;
      try {
        const auth = clientAuth();
        if (!auth.currentUser) {
          await logout();
          return;
        }
        const response = await authFetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "activity",
            idToken: await auth.currentUser.getIdToken(),
          }),
        });
        if (response.status === 401 || response.status === 403) {
          await logout();
          return;
        }
        if (response.ok) sent = checkpoint;
      } catch {
      } finally {
        pending = false;
      }
    }, 30000);
    const events = [
      "pointerdown",
      "keydown",
      "mousemove",
      "touchstart",
      "wheel",
    ] as const;
    let recorded = 0;
    const throttled = () => {
      if (Date.now() - recorded < 1000) return;
      recorded = Date.now();
      activity();
    };
    events.forEach((event) =>
      window.addEventListener(event, throttled, { passive: true }),
    );
    window.addEventListener("focus", wake);
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("storage", storage);
    if (check()) arm();
    return () => {
      ending = true;
      clearTimeout(timeout);
      clearInterval(heartbeat);
      events.forEach((event) => window.removeEventListener(event, throttled));
      window.removeEventListener("focus", wake);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("storage", storage);
    };
  }, [session]);
}
