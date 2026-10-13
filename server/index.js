// Career Guidance registration server for local dev and single-process hosting.
// Runs the API from app.js and, in production, serves the built site from dist/.
// On Vercel, api/index.js serves the API and Vercel serves dist/ directly.

import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import app, { connect } from "./app.js";

const { PORT = 7002 } = process.env;

await connect();

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
