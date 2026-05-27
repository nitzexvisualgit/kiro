# License System Setup (Vendor Side)

This is the one-time setup you (Nitin) do to be able to sell licenses. Time required: ~15 minutes.

## Overview

```
Buyer pays  →  You email them a key from keys.txt  →
They paste it into Omni Forge  →  Panel calls your Cloudflare Worker  →
Worker checks the key in Cloudflare KV  →  Returns OK + token  →
Panel saves token locally, validates online every 14 days
```

- **Server cost:** $0 (Cloudflare free tier handles 100k requests/day)
- **Storage cost:** $0 (KV free tier handles your 100 keys easily)
- **Maintenance:** none

---

## Step 1 — Generate your 100 keys

```bash
cd omni-forge
node scripts/generate-keys.js 100
```

This creates:
- `keys/keys.txt`           — 100 keys, one per line. **This is what you email buyers.**
- `keys/keys-kv-bulk.json`  — bulk import file for Cloudflare KV.

Keep `keys.txt` private. Each key looks like `OMNI-A4K7-PQ2X-9JFM-YZ3B`.

---

## Step 2 — Deploy the Cloudflare Worker

1. Sign up at [cloudflare.com](https://cloudflare.com) (free).
2. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. Create the KV namespace:
   ```bash
   cd omni-forge/server
   wrangler kv:namespace create LICENSES
   ```
   Copy the returned `id` and paste it into `wrangler.toml` where it says `REPLACE_WITH_KV_NAMESPACE_ID`.
4. Bulk-load your keys:
   ```bash
   wrangler kv:bulk put --binding=LICENSES ../keys/keys-kv-bulk.json
   ```
5. Deploy:
   ```bash
   wrangler deploy
   ```
   Wrangler prints a URL like `https://omni-forge-license.YOUR-NAME.workers.dev`. **Copy this URL.**

---

## Step 3 — Wire the Worker URL into the client

Open `client/js/license.js` and replace the placeholder:
```js
var LICENSE_API = "https://omni-forge-license.YOUR-WORKER.workers.dev";
```
with your actual deployed URL. Save. Re-package the extension.

---

## Step 4 — Selling

When a customer pays:
1. Open `keys/keys.txt`
2. Cut a key from the top of the file
3. Email it to them along with the install link
4. Paste it back at the bottom under a comment like `# SOLD - John Doe - 2026-05-24`

When they activate, the Worker locks that key to their device fingerprint. They can install on up to **3 devices total**. Re-installing on the *same* device doesn't count.

---

## Managing licenses (admin tasks)

### Revoke a key (refunds, abuse)
```bash
wrangler kv:key put --binding=LICENSES "key:OMNI-XXXX-XXXX-XXXX-XXXX" '{"active":false}'
```
Next online check, the panel locks itself.

### Reset device list (customer needs a 4th install)
```bash
wrangler kv:key put --binding=LICENSES "key:OMNI-XXXX-XXXX-XXXX-XXXX" '{"active":true,"devices":[],"maxDevices":3}'
```

### Generate more keys later
```bash
node scripts/generate-keys.js 50
wrangler kv:bulk put --binding=LICENSES keys/keys-kv-bulk.json
```

---

## Troubleshooting

**Customer says "Network error":** Worker URL wrong, or their firewall blocks `*.workers.dev`. Have them whitelist.
**Customer says "Device limit reached":** They've used the key on 3 devices. Tell them to deactivate from one device (Studio tab → Deactivate) or you can reset their device list.
**Customer says "License signature invalid":** They moved their `~/.omni-forge/license.dat` between machines, or modified it. Tell them to re-activate.
