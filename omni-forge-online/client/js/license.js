/**
 * License - device-bound license activation with offline grace period.
 *
 * Flow:
 *   1. On startup, read encrypted activation file from user data folder.
 *   2. If valid + recent (< 14 days since last server check) -> unlock.
 *   3. If missing or stale -> require online activation (or re-validation).
 *
 * Server: Cloudflare Worker at LICENSE_API. Speaks JSON.
 *   POST /activate    { key, fingerprint, productId } -> { ok, token, expiresAt }
 *   POST /validate    { token, fingerprint }          -> { ok, expiresAt } | { ok:false, reason }
 *   POST /deactivate  { token, fingerprint }          -> { ok }
 *
 * Crypto: We sign the local activation token with HMAC-SHA256 using a per-device key
 * derived from the fingerprint. Tampering invalidates the token.
 */
(function (global) {
  "use strict";

  // Replace with your deployed Worker URL once you publish it.
  var LICENSE_API = "https://omni-forge-license.YOUR-WORKER.workers.dev";
  var PRODUCT_ID  = "omni-forge-1.0";
  var GRACE_DAYS  = 14;

  var fs = (typeof require !== "undefined") ? (function(){ try { return require("fs"); } catch(e){ return null; } })() : null;
  var os = (typeof require !== "undefined") ? (function(){ try { return require("os"); } catch(e){ return null; } })() : null;
  var crypto = (typeof require !== "undefined") ? (function(){ try { return require("crypto"); } catch(e){ return null; } })() : null;
  var path = (typeof require !== "undefined") ? (function(){ try { return require("path"); } catch(e){ return null; } })() : null;

  function tokenPath() {
    if (!path || !os) return null;
    var dir = path.join(os.homedir(), ".omni-forge");
    if (fs && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, "license.dat");
  }

  function fingerprint() {
    if (!os || !crypto) return "unknown-device";
    var parts = [
      os.hostname() || "",
      os.platform() || "",
      os.arch() || "",
      String((os.cpus() && os.cpus()[0] && os.cpus()[0].model) || ""),
      String(os.totalmem() || "")
    ];
    var nics = os.networkInterfaces ? os.networkInterfaces() : {};
    for (var k in nics) {
      var arr = nics[k];
      for (var i = 0; i < arr.length; i++) if (arr[i].mac && arr[i].mac !== "00:00:00:00:00:00") { parts.push(arr[i].mac); break; }
    }
    return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
  }


  function readToken() {
    var p = tokenPath();
    if (!p || !fs || !fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return null; }
  }

  function writeToken(obj) {
    var p = tokenPath();
    if (!p || !fs) return false;
    try { fs.writeFileSync(p, JSON.stringify(obj), "utf8"); return true; } catch (e) { return false; }
  }

  function clearToken() {
    var p = tokenPath();
    if (p && fs && fs.existsSync(p)) try { fs.unlinkSync(p); } catch (e) {}
  }

  function sign(payload, fp) {
    if (!crypto) return "";
    return crypto.createHmac("sha256", fp).update(JSON.stringify(payload)).digest("hex");
  }

  function verifySignature(stored, fp) {
    if (!stored || !stored.payload || !stored.sig) return false;
    return sign(stored.payload, fp) === stored.sig;
  }

  function postJson(url, body) {
    return new Promise(function (resolve, reject) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = 12000;
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(new Error("Bad response")); }
          } else {
            try { reject(JSON.parse(xhr.responseText)); } catch (e) { reject(new Error("HTTP " + xhr.status)); }
          }
        };
        xhr.onerror = function () { reject(new Error("Network error - check internet connection.")); };
        xhr.ontimeout = function () { reject(new Error("Server timeout.")); };
        xhr.send(JSON.stringify(body));
      } catch (e) { reject(e); }
    });
  }


  function activate(key) {
    var fp = fingerprint();
    return postJson(LICENSE_API + "/activate", { key: key, fingerprint: fp, productId: PRODUCT_ID })
      .then(function (resp) {
        if (!resp || !resp.ok) throw new Error((resp && resp.reason) || "Activation failed.");
        var payload = { key: key, fp: fp, token: resp.token, activatedAt: Date.now(), lastCheck: Date.now(), expiresAt: resp.expiresAt || 0 };
        var sig = sign(payload, fp);
        writeToken({ payload: payload, sig: sig });
        return payload;
      });
  }

  function validate() {
    var stored = readToken();
    if (!stored) return Promise.reject(new Error("No license installed."));
    var fp = fingerprint();
    if (!verifySignature(stored, fp)) { clearToken(); return Promise.reject(new Error("License signature invalid (device changed?).")); }

    // Within grace -> trust local
    var sinceCheck = Date.now() - (stored.payload.lastCheck || 0);
    if (sinceCheck < GRACE_DAYS * 24 * 3600 * 1000) {
      return Promise.resolve(stored.payload);
    }
    // Otherwise re-validate online
    return postJson(LICENSE_API + "/validate", { token: stored.payload.token, fingerprint: fp })
      .then(function (resp) {
        if (!resp || !resp.ok) {
          clearToken();
          throw new Error((resp && resp.reason) || "License revoked.");
        }
        stored.payload.lastCheck = Date.now();
        stored.payload.expiresAt = resp.expiresAt || stored.payload.expiresAt;
        stored.sig = sign(stored.payload, fp);
        writeToken(stored);
        return stored.payload;
      });
  }

  function deactivate() {
    var stored = readToken();
    if (!stored) return Promise.resolve();
    var fp = fingerprint();
    return postJson(LICENSE_API + "/deactivate", { token: stored.payload.token, fingerprint: fp })
      .then(function () { clearToken(); }).catch(function () { clearToken(); });
  }

  function status() {
    var stored = readToken();
    if (!stored) return null;
    return { key: stored.payload.key, activatedAt: stored.payload.activatedAt, lastCheck: stored.payload.lastCheck, expiresAt: stored.payload.expiresAt };
  }

  global.License = { activate: activate, validate: validate, deactivate: deactivate, status: status, fingerprint: fingerprint };
})(window);
