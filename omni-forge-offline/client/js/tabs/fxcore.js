Router.register("fxcore", function (root) {
  root.innerHTML =
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Effect Actions</div>' +
        '<div class="toggle-group" id="fxScope">' +
          '<div class="seg" data-v="project">Project</div>' +
          '<div class="seg active" data-v="comp">Comp</div>' +
          '<div class="seg" data-v="selection">Sel</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid-3" style="margin-bottom:var(--s-2)">' +
        '<button class="btn btn-soft-danger" data-act="disable">Disable</button>' +
        '<button class="btn btn-soft-primary" data-act="enable">Enable</button>' +
        '<button class="btn btn-danger" data-act="remove">Remove</button>' +
      '</div>' +
      '<div class="field mt-2">' +
        '<label class="label">Filter (effect name or matchName, * = all)</label>' +
        '<input class="input" id="fxFilter" value="*" placeholder="e.g. ADBE Glo2 or Deep Glow">' +
      '</div>' +
      '<button class="btn btn-block mt-2" data-act="inventory">Show Effects In Scope</button>' +
      '<div id="fxList" class="mt-3"></div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Third-Party Effect Registry</div></div>' +
      '<p style="font-size:var(--fs-xs); color:var(--fg-3); line-height:1.5; margin-bottom:var(--s-3)">' +
        'Apply an external plugin (e.g. Deep Glow) to a layer, select that layer, then Probe to capture its matchName for use in the filter above.' +
      '</p>' +
      '<div class="grid-2">' +
        '<button class="btn btn-amber" data-act="probe">Probe Selected Effect</button>' +
        '<button class="btn" data-act="addManual">+ Add Manually</button>' +
      '</div>' +
      '<div id="fxRegistry" class="mt-3"></div>' +
    '</div>';


  var scope = "comp";
  root.querySelectorAll("#fxScope .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll("#fxScope .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      scope = s.dataset.v;
    });
  });

  // Persist registry in localStorage
  var REG_KEY = "of_fx_registry";
  function loadRegistry() { try { return JSON.parse(localStorage.getItem(REG_KEY) || "[]"); } catch (e) { return []; } }
  function saveRegistry(r) { localStorage.setItem(REG_KEY, JSON.stringify(r)); }
  function renderRegistry() {
    var host = root.querySelector("#fxRegistry");
    var reg = loadRegistry();
    if (!reg.length) { host.innerHTML = '<div class="empty" style="padding:var(--s-3)">No third-party effects registered.</div>'; return; }
    host.innerHTML = "";
    reg.forEach(function (e, i) {
      var row = document.createElement("div");
      row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px;";
      row.innerHTML = '<div><div style="color:var(--fg-0); font-size:var(--fs-sm)">⚡ ' + e.name + '</div><div style="color:var(--fg-3); font-size:var(--fs-xs); font-family:var(--font-mono)">' + e.matchName + '</div></div>';
      var del = document.createElement("button"); del.className = "btn btn-sm btn-soft-danger"; del.textContent = "✕";
      del.addEventListener("click", function () { var r = loadRegistry(); r.splice(i, 1); saveRegistry(r); renderRegistry(); });
      row.appendChild(del);
      host.appendChild(row);
    });
  }
  renderRegistry();

  var actions = {
    disable: function () { Bridge.call("Effects.apply", { scope: scope, action: "disable", filter: root.querySelector("#fxFilter").value }).then(function (r) { OF.toast("Disabled " + r.affected + " effects", "success"); }).catch(function (e) { OF.toast(e.message, "error"); }); },
    enable:  function () { Bridge.call("Effects.apply", { scope: scope, action: "enable",  filter: root.querySelector("#fxFilter").value }).then(function (r) { OF.toast("Enabled " + r.affected + " effects", "success"); }).catch(function (e) { OF.toast(e.message, "error"); }); },
    remove:  function () { Bridge.call("Effects.apply", { scope: scope, action: "remove",  filter: root.querySelector("#fxFilter").value }).then(function (r) { OF.toast("Removed " + r.affected + " effects", "success"); }).catch(function (e) { OF.toast(e.message, "error"); }); },

    inventory: function () {
      Bridge.call("Effects.inventory", { scope: scope }).then(function (list) {
        var host = root.querySelector("#fxList");
        if (!list.length) { host.innerHTML = '<div class="empty" style="padding:var(--s-3)">No effects in scope.</div>'; return; }
        host.innerHTML = "";
        list.forEach(function (e) {
          var row = document.createElement("div");
          row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:3px; cursor:pointer;";
          row.innerHTML = '<div><div style="color:var(--fg-0); font-size:var(--fs-sm)">' + e.name + '</div><div style="color:var(--fg-3); font-size:var(--fs-xs); font-family:var(--font-mono)">' + e.matchName + '</div></div><span class="pill">' + e.count + '</span>';
          row.addEventListener("click", function () { root.querySelector("#fxFilter").value = e.matchName; OF.toast("Filter set", "info"); });
          host.appendChild(row);
        });
      });
    },


    probe: function () {
      Bridge.call("Effects.probe", {}).then(function (r) {
        var reg = loadRegistry();
        if (reg.find(function (e) { return e.matchName === r.matchName; })) { OF.toast("Already registered", "warn"); return; }
        reg.push(r); saveRegistry(reg); renderRegistry();
        OF.toast("Registered: " + r.name, "success");
      }).catch(function (e) { OF.toast(e.message, "error"); });
    },
    addManual: function () {
      OF.modal({
        title: "Add Effect Manually",
        body:
          '<div class="field"><label class="label">Display Name</label><input class="input" data-field="name" placeholder="Deep Glow"></div>' +
          '<div class="field mt-2"><label class="label">Match Name</label><input class="input" data-field="matchName" placeholder="ABG Deep Glow"></div>',
        actions: [{ label: "Cancel", value: false }, { label: "Add", primary: true, value: true }]
      }).then(function (r) {
        if (!r.value || !r.fields.name || !r.fields.matchName) return;
        var reg = loadRegistry();
        reg.push({ name: r.fields.name, matchName: r.fields.matchName });
        saveRegistry(reg); renderRegistry();
        OF.toast("Added", "success");
      });
    }
  };
  root.querySelectorAll("[data-act]").forEach(function (b) {
    b.addEventListener("click", function () { var fn = actions[b.dataset.act]; if (fn) fn(); });
  });
});
