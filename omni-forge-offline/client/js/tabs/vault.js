Router.register("vault", function (root) {
  root.innerHTML =
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Library</div>' +
        '<button class="btn btn-sm" id="vOpen">Open Folder</button>' +
      '</div>' +
      '<div id="vRoot" style="font-size:var(--fs-xs); color:var(--fg-3); word-break:break-all; padding:var(--s-2); background:var(--bg-2); border-radius:var(--r-2)">Loading...</div>' +
      '<p style="font-size:var(--fs-xs); color:var(--fg-3); margin-top:var(--s-2); line-height:1.5">The library folder is created and managed automatically. Click Open Folder to view it in your file manager.</p>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Save</div></div>' +
      '<div class="grid-2 mt-2">' +
        '<div class="field"><label class="label">Name</label><input class="input" id="vName" placeholder="My preset"></div>' +
        '<div class="field"><label class="label">Type</label>' +
          '<select class="select" id="vCat">' +
            '<option value="Effects">Effect Preset (selected layer)</option>' +
            '<option value="Expressions">Expression</option>' +
            '<option value="Compositions">Composition (active comp)</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="field mt-2" id="vCodeWrap">' +
        '<label class="label" id="vCodeLabel">Expression code (or leave blank to capture from selected property)</label>' +
        '<textarea class="textarea" id="vCode" rows="4" placeholder="// paste expression code here, or leave blank"></textarea>' +
      '</div>' +
      '<div class="field mt-2" id="vHelp" style="font-size:var(--fs-xs); color:var(--fg-3); padding:var(--s-2); background:var(--bg-2); border-radius:var(--r-2); line-height:1.5"></div>' +
      '<button class="btn btn-primary btn-block mt-3" id="vSave">Save</button>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">Saved Presets</div>' +
        '<button class="btn btn-sm" id="vRefresh">Reload</button>' +
      '</div>' +
      '<div class="toggle-group" id="vCatTabs" style="width:100%">' +
        '<div class="seg active" data-v="Effects" style="flex:1; text-align:center">FX</div>' +
        '<div class="seg" data-v="Expressions" style="flex:1; text-align:center">Expr</div>' +
        '<div class="seg" data-v="Compositions" style="flex:1; text-align:center">Comps</div>' +
      '</div>' +
      '<div id="vList" class="empty mt-3"><div class="icon">...</div>Loading</div>' +
    '</div>';

  var listCat = "Effects";



  function refreshRoot() {
    Bridge.call("Vault.getRoot", {}).then(function (path) {
      document.getElementById("vRoot").textContent = path || "(unavailable)";
    }).catch(function (e) {
      document.getElementById("vRoot").textContent = "Error: " + e.message;
    });
  }

  function refreshList() {
    var host = document.getElementById("vList");
    host.className = "empty";
    host.innerHTML = '<div class="icon">...</div>Loading';
    Bridge.call("Vault.listLibrary", { category: listCat }).then(function (items) {
      if (!items || !items.length) {
        host.className = "empty";
        host.innerHTML = '<div class="icon">[]</div>No saved ' + listCat.toLowerCase() + ' yet.';
        return;
      }
      host.className = "";
      host.innerHTML = "";
      items.forEach(function (it) { renderRow(host, it); });
    }).catch(function (e) {
      host.className = "empty";
      host.innerHTML = '<div class="icon">!</div>' + e.message;
    });
  }



  function renderRow(host, it) {
    var row = document.createElement("div");
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px; gap:6px";
    var displayName = (it.name || "").replace(/\.(json|jsx|ffx|aep)$/i, "");
    row.innerHTML =
      '<div style="flex:1; min-width:0">' +
        '<div style="color:var(--fg-0); font-size:var(--fs-sm); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">' + displayName + '</div>' +
        '<div style="color:var(--fg-3); font-size:var(--fs-xs)">' + (it.modified ? new Date(it.modified).toLocaleDateString() : '') + '</div>' +
      '</div>';
    var apply = document.createElement("button");
    apply.className = "btn btn-sm btn-soft-primary";
    apply.textContent = (listCat === "Compositions" ? "Import" : "Apply");
    apply.addEventListener("click", function () {
      Bridge.call("Vault.applyAsset", { path: it.path })
        .then(function (r) {
          var msg = "Done";
          if (r && r.applied != null) msg = "Applied to " + r.applied + " target(s)";
          else if (r && r.imported)  msg = "Imported " + r.imported;
          OF.toast(msg, "success");
        })
        .catch(function (e) { OF.toast(e.message, "error"); });
    });
    var del = document.createElement("button");
    del.className = "btn btn-sm btn-soft-danger";
    del.textContent = "x";
    del.title = "Delete";
    del.addEventListener("click", function () {
      if (!confirm("Delete '" + displayName + "'?")) return;
      Bridge.call("Vault.deleteAsset", { path: it.path })
        .then(function () { OF.toast("Deleted", "success"); refreshList(); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    });
    row.appendChild(apply);
    row.appendChild(del);
    host.appendChild(row);
  }



  function syncCat() {
    var cat = document.getElementById("vCat").value;
    var wrap = document.getElementById("vCodeWrap");
    var help = document.getElementById("vHelp");
    if (cat === "Expressions") {
      wrap.style.display = "";
      help.textContent = "Saves an expression. Either paste code above, or select a property in the timeline that already has an expression and leave the field blank.";
    } else if (cat === "Effects") {
      wrap.style.display = "none";
      help.textContent = "Saves the entire effect stack (and all parameter values) of the SELECTED LAYER as an animation preset (.ffx). Apply later to any other layer to instantly recreate the look.";
    } else {
      wrap.style.display = "none";
      help.textContent = "Saves the ACTIVE COMPOSITION as a re-importable .aep file. Important: your project must be saved at least once first (File > Save).";
    }
  }
  document.getElementById("vCat").addEventListener("change", syncCat);
  syncCat();

  document.getElementById("vSave").addEventListener("click", function () {
    var name = document.getElementById("vName").value.trim();
    var cat  = document.getElementById("vCat").value;
    if (!name) { OF.toast("Name required.", "warn"); return; }
    var fn, payload;
    if (cat === "Expressions") {
      fn = "Vault.saveExpression";
      payload = { name: name, code: document.getElementById("vCode").value };
    } else if (cat === "Effects") {
      fn = "Vault.saveEffectPreset";
      payload = { name: name };
    } else {
      fn = "Vault.saveComposition";
      payload = { name: name };
    }
    Bridge.call(fn, payload)
      .then(function (r) {
        OF.toast("Saved as '" + (r && r.name || name) + "'", "success");
        document.getElementById("vName").value = "";
        document.getElementById("vCode").value = "";
        if (listCat === cat) refreshList();
      })
      .catch(function (e) { OF.toast(e.message, "error"); });
  });

  document.getElementById("vOpen").addEventListener("click", function () {
    Bridge.call("Vault.openInExplorer", {})
      .then(function (path) { OF.toast("Opened: " + path, "info"); })
      .catch(function (e) { OF.toast(e.message, "error"); });
  });

  document.getElementById("vRefresh").addEventListener("click", refreshList);

  document.querySelectorAll("#vCatTabs .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      document.querySelectorAll("#vCatTabs .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      listCat = s.dataset.v;
      refreshList();
    });
  });

  refreshRoot();
  refreshList();
});
