#!/usr/bin/env node

import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const root = process.cwd();
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error(".env.example is missing; cannot create local env file.");
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  console.log("Created .env from .env.example.");
} else {
  console.log(".env already exists; leaving it unchanged.");
}

if (!existsSync(resolve(root, "node_modules"))) {
  console.warn("node_modules is missing. Run npm install before npm run setup:local.");
}

run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "db", "push"]);

if (!args.skipSeed) {
  run("npm", ["run", "db:seed"]);
} else {
  console.log("Skipping seed by request.");
}

run("npm", ["run", "preflight"]);

console.log("\nLocal setup complete.");
console.log("Start the app with: npm run dev");
console.log("Then verify with: npm run health");

function run(command, commandArgs) {
  console.log(`\n> ${command} ${commandArgs.join(" ")}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
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
  console.log(`Prepare Kairos for local development.

Usage:
  npm run setup:local
  npm run setup:local -- --skip-seed

What it does:
  1. Creates .env from .env.example if .env is missing.
  2. Leaves existing .env files unchanged.
  3. Runs Prisma generate.
  4. Runs Prisma db push.
  5. Seeds demo data unless --skip-seed is set.
  6. Runs local preflight.
`);
}
