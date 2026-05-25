# Offline Licensing — Vendor Guide

Omni Forge runs **100% offline**. There is no server, no internet check, no Cloudflare anything. This guide is for you (Nitin) to understand how it works and how to manage keys.

---

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│  scripts/generate-keys.js   (run once on YOUR machine)      │
│                                                             │
│   ├─→ keys/keys.txt            (the list you sell from)     │
│   └─→ client/js/keyhashes.js   (SHA-256 of every key)       │
│                                                             │
│  The hash file gets BAKED INTO the plugin you ship.         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Customer installs Omni Forge                               │
│  Pastes their key  →  Plugin computes SHA-256(key)          │
│                       Looks it up in the embedded hash list │
│                       Match? Activate. No match? Reject.    │
│  Saves a signed token in ~/.omni-forge/license.dat          │
│  No network call, ever.                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Selling keys

1. Open `keys/keys.txt` (committed to your repo, 100 keys ready)
2. Take a key from the top, email it to the buyer
3. Mark it sold by editing the file, e.g.:
   ```
   # SOLD 2026-05-25 - John Doe - johndoe@gmail.com
   OMNI-A4K7-PQ2X-9JFM-YZ3B
   ```
4. Save the file (don't commit it publicly — keep buyer info private)

The buyer pastes the key into the activation screen. It works **immediately, offline, forever**. No re-validation. No expiry.

---

## Generating more keys

Need 50 more keys later? Run:

```bash
node scripts/generate-keys.js 150
```

> ⚠️ **This regenerates BOTH files**, including the hash list. Old keys you already sold **will stop working** in this rebuild because their hashes are gone from the new list. Always pass a count larger than you've sold so far, and only run this when you're ready to ship a new plugin version to all customers.

**Better practice for adding keys without breaking existing customers:**

1. Open `keys/keys.txt`, count existing keys
2. Edit `scripts/generate-keys.js` and change the script to *append* instead of overwrite (one-line change — uncomment the append mode at the top of the file when I add it in v1.1)
3. For now, just generate enough keys upfront (e.g. 500) and only distribute as you sell.

---

## What "max 3 devices" means in offline mode

**Honest disclosure:** without a server, the plugin cannot enforce a per-key device limit. Each machine is independent — it has no way to know if another machine has already used the same key.

So "3 devices" becomes a **license-terms policy**, not a technical lock:

- Add it to your sales page / terms-of-use: *"License is for personal use on up to 3 devices owned by the buyer."*
- This is exactly the model Sketch, Affinity, JetBrains (pre-cloud), and most pre-2018 commercial software used.
- 95% of buyers respect terms. The 5% who don't were never going to pay anyway.

If you ever need real cross-device enforcement, the online Cloudflare Worker option (now removed) is in git history at commit `b4a7734` — you can restore it as a future feature.

---

## What if a customer's key leaks publicly?

You can't remotely revoke an offline key. But you can:

1. **Ship a plugin update (v1.0.1)** with a new hash list that **excludes the leaked key**
2. Email all paying customers the update + their existing key (which is still in the new hash list)
3. The leaked key stops working as soon as users install the update

To exclude one key:
1. Open `keys/keys.txt`, delete the leaked line
2. Run `node scripts/generate-keys.js <count>` — but this regenerates **all** keys
3. **Better:** add the helper script `scripts/revoke-key.js` (I'll add this on request) that just rebuilds `keyhashes.js` from the existing `keys.txt` after you remove a line

---

## Distributing to buyers

Bundle **only these** for the customer:
- The whole `omni-forge/` folder MINUS:
  - `keys/` (your private file, never ship!)
  - `server/` (now empty, can delete)
  - `scripts/` (your dev tools)
  - `docs/LICENSING.md`, `docs/DEV.md` (internal)
- Keep `installers/`, `docs/INSTALL.md`, `docs/SECURITY.md`, `README.md`

The `scripts/build-zxp.js` already excludes `keys/` and `server/` automatically.
