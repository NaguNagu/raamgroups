"use client";
import { useEffect, useState } from "react";
import { authFetch, createTeamLogin } from "@/lib/firebase-client";
import type { TeamMember } from "@/lib/access";
export function TeamSettings({ demo }: { demo: boolean }) {
  const [members, setMembers] = useState<TeamMember[]>([]),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    const r = await authFetch("/api/team");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setMembers(d.members);
    setEmail(d.email);
  }
  useEffect(() => {
    if (!demo) void load().catch((e) => setError(e.message));
  }, [demo]);
  return (
    <section className="panel settings-form" style={{ padding: 24 }}>
      <h2>Team members</h2>
      <p>
        Every active member has the same access to inventory, billing,
        purchases, reports, settings and team management.
      </p>
      {demo ? (
        <p className="muted small">
          Create team logins in the live workspace. Demo mode never creates
          accounts.
        </p>
      ) : (
        <>
          <form
            className="form-stack"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const values = new FormData(form);
              const password = String(values.get("password"));
              if (password !== values.get("confirm")) {
                setError("Passwords do not match.");
                return;
              }
              setBusy(true);
              setError("");
              setNotice("");
              try {
                const memberToken = await createTeamLogin(
                  String(values.get("email")),
                  password,
                );
                const r = await authFetch("/api/team", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: values.get("name"),
                    memberToken,
                  }),
                });
                const d = await r.json();
                if (!r.ok) throw new Error(d.error);
                form.reset();
                await load();
                setNotice(
                  "Team login created. Share the email and password privately. They can change their password in Settings.",
                );
              } catch (e) {
                const code = (e as { code?: string }).code;
                setError(
                  code === "auth/invalid-credential"
                    ? "This email already has a Firebase account. Enter its current password to grant access."
                    : code === "auth/weak-password"
                      ? "Use a stronger password with at least 8 characters."
                      : e instanceof Error
                        ? e.message
                        : "Unable to create team member. Retry with the same credentials if account creation succeeded.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="form-grid">
              <label>
                Member name
                <input name="name" required maxLength={100} disabled={busy} />
              </label>
              <label>
                Login email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="off"
                  disabled={busy}
                />
              </label>
              <label>
                Initial password
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  maxLength={256}
                  autoComplete="new-password"
                  disabled={busy}
                />
              </label>
              <label>
                Confirm password
                <input
                  type="password"
                  name="confirm"
                  required
                  minLength={8}
                  maxLength={256}
                  autoComplete="new-password"
                  disabled={busy}
                />
              </label>
            </div>
            <button className="btn primary" disabled={busy}>
              {busy ? "Creating login…" : "Create team member"}
            </button>
          </form>
          {members.length ? (
            <div className="form-stack" style={{ marginTop: 24 }}>
              {members.map((member) => (
                <div className="panel" key={member.uid}>
                  <strong>{member.name}</strong>
                  <p>
                    {member.email} · {member.active ? "Active" : "Inactive"}
                  </p>
                  <button
                    className="btn outline"
                    disabled={
                      busy || member.email.toLowerCase() === email.toLowerCase()
                    }
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        const r = await authFetch("/api/team", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            uid: member.uid,
                            active: !member.active,
                          }),
                        });
                        const d = await r.json();
                        if (!r.ok) throw new Error(d.error);
                        await load();
                        setNotice(
                          member.active
                            ? "Member access deactivated."
                            : "Member access activated.",
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {member.active ? "Deactivate access" : "Activate access"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="small muted">
              No additional team members yet. The primary administrator login
              stays active.
            </p>
          )}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
