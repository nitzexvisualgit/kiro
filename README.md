# Omni Forge by Nitzex Visual

Two separate, fully-working versions of the same After Effects plugin. Pick the one that fits how you want to license it.

---

## 📦 Pick your version

### 🟢 [`omni-forge-offline/`](omni-forge-offline/) ← **RECOMMENDED**

**100% offline. No server. No internet ever required.**

- Works the moment a customer installs it — no setup needed on your side beyond generating keys.
- Activation just hashes the license key and checks an embedded list inside the plugin.
- "Max 3 devices per key" rule lives in your **license terms** (not technically enforced — same model as Sketch, Affinity, JetBrains pre-2019).

**Use this if:** you want simplicity, no monthly server worry, and trust your buyers (or accept that 5% won't follow license terms).

👉 **Install instructions:** [`omni-forge-offline/README.md`](omni-forge-offline/README.md)

---

### 🔵 [`omni-forge-online/`](omni-forge-online/) — advanced option

**Online activation via your own free Cloudflare Worker.**

- Activation calls a tiny server you control — server checks the key + tracks devices.
- **Real 3-device-per-key limit** enforced server-side (4th device gets blocked).
- Keys can be remotely revoked instantly if leaked.
- Customers need internet at activation + every 14 days for re-validation.

**Use this if:** you want hard cross-device enforcement and don't mind a 15-minute one-time Cloudflare setup.

> ⚠️ **Will NOT work out of the box.** You must deploy the included Cloudflare Worker first and update the URL inside the plugin. See [`omni-forge-online/docs/LICENSE-SETUP.md`](omni-forge-online/docs/LICENSE-SETUP.md).

---

## ⚠️ Don't install both at the same time

Both versions use the same Adobe extension bundle ID (`com.nitzexvisual.omniforge`), so installing one will replace the other. That's intentional — you should pick one model and stick with it.

If you want to switch later, run the uninstaller for the current version, then run the installer for the other.

---

## 👤 Author

**Nitin Shankhwar** — Motion designer, video editor, founder of Nitzex Visual.

- Instagram: [@nitzexvisual](https://www.instagram.com/nitzexvisual)
- YouTube: [@nitzex_visual](https://www.youtube.com/nitzex_visual)
- LinkedIn: [Nitin Shankhwar](https://www.linkedin.com/in/nitinshankhwar/)
- PayPal: nitzexbusiness@gmail.com

© 2026 Nitin Shankhwar / Nitzex Visual · All rights reserved.
