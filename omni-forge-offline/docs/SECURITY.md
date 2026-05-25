# Security Model

**Honest disclaimer first.** No JavaScript-based plugin is uncrackable. Animation Composer, Red Giant, even Adobe's own subscriptions get cracked. What this system does is make casual piracy **not worth the effort** and protect you from accidental key sharing — which covers >95% of real-world piracy.

If you ever see a cracked Omni Forge online, that's a *signal* you have product-market fit, not a failure of the security system. Adjust pricing, ship updates, double down.

---

## How offline activation is protected

- **Embedded SHA-256 hash list.** The plugin contains hashes of every valid key, not the keys themselves. Pirates can't generate new keys without breaking SHA-256 (impossible).
- **HMAC-signed activation token.** After activation, the local file at `~/.omni-forge/license.dat` is signed with a key derived from the device fingerprint. Editing it invalidates the signature. Copying it to another machine fails verification.
- **Device fingerprint.** Combined hash of hostname + OS + CPU model + total RAM + first MAC address.

## What this does NOT protect against (be honest)

| Attack | Why it works | Mitigation |
|---|---|---|
| Replace `license.js` with a stub that always returns OK | The plugin is plain JS in a folder | **Obfuscate + minify** before shipping (see hardening below) |
| Replace `keyhashes.js` with hash of attacker's own key | Same as above | Same — obfuscation + integrity check |
| Reverse the `.zxp`, repack with patches | `.zxp` is a renamed ZIP | **Code-sign your `.zxp`** with a paid certificate (Sectigo, ~$50/yr) |
| Share a single legit key with friends | No server to track | **License terms + ship updates that revoke leaked keys** |

---

## Cross-device enforcement: the trade-off

Pure-offline plugins **cannot** enforce "max 3 devices per key" — each machine is isolated and has no way to know how many others use the same key.

Two options:

1. **Trust + terms (current default).** Ship offline, state in your terms "for personal use on up to 3 devices." This is what Sketch, Affinity, JetBrains pre-2019, and most pre-cloud commercial tools did. 95% of buyers respect it.

2. **Online verification (alternative).** Restore the Cloudflare Worker code from commit `b4a7734` if you decide later that you want real device enforcement. Free tier covers your scale. Trade-off: customers need internet at activation + every 14 days.

---

## Hardening checklist before public release

**Required (do these):**
- [ ] Run `client/js/*.js` through [Terser](https://terser.org/) with `mangle: { toplevel: true }`
- [ ] Run the result through [JavaScript Obfuscator](https://obfuscator.io/) with `stringArray: true, controlFlowFlattening: true`. (Don't go max — it slows the panel.)
- [ ] Sign your `.zxp` with a real code-signing cert. ~$50/year from Sectigo or DigiCert.

**Optional (worth it for higher-priced products):**
- [ ] Add an HMAC checksum of every shipped `.jsx`, verified by the host on load. Tampered files refuse to dispatch.
- [ ] Add a "honeypot" function never legitimately called but referenced in obfuscated form. If a cracker removes the license check, the honeypot triggers and corrupts AE undo state harmlessly. (Black-box deterrent — most crackers won't notice until they've shipped a broken crack.)
- [ ] Watermark each license: `Vault > Save` writes a tiny invisible signature in saved presets. Lets you trace which key leaked a presets pack.

---

## Practical guidance

- **Price tier matters more than DRM.** A $29 plugin with strong DRM gets cracked the same week as one with weak DRM. Charge $49–99, offer a free trial, and you'll capture more revenue than chasing pirates.
- **Free trial > demo restrictions.** Time-limit the full version (e.g. 14 days) — same flow as licensed, just check `activatedAt` against now in `validate()`. Far higher conversion than feature-gated demos.
- **Each version bump (v1.1, v1.2) ships a new bundle ID and resets cracker effort.** Crackers work on the latest version; legitimate customers get steady value.

---

## Revoking a leaked key

You can't remotely revoke offline. But you can:

1. Delete the leaked line from `keys/keys.txt`
2. Regenerate `client/js/keyhashes.js`
3. Bump version to `v1.0.1` and ship the update to paying customers
4. The leaked key stops working as soon as anyone installs the update

(See `docs/LICENSING.md` for the full revoke workflow.)
