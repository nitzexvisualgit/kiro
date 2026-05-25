Router.register("studio", function (root) {
  root.innerHTML =
    '<div class="card" style="text-align:center; padding:var(--s-6) var(--s-4)">' +
      '<div style="width:60px; height:60px; background:var(--bg-3); border:1px solid var(--line-2); border-radius:var(--r-4); display:flex; align-items:center; justify-content:center; margin:0 auto var(--s-3); color:var(--accent); font-size:28px">⚡</div>' +
      '<h2 style="font-size:var(--fs-xl); color:var(--fg-0); letter-spacing:-0.02em">Nitin Shankhwar</h2>' +
      '<div style="color:var(--primary); font-size:var(--fs-sm); font-weight:600; letter-spacing:0.1em; text-transform:uppercase; margin-top:2px">Nitzex Visual</div>' +
      '<p style="color:var(--fg-2); font-size:var(--fs-sm); margin-top:var(--s-3); line-height:1.6; max-width:300px; margin-left:auto; margin-right:auto">Motion designer, video editor, and creator of Omni Forge. Building professional After Effects tools for creators worldwide.</p>' +
      '<div style="display:inline-block; margin-top:var(--s-3); padding:6px 14px; background:var(--bg-3); border-radius:999px; border:1px solid var(--line); font-size:var(--fs-xs); color:var(--fg-2); font-family:var(--font-mono)">Omni Forge v1.0.0</div>' +
    '</div>' +

    '<div class="grid-3 mt-3">' +
      '<div style="padding:var(--s-3); background:var(--bg-1); border:1px solid var(--line); border-radius:var(--r-2); text-align:center"><div style="color:var(--primary); font-size:var(--fs-2xl); font-weight:600">8</div><div style="font-size:var(--fs-xs); color:var(--fg-3); text-transform:uppercase">Sections</div></div>' +
      '<div style="padding:var(--s-3); background:var(--bg-1); border:1px solid var(--line); border-radius:var(--r-2); text-align:center"><div style="color:var(--primary); font-size:var(--fs-2xl); font-weight:600">60+</div><div style="font-size:var(--fs-xs); color:var(--fg-3); text-transform:uppercase">Features</div></div>' +
      '<div style="padding:var(--s-3); background:var(--bg-1); border:1px solid var(--line); border-radius:var(--r-2); text-align:center"><div style="color:var(--primary); font-size:var(--fs-2xl); font-weight:600">20+</div><div style="font-size:var(--fs-xs); color:var(--fg-3); text-transform:uppercase">Animations</div></div>' +
    '</div>' +

    '<div class="card mt-3">' +
      '<div class="card-header"><div class="card-title">Connect</div></div>' +
      '<div class="grid-2" style="gap:var(--s-2)">' +
        '<a class="btn btn-block" data-link="https://www.youtube.com/nitzex_visual">▶ YouTube</a>' +
        '<a class="btn btn-block" data-link="https://www.facebook.com/">Facebook</a>' +
        '<a class="btn btn-block" data-link="https://www.instagram.com/nitzexvisual">Instagram</a>' +
        '<a class="btn btn-block" data-link="https://www.linkedin.com/in/nitinshankhwar/">LinkedIn</a>' +
      '</div>' +
    '</div>' +


    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Support The Work</div></div>' +
      '<p style="font-size:var(--fs-sm); color:var(--fg-2); line-height:1.5; margin-bottom:var(--s-3); text-align:center">If Omni Forge saves you time, consider supporting future development.</p>' +
      '<div class="grid-2">' +
        '<a class="btn btn-danger" data-link="https://patreon.com/nitzexvisual">♥ Support on Patreon</a>' +
        '<a class="btn" data-link="https://paypal.me/nitzexbusiness">PayPal</a>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><div class="card-title">License</div></div>' +
      '<div id="licInfo" style="font-family:var(--font-mono); font-size:var(--fs-xs); color:var(--fg-2); padding:var(--s-3); background:var(--bg-2); border-radius:var(--r-2); margin-bottom:var(--s-2)"></div>' +
      '<div class="grid-2">' +
        '<button class="btn" id="licRevalidate">Re-validate</button>' +
        '<button class="btn btn-soft-danger" id="licDeactivate">Deactivate</button>' +
      '</div>' +
    '</div>' +

    '<div style="text-align:center; padding:var(--s-4); color:var(--fg-3); font-size:var(--fs-xs); line-height:1.5">' +
      '© 2026 Nitin Shankhwar / Nitzex Visual · All rights reserved<br>' +
      'Built with care for motion designers worldwide' +
    '</div>';

  // License info
  function refreshLic() {
    var info = document.getElementById("licInfo");
    if (typeof License === "undefined" || !License.status) {
      info.textContent = "Dev mode (license not enforced)";
      return;
    }
    var s = License.status();
    if (!s) { info.textContent = "Not activated"; return; }
    info.innerHTML =
      "Key: " + (s.key || "—") + "<br>" +
      "Activated: " + new Date(s.activatedAt).toLocaleDateString() + "<br>" +
      "Last check: " + new Date(s.lastCheck).toLocaleString() + "<br>" +
      "Device: " + License.fingerprint().substring(0, 12) + "...";
  }
  refreshLic();

  document.getElementById("licRevalidate").addEventListener("click", function () {
    if (typeof License === "undefined") { OF.toast("Dev mode", "info"); return; }
    License.validate().then(function () { OF.toast("License valid", "success"); refreshLic(); }).catch(function (e) { OF.toast(e.message, "error"); });
  });
  document.getElementById("licDeactivate").addEventListener("click", function () {
    OF.modal({
      title: "Deactivate License",
      icon: "⚠",
      body: '<p style="font-size:var(--fs-sm); color:var(--fg-2); line-height:1.5">This will free up one of your 3 device slots. You can re-activate using the same key.</p>',
      actions: [{ label: "Cancel", value: false }, { label: "Deactivate", danger: true, value: true }]
    }).then(function (r) {
      if (!r.value) return;
      License.deactivate().then(function () { OF.toast("Deactivated", "success"); setTimeout(function () { location.reload(); }, 800); });
    });
  });
});
