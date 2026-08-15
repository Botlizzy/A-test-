import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
let revision = process.env.VITE_BUILD_REVISION || "development";

try {
  revision = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { cwd: projectRoot, encoding: "utf8" }).trim() || revision;
} catch {
  // Deploy environments without .git use the explicitly injected build revision or development.
}

const output = resolve(projectRoot, "client/src/generated/buildRevision.ts");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `export const BUILD_REVISION = ${JSON.stringify(revision)} as const;\n`, "utf8");
console.log(`[build-revision] ${revision}`);
