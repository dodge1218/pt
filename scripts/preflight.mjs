import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const file of [".env", ".env.local"]) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) continue;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const production = process.env.NODE_ENV === "production" || process.argv.includes("--production");

const required = [
  "DATABASE_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
];

const secretCandidates = ["AUTH_SECRET", "NEXTAUTH_SECRET"];
const urlCandidates = ["AUTH_URL", "NEXTAUTH_URL"];

const optional = [
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "KAIROS_CRON_SECRET",
];

const placeholderValues = new Set([
  "",
  "change-me",
  "dev-secret-change-in-production",
  "dev-secret-not-for-production-use-change-me",
  "ci-secret-not-for-production",
  "...",
]);

function read(name) {
  return process.env[name]?.trim() || "";
}

function hasRealValue(name) {
  return !placeholderValues.has(read(name));
}

const failures = [];
const warnings = [];

for (const name of required) {
  if (!hasRealValue(name)) failures.push(`${name} is missing or placeholder`);
}

if (!secretCandidates.some(hasRealValue)) {
  failures.push("AUTH_SECRET or NEXTAUTH_SECRET is required");
}

if (!urlCandidates.some(hasRealValue)) {
  failures.push("AUTH_URL or NEXTAUTH_URL is required");
}

for (const name of optional) {
  if (!hasRealValue(name)) warnings.push(`${name} is not configured`);
}

if (production && read("DATABASE_URL").startsWith("file:")) {
  failures.push("DATABASE_URL must point at Postgres/Supabase in production, not SQLite");
}

if (production && (read("AUTH_URL") || read("NEXTAUTH_URL")).includes("localhost")) {
  failures.push("AUTH_URL/NEXTAUTH_URL must not point at localhost in production");
}

if (production && read("ENABLE_DEMO_AUTH") === "true") {
  failures.push("ENABLE_DEMO_AUTH must be disabled in production");
}

if (failures.length > 0) {
  const prefix = production ? "Preflight failed" : "Preflight warnings";
  console.warn(`${prefix}:\n- ${failures.join("\n- ")}`);
  if (production) process.exit(1);
}

if (warnings.length > 0) {
  console.warn(`Optional env not configured:\n- ${warnings.join("\n- ")}`);
}

console.log("Preflight complete.");
