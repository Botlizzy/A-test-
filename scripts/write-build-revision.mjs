import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
let revision = process.env.GITHUB_SHA?.slice(0, 7) || process.env.VITE_BUILD_REVISION || "development";

try {
  const remoteHead = execFileSync("git", ["ls-remote", "https://github.com/Botlizzy/A-test-.git", "refs/heads/main"], { cwd: projectRoot, encoding: "utf8", timeout: 8000 }).trim().split(/\s+/)[0];
  revision = remoteHead?.slice(0, 7) || revision;
} catch {
  try {
    revision = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { cwd: projectRoot, encoding: "utf8" }).trim() || revision;
  } catch {
    // Deploy environments without network or .git use injected revision metadata or development.
  }
}

const output = resolve(projectRoot, "client/src/generated/buildRevision.ts");
if (revision === "development" && existsSync(output)) {
  const existing = readFileSync(output, "utf8").match(/BUILD_REVISION = "([^"]+)"/);
  revision = existing?.[1] || revision;
}
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `export const BUILD_REVISION = ${JSON.stringify(revision)} as const;\n`, "utf8");
console.log(`[build-revision] ${revision}`);
