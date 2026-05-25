/**
 * Omni Forge License Worker - Cloudflare Workers + KV.
 *
 * Deploy:
 *   1. Install wrangler:    npm i -g wrangler
 *   2. Login:               wrangler login
 *   3. Create KV:           wrangler kv:namespace create LICENSES
 *   4. Bind in wrangler.toml under [[kv_namespaces]]
 *   5. Seed keys:           cat keys.json | wrangler kv:bulk put LICENSES
 *   6. Deploy:              wrangler deploy
 *
 * KV layout:
 *   key:OMNI-XXXX-XXXX-XXXX-XXXX  ->  { active:true, devices:[fp1,fp2], maxDevices:3 }
 *   tok:<token>                   ->  { key, fingerprint, issuedAt }
 */

const MAX_DEVICES = 3;
const TOKEN_TTL_DAYS = 365;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function makeToken(key, fp) {
  const raw = key + "|" + fp + "|" + Date.now() + "|" + crypto.randomUUID();
  return await sha256(raw);
}


async function activate(req, env) {
  const { key, fingerprint, productId } = await req.json();
  if (!key || !fingerprint) return json({ ok: false, reason: "Missing key or fingerprint" }, 400);
  if (productId !== "omni-forge-1.0") return json({ ok: false, reason: "Unknown product" }, 400);

  const rec = await env.LICENSES.get("key:" + key, "json");
  if (!rec || !rec.active) return json({ ok: false, reason: "Invalid or revoked license key." }, 403);

  rec.devices = rec.devices || [];
  rec.maxDevices = rec.maxDevices || MAX_DEVICES;

  if (rec.devices.includes(fingerprint)) {
    // Already activated on this device - re-issue token
    const token = await makeToken(key, fingerprint);
    const expiresAt = Date.now() + TOKEN_TTL_DAYS * 86400000;
    await env.LICENSES.put("tok:" + token, JSON.stringify({ key, fingerprint, issuedAt: Date.now() }));
    return json({ ok: true, token, expiresAt });
  }

  if (rec.devices.length >= rec.maxDevices) {
    return json({ ok: false, reason: `Device limit reached (${rec.maxDevices}). Deactivate another device first.` }, 403);
  }

  rec.devices.push(fingerprint);
  await env.LICENSES.put("key:" + key, JSON.stringify(rec));

  const token = await makeToken(key, fingerprint);
  const expiresAt = Date.now() + TOKEN_TTL_DAYS * 86400000;
  await env.LICENSES.put("tok:" + token, JSON.stringify({ key, fingerprint, issuedAt: Date.now() }));
  return json({ ok: true, token, expiresAt });
}

async function validate(req, env) {
  const { token, fingerprint } = await req.json();
  if (!token || !fingerprint) return json({ ok: false, reason: "Missing token" }, 400);
  const tok = await env.LICENSES.get("tok:" + token, "json");
  if (!tok) return json({ ok: false, reason: "Token not found." }, 403);
  if (tok.fingerprint !== fingerprint) return json({ ok: false, reason: "Device mismatch." }, 403);
  const rec = await env.LICENSES.get("key:" + tok.key, "json");
  if (!rec || !rec.active) return json({ ok: false, reason: "License revoked." }, 403);
  if (!rec.devices.includes(fingerprint)) return json({ ok: false, reason: "Device deactivated." }, 403);
  return json({ ok: true, expiresAt: Date.now() + TOKEN_TTL_DAYS * 86400000 });
}

async function deactivate(req, env) {
  const { token, fingerprint } = await req.json();
  const tok = await env.LICENSES.get("tok:" + token, "json");
  if (!tok) return json({ ok: true });
  const rec = await env.LICENSES.get("key:" + tok.key, "json");
  if (rec) {
    rec.devices = (rec.devices || []).filter(fp => fp !== fingerprint);
    await env.LICENSES.put("key:" + tok.key, JSON.stringify(rec));
  }
  await env.LICENSES.delete("tok:" + token);
  return json({ ok: true });
}


export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return json({}, 204);
    const url = new URL(req.url);
    try {
      if (req.method === "POST" && url.pathname === "/activate")   return await activate(req, env);
      if (req.method === "POST" && url.pathname === "/validate")   return await validate(req, env);
      if (req.method === "POST" && url.pathname === "/deactivate") return await deactivate(req, env);
      return json({ ok: false, reason: "Not found" }, 404);
    } catch (e) {
      return json({ ok: false, reason: "Server error: " + e.message }, 500);
    }
  }
};
