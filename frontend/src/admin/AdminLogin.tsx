import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@skybook.test");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      if (data.user?.role !== "ADMIN") throw new Error("This account is not an administrator.");
      localStorage.setItem("skybook_token", data.token);
      localStorage.setItem("skybook_user", JSON.stringify(data.user));
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sky-admin-login">
      <style>{`
        .sky-admin-login{min-height:100vh;display:grid;place-items:center;background:#f5f7fb;padding:24px;font-family:Inter,system-ui,sans-serif}
        .sky-login-card{width:min(430px,100%);background:#fff;border:1px solid #e5e9f0;border-radius:18px;padding:32px;box-shadow:0 18px 55px #17203314}
        .sky-logo{font-size:22px;font-weight:850;color:#1264e8}.sky-login-card h1{margin:22px 0 7px;font-size:28px}.sky-login-card p{color:#758096;margin-top:0}
        .sky-login-card label{display:block;font-size:13px;font-weight:650;margin:18px 0 7px}.sky-login-card input{width:100%;padding:12px 13px;border:1px solid #d9dee8;border-radius:9px;outline:none}
        .sky-login-card input:focus{border-color:#1264e8;box-shadow:0 0 0 3px #1264e818}.sky-login-card button{width:100%;margin-top:22px;padding:13px;border:0;border-radius:9px;background:#1264e8;color:#fff;font-weight:750;cursor:pointer}
        .sky-login-error{background:#fff1f2;color:#b4232e;padding:11px;border-radius:8px;margin-top:16px;font-size:14px}
      `}</style>
      <form className="sky-login-card" onSubmit={submit}>
        <div className="sky-logo">✈ SKYBOOK</div>
        <h1>Admin login</h1>
        <p>Sign in to manage flights and bookings.</p>
        {error && <div className="sky-login-error">{error}</div>}
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
