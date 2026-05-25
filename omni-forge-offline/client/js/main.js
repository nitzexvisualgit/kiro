/**
 * main.js - bootstrap and global helpers (toast, modal).
 */
(function () {
  "use strict";

  // ---- Toast ----
  var toastHost = null;
  function toast(msg, type) {
    if (!toastHost) toastHost = document.getElementById("toastHost");
    var el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.textContent = msg;
    // Errors stick around longer and are click-to-dismiss + click-to-copy
    var isErr = (type === "error");
    if (isErr) {
      el.style.cursor = "pointer";
      el.style.maxWidth = "560px";
      el.style.whiteSpace = "pre-wrap";
      el.title = "Click to copy this error";
      el.addEventListener("click", function () {
        try {
          if (navigator.clipboard) navigator.clipboard.writeText(msg);
          var hint = document.createElement("div");
          hint.style.cssText = "font-size:10px; color:var(--fg-3); margin-top:4px";
          hint.textContent = "(copied)";
          el.appendChild(hint);
        } catch (e) {}
      });
    }
    toastHost.appendChild(el);
    var lifetime = isErr ? 14000 : 2400;
    setTimeout(function () { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; }, lifetime);
    setTimeout(function () { el.remove(); }, lifetime + 300);
  }
  document.addEventListener("of:toast", function (e) { toast(e.detail.message, e.detail.type); });

  // ---- Modal ----
  function modal(opts) {
    return new Promise(function (resolve) {
      var host = document.getElementById("modalHost");
      host.classList.remove("hidden");
      host.innerHTML = "";
      var m = document.createElement("div");
      m.className = "modal";
      m.innerHTML =
        '<div class="modal-head">' +
          (opts.icon ? '<span class="modal-icon">' + opts.icon + '</span>' : '') +
          '<h3>' + (opts.title || '') + '</h3>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-foot"></div>';
      host.appendChild(m);
      m.querySelector(".modal-body").innerHTML = opts.body || "";
      var foot = m.querySelector(".modal-foot");
      (opts.actions || [{ label: "OK", primary: true, value: true }, { label: "Cancel", value: false }]).forEach(function (a) {
        var b = document.createElement("button");
        b.className = "btn " + (a.primary ? "btn-primary" : a.danger ? "btn-danger" : a.amber ? "btn-amber" : "btn-ghost");
        b.textContent = a.label;
        b.addEventListener("click", function () {
          var collect = {};
          m.querySelectorAll("[data-field]").forEach(function (el) {
            collect[el.dataset.field] = el.type === "checkbox" ? el.checked : el.value;
          });
          host.classList.add("hidden");
          resolve(a.value === undefined ? collect : { value: a.value, fields: collect });
        });
        foot.appendChild(b);
      });
      if (typeof opts.onMount === "function") opts.onMount(m);
    });
  }
  window.OF = window.OF || {};
  window.OF.toast = toast;
  window.OF.modal = modal;


  // ---- License gate flow ----
  function showApp() {
    document.getElementById("licenseGate").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    Router.init();
    Router.go("home");
  }
  function showGate(message) {
    document.getElementById("app").classList.add("hidden");
    var gate = document.getElementById("licenseGate");
    gate.classList.remove("hidden");
    var status = document.getElementById("licenseStatus");
    if (message) { status.textContent = message; status.className = "lg-status error"; }
  }

  function bindGate() {
    var input = document.getElementById("licenseKeyInput");
    var btn   = document.getElementById("activateBtn");
    var status = document.getElementById("licenseStatus");

    function tryActivate() {
      var key = input.value.trim().toUpperCase();
      if (!/^OMNI(-[A-Z0-9]{4}){4}$/.test(key)) {
        status.textContent = "Invalid key format. Expected OMNI-XXXX-XXXX-XXXX-XXXX.";
        status.className = "lg-status error";
        return;
      }
      btn.disabled = true; btn.textContent = "Activating...";
      status.textContent = ""; status.className = "lg-status";
      License.activate(key)
        .then(function () {
          status.textContent = "Activated. Welcome!"; status.className = "lg-status success";
          setTimeout(showApp, 600);
        })
        .catch(function (e) {
          status.textContent = e.message || "Activation failed."; status.className = "lg-status error";
          btn.disabled = false; btn.textContent = "Activate";
        });
    }
    btn.addEventListener("click", tryActivate);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") tryActivate(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindGate();
    // Try silent validation first
    if (typeof License === "undefined" || !License.fingerprint) {
      // Node integration not available - dev mode: skip gate
      console.warn("Node integration unavailable - bypassing license for dev.");
      showApp();
      return;
    }
    License.validate().then(showApp).catch(function (e) {
      showGate(e && e.message ? null : null); // initial silent state
    });
  });
})();
