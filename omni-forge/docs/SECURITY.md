# Security Model

**Honest disclaimer first.** No JavaScript-based plugin is uncrackable. Animation Composer, Red Giant, even Adobe's own subscriptions get cracked. What this system does is make casual piracy **not worth the effort** and protect you from accidental sharing — which covers >95% of real-world piracy.

If you ever see a cracked Omni Forge online, that's a *signal* you have product-market fit, not a failure of the security system. Adjust pricing, add features, double down.

---

## What's protected

- **Server-side device limit (3 max).** A pirated key still hits your Cloudflare Worker. Past 3 fingerprints, it stops activating. There's no offline-only bypass: first activation always requires the network.
- **HMAC-signed local token.** The activation file at `~/.omni-forge/license.dat` is signed with a key derived from the device fingerprint. Editing it invalidates the signature.
- **14-day online re-validation.** Even after activation, the panel checks back to your Worker every 14 days. Revoked keys stop working at the next check.
- **Device fingerprint.** Combined hash of hostname + OS + CPU model + total RAM + first MAC address. Resilient to most casual VM/sandbox spoofing.

## What's NOT protected (and how attackers might try)

| Attack | Mitigation |
|---|---|
| Replace `license.js` with a stub that always returns OK | Obfuscate + minify before shipping (see "Hardening" below). Add an HMAC checksum of the file, verified by the host `.jsx` |
| MITM the Worker URL with a fake server | Pin the Worker hostname; reject responses without a server signature (already partially done via fingerprint binding) |
| Patch the unpacked CEP folder | Same as above — minified + checksum |
| Reverse the `.zxp` and republish | Code-sign your `.zxp` with a paid certificate (Sectigo); only that CN can sign the bundle ID |

---

## Hardening checklist before public release

**Required (do these):**
- [ ] Replace `LICENSE_API` placeholder in `client/js/license.js` with your real Worker URL.
- [ ] Run `client/` through [Terser](https://terser.org/) with `mangle: { toplevel: true }` and `compress` settings.
- [ ] Run the resulting bundle through [JavaScript Obfuscator](https://obfuscator.io/) with `stringArray: true`, `controlFlowFlattening: true`. (Don't go max — it'll slow the panel.)
- [ ] Sign your `.zxp` with a real code-signing cert. Cost: ~$50/year.

**Optional (worth it for higher-priced products):**
- [ ] Add an HMAC of every `.jsx` file shipped, verified by the host on load. If anyone patches a `.jsx`, the host refuses to dispatch.
- [ ] Add a "honeypot" function that's never legitimately called but is referenced in obfuscated form. If a cracker removes the license check, the honeypot triggers and corrupts AE undo state harmlessly. (Black-box deterrent.)
- [ ] Watermark each license: `Vault > Save` writes a tiny invisible signature in saved presets. Lets you track which key leaked a presets pack.

---

## Practical guidance

- **Price tier matters more than DRM.** A $29 plugin with strong DRM gets cracked the same week a $29 plugin with weak DRM does. Charge $49–99 with a free trial; you'll capture more revenue than chasing pirates.
- **Free trial > demo restriction.** Time-limit a fully-working version (e.g. 14 days) — same flow as licensed, just `expiresAt` is short. Far higher conversion than feature-gated demos.
- **Keep selling.** Each version bump (v1.1, v1.2) ships with a new bundle ID and resets the cracking effort. Crackers go for the latest version's working features; legitimate users get a steady drip of value.

---

## What to do if a key gets shared publicly

```bash
wrangler kv:key put --binding=LICENSES "key:OMNI-XXXX-XXXX-XXXX-XXXX" '{"active":false}'
```
At the next 14-day re-validation, every device using that key locks. Email the original buyer a replacement key and a polite note about your terms.
