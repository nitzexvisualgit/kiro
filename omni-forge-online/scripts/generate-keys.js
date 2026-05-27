#!/usr/bin/env node
/**
 * Generate Omni Forge license keys.
 * Usage: node scripts/generate-keys.js [count=100]
 *
 * Outputs:
 *   keys/keys.txt           - human-readable list (one per line)
 *   keys/keys-kv-bulk.json  - import file for Cloudflare KV: `wrangler kv:bulk put LICENSES keys-kv-bulk.json`
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const COUNT = parseInt(process.argv[2] || "100", 10);
const OUT_DIR = path.join(__dirname, "..", "keys");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Avoid ambiguous chars I, O, 0, 1
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function block() {
  const buf = crypto.randomBytes(4);
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[buf[i] % ALPHABET.length];
  return s;
}
function makeKey() {
  return "OMNI-" + block() + "-" + block() + "-" + block() + "-" + block();
}

const keys = new Set();
while (keys.size < COUNT) keys.add(makeKey());

const list = [...keys];
fs.writeFileSync(path.join(OUT_DIR, "keys.txt"), list.join("\n") + "\n");

const kvBulk = list.map(k => ({
  key: "key:" + k,
  value: JSON.stringify({ active: true, devices: [], maxDevices: 3, createdAt: Date.now() })
}));
fs.writeFileSync(path.join(OUT_DIR, "keys-kv-bulk.json"), JSON.stringify(kvBulk, null, 2));

console.log(`Generated ${list.length} keys in ${OUT_DIR}/`);
console.log(`  keys.txt           - distribute these to buyers`);
console.log(`  keys-kv-bulk.json  - run: wrangler kv:bulk put --binding=LICENSES keys/keys-kv-bulk.json`);
