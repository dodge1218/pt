#!/usr/bin/env node

import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const root = process.cwd();
const envPath = resolve(root, ".env.postgres.local");
const examplePath = resolve(root, ".env.postgres.example");
const schemaPath = "prisma/schema.postgres.prisma";

if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error(".env.postgres.example is missing; cannot create .env.postgres.local.");
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  console.log("Created .env.postgres.local from .env.postgres.example.");
} else {
  console.log(".env.postgres.local already exists; leaving it unchanged.");
}

loadEnvFile(envPath);

if (!process.env.DATABASE_URL?.startsWith("postgresql://")) {
  console.error("DATABASE_URL must be a postgresql:// URL for setup:postgres.");
  process.exit(1);
}

if (!existsSync(resolve(root, "node_modules"))) {
  console.warn("node_modules is missing. Run npm install before npm run setup:postgres.");
}

run("npx", ["prisma", "generate", "--schema", schemaPath]);
run("npx", ["prisma", "db", "push", "--schema", schemaPath]);

if (!args.skipSeed) {
  run("npx", ["tsx", "prisma/seed.ts"]);
} else {
  console.log("Skipping seed by request.");
}

run("npm", ["run", "preflight"]);

console.log("\nPostgres local setup complete.");
console.log("Start the app with the Postgres env loaded, for example:");
console.log("  set -a; . ./.env.postgres.local; set +a; npm run dev");

function loadEnvFile(path) {
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

function run(command, commandArgs) {
  console.log(`\n> ${command} ${commandArgs.join(" ")}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--skip-seed") parsed.skipSeed = true;
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Prepare ProofTicket for local Postgres development.

Usage:
  npm run setup:postgres
  npm run setup:postgres -- --skip-seed

What it does:
  1. Creates .env.postgres.local from .env.postgres.example if missing.
  2. Loads .env.postgres.local for this command.
  3. Runs Prisma generate using prisma/schema.postgres.prisma.
  4. Runs Prisma db push against the configured Postgres database.
  5. Seeds demo data unless --skip-seed is set.

Start Postgres first with:
  docker compose up -d postgres
`);
}
