// Career Guidance registration API (Express app, no listener).
// Used by server/index.js locally and by api/index.js on Vercel.
// - POST /api/register          public: validates a registration and stores it in MongoDB
// - POST /api/admin/login       exchanges ADMIN_PASSWORD for a signed token (12 h)
// - GET  /api/admin/leads       token-protected: search + paginate registrations
// - GET  /api/admin/leads.csv   token-protected: CSV export (same filters)

import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import { MongoClient } from "mongodb";
import { STATE_CITIES } from "../src/indiaStatesCities.js";

const {
  MONGODB_URI,
  MONGODB_DB = "focas",
  MONGODB_COLLECTION = "career_guidance_leads",
  ADMIN_PASSWORD,
  ADMIN_TOKEN_SECRET,
} = process.env;

for (const [key, value] of Object.entries({ MONGODB_URI, ADMIN_PASSWORD, ADMIN_TOKEN_SECRET })) {
  if (!value) {
    console.error(`Missing ${key} — copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

// Must match CLASS_OPTIONS / LANGUAGE_OPTIONS / DIAL_CODES in the frontend.
const CLASS_OPTIONS = ["Class 10", "Class 11", "Class 12"];
const LANGUAGE_OPTIONS = ["English", "Tamil", "Hindi"];
const DIAL_CODES = ["+91", "+1", "+44", "+61", "+971", "+65", "+60", "+64"];
const UTM_KEYS = ["utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm", "landingUrl", "referrer"];

const client = new MongoClient(MONGODB_URI);
const leads = client.db(MONGODB_DB).collection(MONGODB_COLLECTION);

// Connect once per process (or per warm serverless instance); retry on the next request if it fails.
let ready;
function connect() {
  ready ??= (async () => {
    await client.connect();
    // One document per WhatsApp number: a repeat registration updates it instead of duplicating.
    await leads.createIndex({ phone: 1 }, { unique: true });
    await leads.createIndex({ createdAt: -1 });
    console.log(`Connected to MongoDB (${MONGODB_DB}.${MONGODB_COLLECTION})`);
  })().catch((err) => {
    ready = undefined;
    throw err;
  });
  return ready;
}

const app = express();
app.set("trust proxy", true); // behind a proxy (Vercel/Coolify): req.ip is the real client
app.use(express.json({ limit: "20kb" }));
app.use("/api", async (_req, res, next) => {
  try {
    await connect();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(503).json({ error: "Service unavailable. Please try again." });
  }
});

// ─── Public: registration ───────────────────────────────────────────────────

// Small in-memory rate limit: 10 registrations per IP per 10 minutes.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [ip, times] of hits) if (times.every((t) => t < cutoff)) hits.delete(ip);
}, 10 * 60 * 1000).unref();

const str = (v, max) => String(v ?? "").trim().slice(0, max);

function validateRegistration(body) {
  const v = {
    studentName: str(body.studentName, 40),
    parentName: str(body.parentName, 80),
    dialCode: str(body.dialCode, 5),
    phone: str(body.phone, 10),
    studentClass: str(body.studentClass, 20),
    state: str(body.state, 60),
    city: str(body.city, 60),
    language: str(body.language, 20),
  };
  const errors = {};
  if (!v.studentName) errors.studentName = "This field is required.";
  else if (/\d/.test(v.studentName)) errors.studentName = "Only letters are allowed.";
  if (!v.parentName) errors.parentName = "This field is required.";
  else if (/\d/.test(v.parentName)) errors.parentName = "Only letters are allowed.";
  if (!DIAL_CODES.includes(v.dialCode)) errors.phone = "Choose a valid country code.";
  else if (!/^[0-9]{10}$/.test(v.phone)) errors.phone = "Enter a valid 10-digit phone number.";
  if (!CLASS_OPTIONS.includes(v.studentClass)) errors.studentClass = "This field is required.";
  if (!STATE_CITIES[v.state]) errors.state = "This field is required.";
  else if (!STATE_CITIES[v.state].includes(v.city)) errors.city = "This field is required.";
  if (!LANGUAGE_OPTIONS.includes(v.language)) errors.language = "This field is required.";
  return { v, errors };
}

app.post("/api/register", async (req, res) => {
  const body = req.body || {};
  if (body.company) return res.json({ ok: true }); // honeypot: pretend success for bots
  if (rateLimited(req.ip)) return res.status(429).json({ error: "Too many attempts. Please try again in a few minutes." });

  const { v, errors } = validateRegistration(body);
  if (Object.keys(errors).length) return res.status(400).json({ error: "Please correct the highlighted fields.", errors });

  const utm = {};
  for (const key of UTM_KEYS) utm[key] = str(body.utm?.[key], 500);

  const now = new Date();
  const phone = `${v.dialCode}${v.phone}`;
  try {
    await leads.updateOne(
      { phone },
      {
        $set: {
          studentName: v.studentName,
          parentName: v.parentName,
          phone,
          studentClass: v.studentClass,
          state: v.state,
          city: v.city,
          language: v.language,
          ip: req.ip,
          userAgent: str(req.get("user-agent"), 300),
          updatedAt: now,
        },
        // First-touch attribution: a repeat registration keeps the original UTMs.
        $setOnInsert: { createdAt: now, utm },
        $inc: { submissions: 1 },
      },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Register failed:", err);
    res.status(500).json({ error: "Could not save your registration. Please try again." });
  }
});

// ─── Admin auth: stateless HMAC token ───────────────────────────────────────

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const sign = (payload) => crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(payload).digest("base64url");

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

app.post("/api/admin/login", (req, res) => {
  if (rateLimited(`login:${req.ip}`)) return res.status(429).json({ error: "Too many attempts. Try again later." });
  if (!safeEqual(String(req.body?.password ?? ""), ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "Wrong password." });
  }
  const exp = String(Date.now() + TOKEN_TTL_MS);
  res.json({ token: `${exp}.${sign(exp)}` });
});

function requireAdmin(req, res, next) {
  const token = (req.get("authorization") || "").replace(/^Bearer /, "");
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp)) || Number(exp) < Date.now()) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
  next();
}

// ─── Admin: list + export ───────────────────────────────────────────────────

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildFilter(query) {
  const filter = {};
  const q = str(query.q, 100);
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ studentName: re }, { parentName: re }, { phone: re }, { city: re }, { state: re }];
  }
  if (CLASS_OPTIONS.includes(query.studentClass)) filter.studentClass = query.studentClass;
  if (LANGUAGE_OPTIONS.includes(query.language)) filter.language = query.language;
  return filter;
}

app.get("/api/admin/leads", requireAdmin, async (req, res) => {
  const filter = buildFilter(req.query);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  try {
    const [items, total, overall] = await Promise.all([
      leads.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      leads.countDocuments(filter),
      leads.estimatedDocumentCount(),
    ]);
    res.json({ items, total, overall, page, limit });
  } catch (err) {
    console.error("List leads failed:", err);
    res.status(500).json({ error: "Could not load leads." });
  }
});

const CSV_COLUMNS = [
  ["Registered at (IST)", (l) => l.createdAt?.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
  ["Student name", (l) => l.studentName],
  ["Parent name", (l) => l.parentName],
  ["WhatsApp", (l) => l.phone],
  ["Class", (l) => l.studentClass],
  ["State", (l) => l.state],
  ["City", (l) => l.city],
  ["Language", (l) => l.language],
  ["Submissions", (l) => l.submissions],
  ["UTM source", (l) => l.utm?.utmSource],
  ["UTM medium", (l) => l.utm?.utmMedium],
  ["UTM campaign", (l) => l.utm?.utmCampaign],
  ["UTM content", (l) => l.utm?.utmContent],
];

// Quote every cell; prefix formula-like values so Excel doesn't execute them.
const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s) && !/^\+\d+$/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

app.get("/api/admin/leads.csv", requireAdmin, async (req, res) => {
  try {
    const items = await leads.find(buildFilter(req.query)).sort({ createdAt: -1 }).toArray();
    const lines = [CSV_COLUMNS.map(([h]) => csvCell(h)).join(",")];
    for (const l of items) lines.push(CSV_COLUMNS.map(([, get]) => csvCell(get(l))).join(","));
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", 'attachment; filename="career-guidance-leads.csv"');
    res.send("﻿" + lines.join("\r\n")); // BOM so Excel reads UTF-8
  } catch (err) {
    console.error("CSV export failed:", err);
    res.status(500).json({ error: "Could not export leads." });
  }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

export { connect };
export default app;
