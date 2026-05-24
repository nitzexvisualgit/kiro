#!/usr/bin/env node
/**
 * Build a distribution ZIP that's ready to be signed into a .zxp
 * (or distributed as-is for the bat/sh installer flow).
 *
 * Usage: node scripts/build-zxp.js
 * Output: dist/omni-forge-1.0.0.zip
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const VERSION = require(path.join(ROOT, "package.json")).version;
const OUT_DIR = path.join(ROOT, "dist");
const ZIP_NAME = `omni-forge-${VERSION}.zip`;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, ZIP_NAME);
if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

// Files to exclude from distribution
const EXCLUDES = [
  "dist/*", "node_modules/*", ".git/*", ".github/*",
  "keys/*", "server/*", "scripts/*", "docs/*",
  ".debug", "*.log"
];

const cmd = process.platform === "win32"
  ? `powershell -Command "Compress-Archive -Path * -DestinationPath '${outPath}' -Force"`
  : `cd "${ROOT}" && zip -r "${outPath}" . ${EXCLUDES.map(e => `-x "${e}"`).join(" ")}`;

console.log(`Building ${ZIP_NAME}...`);
try {
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
  console.log(`✓ ${outPath}`);
  console.log(`To produce a signed .zxp, run:`);
  console.log(`  ZXPSignCmd -sign <unzipped-folder> ${outPath.replace(".zip", ".zxp")} <cert.p12> <password>`);
} catch (e) {
  console.error("Build failed:", e.message);
  process.exit(1);
}
