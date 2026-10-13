import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, LogOut, RefreshCw, Search } from "lucide-react";

/**
 * /admin — password-protected list of Career Guidance registrations.
 * The token from /api/admin/login is kept in sessionStorage (cleared when the tab closes).
 */

const TOKEN_KEY = "cg_admin_token";
const PAGE_SIZE = 50;
const CLASS_OPTIONS = ["Class 10", "Class 11", "Class 12"];
const LANGUAGE_OPTIONS = ["English", "Tamil", "Hindi"];

const readToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
};
const writeToken = (t) => {
  try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed.");
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="cg-card w-full max-w-sm p-8 shadow-[0_30px_60px_-35px_rgba(19,41,75,.45)]">
        <img src="/fs-assets/logo.webp" alt="FOCAS Edu" className="h-8 w-auto" />
        <h1 className="cg-display mt-6 text-3xl font-semibold">Leads admin</h1>
        <p className="mt-1 text-slate-600">Career Guidance Meet registrations</p>
        <label htmlFor="admin-password" className="mt-6 block text-sm font-semibold text-[#13294b]">Password</label>
        <input
          id="admin-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[#d5dbe3] px-3 py-2.5 outline-none focus:border-[#13294b]"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !password} className="cg-btn mt-6 w-full !py-3 !text-base disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
        </button>
      </form>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="cg-card px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="cg-display mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Leads({ token, onLogout }) {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [language, setLanguage] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce the search box so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams({ q: search, studentClass, language });

  const authFetch = useCallback(async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { onLogout(); throw new Error("Session expired."); }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed.");
    return res;
  }, [token, onLogout]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ q: search, studentClass, language, page, limit: PAGE_SIZE });
      const res = await authFetch(`/api/admin/leads?${qs}`);
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, search, studentClass, language, page]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    try {
      const res = await authFetch(`/api/admin/leads.csv?${params}`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `career-guidance-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const filtered = search || studentClass || language;
  const selectCls = "rounded-lg border border-[#d5dbe3] bg-white px-3 py-2 text-sm outline-none focus:border-[#13294b]";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src="/fs-assets/logo.webp" alt="FOCAS Edu" className="h-8 w-auto" />
          <h1 className="cg-display text-2xl font-semibold">Career Guidance leads</h1>
        </div>
        <button onClick={onLogout} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#13294b]">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <Stat label="Total registrations" value={data?.overall ?? "–"} />
        <Stat label={filtered ? "Matching filters" : "Showing"} value={data?.total ?? "–"} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, city…"
            className="w-full rounded-lg border border-[#d5dbe3] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#13294b]"
          />
        </div>
        <select value={studentClass} onChange={(e) => { setStudentClass(e.target.value); setPage(1); }} className={selectCls} aria-label="Class">
          <option value="">All classes</option>
          {CLASS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} className={selectCls} aria-label="Language">
          <option value="">All languages</option>
          {LANGUAGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d5dbe3] bg-white px-3 py-2 text-sm font-semibold text-[#13294b] hover:bg-[#f3eee3]">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg bg-[#13294b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0c1d38]">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="cg-card mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[#e7e2d8] bg-[#fbfaf7] text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {["Registered", "Student", "Parent", "WhatsApp", "Class", "Location", "Language", "Source"].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efebe3]">
            {data?.items.map((l) => (
              <tr key={l._id} className="hover:bg-[#fbfaf7]">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(l.createdAt)}
                  {l.submissions > 1 && (
                    <span title={`Submitted ${l.submissions} times; last ${formatDate(l.updatedAt)}`} className="ml-2 rounded bg-[#f3eee3] px-1.5 py-0.5 text-xs font-semibold text-[#a87b2a]">
                      ×{l.submissions}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-[#13294b]">{l.studentName}</td>
                <td className="px-4 py-3">{l.parentName}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#13294b] underline decoration-[#a87b2a]/50 underline-offset-2 hover:decoration-[#a87b2a]">
                    {l.phone}
                  </a>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{l.studentClass}</td>
                <td className="px-4 py-3">{l.city}, {l.state}</td>
                <td className="px-4 py-3">{l.language}</td>
                <td className="px-4 py-3 text-slate-600">
                  {l.utm?.utmSource || "direct"}
                  {l.utm?.utmCampaign && <span className="block text-xs text-slate-400">{l.utm.utmCampaign}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.items.length === 0 && (
          <p className="px-4 py-12 text-center text-slate-500">{filtered ? "No leads match these filters." : "No registrations yet."}</p>
        )}
        {!data && loading && (
          <p className="flex justify-center px-4 py-12 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></p>
        )}
      </div>

      {data && pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <span className="text-slate-600">Page {page} of {pages}</span>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page" className="rounded-lg border border-[#d5dbe3] bg-white p-2 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page" className="rounded-lg border border-[#d5dbe3] bg-white p-2 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(readToken);

  useEffect(() => {
    document.title = "Leads admin | Career Guidance Meet";
  }, []);

  const login = (t) => { writeToken(t); setToken(t); };
  const logout = useCallback(() => { writeToken(""); setToken(""); }, []);

  return (
    <div className="cg-root min-h-screen bg-[#fbfaf7]">
      {token ? <Leads token={token} onLogout={logout} /> : <Login onLogin={login} />}
    </div>
  );
}
