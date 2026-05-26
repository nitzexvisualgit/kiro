Router.register("vault", function (root) {
  root.innerHTML =
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Library Folder</div></div>' +
      '<div id="vRoot" style="font-size:var(--fs-sm); color:var(--fg-3); margin-bottom:var(--s-2); word-break:break-all">Loading...</div>' +
      '<button class="btn btn-block" id="vChoose">Choose Library Folder...</button>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Save To Library</div></div>' +
      '<div class="grid-2 mt-2">' +
        '<div class="field"><label class="label">Name</label><input class="input" id="vName" placeholder="Asset name"></div>' +
        '<div class="field"><label class="label">Category</label>' +
          '<select class="select" id="vCat">' +
            '<option value="Expressions">Expression</option>' +
            '<option value="Scripts">Script (.jsx)</option>' +
            '<option value="Animations">Animation (selected layer)</option>' +
            '<option value="Effects">Effect Preset (.ffx)</option>' +
            '<option value="Compositions">Composition (.aep)</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="field mt-2" id="vCodeWrap">' +
        '<label class="label" id="vCodeLabel">Expression Code (or leave blank to capture from selected property)</label>' +
        '<textarea class="textarea" id="vCode" rows="4" placeholder="// paste code here, or leave blank"></textarea>' +
      '</div>' +
      '<button class="btn btn-primary btn-block mt-3" id="vSave">Save</button>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">Library</div>' +
        '<button class="btn btn-sm" id="vRefresh">Reload</button>' +
      '</div>' +
      '<div class="toggle-group" id="vCatTabs" style="width:100%; justify-content:space-between">' +
        '<div class="seg active" data-v="Expressions">Expr</div>' +
        '<div class="seg" data-v="Scripts">Scripts</div>' +
        '<div class="seg" data-v="Animations">Anim</div>' +
        '<div class="seg" data-v="Effects">FX</div>' +
        '<div class="seg" data-v="Compositions">Comps</div>' +
      '</div>' +
      '<div id="vList" class="empty mt-3"><div class="icon">Loading...</div></div>' +
    '</div>';

  var listCat = "Expressions";

  function refreshRoot() {
    Bridge.call("Vault.getRoot", {}).then(function (rootPath) {
      document.getElementById("vRoot").textContent = rootPath || "(none - choose a folder to begin)";
    });
  }



  function refreshList() {
    var host = document.getElementById("vList");
    host.className = "empty";
    host.innerHTML = '<div class="icon">...</div>Loading';
    Bridge.call("Vault.listLibrary", { category: listCat }).then(function (items) {
      if (!items || !items.length) {
        host.className = "empty";
        host.innerHTML = '<div class="icon">[]</div>No ' + listCat.toLowerCase() + ' saved yet.';
        return;
      }
      host.className = "";
      host.innerHTML = "";
      items.forEach(function (it) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px;";
        var displayName = (it.name || "").replace(/\.(json|jsx|ffx|aep)$/i, "");
        row.innerHTML = '<div style="flex:1; min-width:0; padding-right:8px"><div style="color:var(--fg-0); font-size:var(--fs-sm); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">' + displayName + '</div><div style="color:var(--fg-3); font-size:var(--fs-xs)">' + (it.modified ? new Date(it.modified).toLocaleDateString() : '') + '</div></div>';
        var apply = document.createElement("button");
        apply.className = "btn btn-sm btn-soft-primary";
        apply.textContent = (listCat === "Compositions" ? "Import" : (listCat === "Scripts" ? "Run" : "Apply"));
        apply.addEventListener("click", function () {
          Bridge.call("Vault.applyAsset", { path: it.path })
            .then(function (r) {
              var msg = "Done";
              if (r && r.applied != null) msg = "Applied to " + r.applied + " target(s)";
              else if (r && r.imported)   msg = "Imported " + r.imported;
              else if (r && r.ran)        msg = "Script executed";
              OF.toast(msg, "success");
            })
            .catch(function (e) { OF.toast(e.message, "error"); });
        });
        row.appendChild(apply);
        host.appendChild(row);
      });
    }).catch(function (e) {
      host.className = "empty";
      host.innerHTML = '<div class="icon">!</div>' + e.message;
    });
  }

  function syncCodeFieldVisibility() {
    var cat = document.getElementById("vCat").value;
    var wrap = document.getElementById("vCodeWrap");
    var label = document.getElementById("vCodeLabel");
    if (cat === "Expressions") {
      wrap.style.display = "";
      label.textContent = "Expression Code (blank = capture from selected property)";
    } else if (cat === "Scripts") {
      wrap.style.display = "";
      label.textContent = "Script Code (.jsx)";
    } else {
      wrap.style.display = "none";
    }
  }
  document.getElementById("vCat").addEventListener("change", syncCodeFieldVisibility);
  syncCodeFieldVisibility();



  function refreshList() {
    var host = document.getElementById("vList");
    host.className = "empty";
    host.innerHTML = '<div class="icon">...</div>Loading';
    Bridge.call("Vault.listLibrary", { category: listCat }).then(function (items) {
      if (!items || !items.length) {
        host.className = "empty";
        host.innerHTML = '<div class="icon">[]</div>No ' + listCat.toLowerCase() + ' saved yet.';
        return;
      }
      host.className = "";
      host.innerHTML = "";
      items.forEach(function (it) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px;";
        var displayName = (it.name || "").replace(/\.(json|jsx|ffx|aep)$/i, "");
        row.innerHTML = '<div style="flex:1; min-width:0; padding-right:8px"><div style="color:var(--fg-0); font-size:var(--fs-sm); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">' + displayName + '</div><div style="color:var(--fg-3); font-size:var(--fs-xs)">' + (it.modified ? new Date(it.modified).toLocaleDateString() : '') + '</div></div>';
        var apply = document.createElement("button");
        apply.className = "btn btn-sm btn-soft-primary";
        apply.textContent = (listCat === "Compositions" ? "Import" : (listCat === "Scripts" ? "Run" : "Apply"));
        apply.addEventListener("click", function () {
          Bridge.call("Vault.applyAsset", { path: it.path })
            .then(function (r) {
              var msg = "Done";
              if (r && r.applied != null) msg = "Applied to " + r.applied + " target(s)";
              else if (r && r.imported)   msg = "Imported " + r.imported;
              else if (r && r.ran)        msg = "Script executed";
              OF.toast(msg, "success");
            })
            .catch(function (e) { OF.toast(e.message, "error"); });
        });
        row.appendChild(apply);
        host.appendChild(row);
      });
    }).catch(function (e) {
      host.className = "empty";
      host.innerHTML = '<div class="icon">!</div>' + e.message;
    });
  }

  function syncCodeFieldVisibility() {
    var cat = document.getElementById("vCat").value;
    var wrap = document.getElementById("vCodeWrap");
    var label = document.getElementById("vCodeLabel");
    if (cat === "Expressions") {
      wrap.style.display = "";
      label.textContent = "Expression Code (blank = capture from selected property)";
    } else if (cat === "Scripts") {
      wrap.style.display = "";
      label.textContent = "Script Code (.jsx)";
    } else {
      wrap.style.display = "none";
    }
  }
  document.getElementById("vCat").addEventListener("change", syncCodeFieldVisibility);
  syncCodeFieldVisibility();

  // Folder picker via native ExtendScript dialog
  document.getElementById("vChoose").addEventListener("click", function () {
    Bridge.exec('(function(){var f=Folder.selectDialog("Choose Omni Forge library folder"); return f ? f.fsName : ""; })()')
      .then(function (path) {
        if (!path || path === "null" || path === "undefined" || path === "") { OF.toast("Cancelled.", "warn"); return; }
        Bridge.call("Vault.setRoot", { path: path })
          .then(function () { OF.toast("Library set", "success"); refreshRoot(); refreshList(); })
          .catch(function (e) { OF.toast(e.message, "error"); });
      });
  });

  document.getElementById("vSave").addEventListener("click", function () {
    var name = document.getElementById("vName").value.trim();
    var cat  = document.getElementById("vCat").value;
    var code = document.getElementById("vCode").value;
    if (!name) { OF.toast("Name required.", "warn"); return; }

    var fn, payload;
    switch (cat) {
      case "Expressions":  fn = "Vault.saveExpression";   payload = { name: name, code: code, property: "" }; break;
      case "Scripts":
        if (!code.trim()) { OF.toast("Script code required.", "warn"); return; }
        fn = "Vault.saveScript";       payload = { name: name, code: code }; break;
      case "Animations":   fn = "Vault.saveAnimation";    payload = { name: name }; break;
      case "Effects":      fn = "Vault.saveEffectPreset"; payload = { name: name }; break;
      case "Compositions": fn = "Vault.saveComposition";  payload = { name: name }; break;
      default: OF.toast("Unknown category", "error"); return;
    }
    Bridge.call(fn, payload)
      .then(function () {
        OF.toast("Saved to " + cat, "success");
        document.getElementById("vName").value = "";
        document.getElementById("vCode").value = "";
        if (listCat === cat) refreshList();
      })
      .catch(function (e) { OF.toast(e.message, "error"); });
  });

  document.querySelectorAll("#vCatTabs .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      document.querySelectorAll("#vCatTabs .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      listCat = s.dataset.v;
      refreshList();
    });
  });
  document.getElementById("vRefresh").addEventListener("click", refreshList);

  refreshRoot();
  refreshList();
});
