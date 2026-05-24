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
            '<option value="Animations">Animation</option>' +
            '<option value="Effects">Effect Preset</option>' +
            '<option value="Compositions">Composition</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="field mt-2" id="vExprWrap">' +
        '<label class="label">Expression Code</label>' +
        '<textarea class="textarea" id="vCode" placeholder="// paste expression code here" rows="4"></textarea>' +
      '</div>' +
      '<div class="field mt-2" id="vPropWrap">' +
        '<label class="label">Target Property (optional)</label>' +
        '<input class="input" id="vProp" placeholder="e.g. Position">' +
      '</div>' +
      '<button class="btn btn-primary btn-block mt-3" id="vSave">Save</button>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">Library</div>' +
        '<div class="toggle-group" id="vCatTabs">' +
          '<div class="seg active" data-v="Expressions">Expr</div>' +
          '<div class="seg" data-v="Animations">Anim</div>' +
          '<div class="seg" data-v="Effects">FX</div>' +
          '<div class="seg" data-v="Compositions">Comp</div>' +
        '</div>' +
      '</div>' +
      '<div id="vList" class="empty"><div class="icon">📂</div>Empty</div>' +
    '</div>';


  var listCat = "Expressions";

  function refreshRoot() {
    Bridge.call("Vault.getRoot", {}).then(function (root) {
      document.getElementById("vRoot").textContent = root || "(none — choose a folder to begin)";
    });
  }

  function refreshList() {
    Bridge.call("Vault.listLibrary", { category: listCat }).then(function (items) {
      var host = document.getElementById("vList");
      if (!items || !items.length) { host.className = "empty"; host.innerHTML = '<div class="icon">📂</div>No ' + listCat.toLowerCase() + ' saved yet.'; return; }
      host.className = "";
      host.innerHTML = "";
      items.forEach(function (it) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px;";
        row.innerHTML = '<div style="flex:1; min-width:0"><div style="color:var(--fg-0); font-size:var(--fs-sm); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">' + it.name + '</div></div>';
        var apply = document.createElement("button");
        apply.className = "btn btn-sm btn-soft-primary"; apply.textContent = "Apply";
        apply.addEventListener("click", function () {
          if (listCat === "Expressions") {
            Bridge.call("Vault.applyExpression", { path: it.path }).then(function (r) { OF.toast("Applied to " + r.applied + " props", "success"); }).catch(function (e) { OF.toast(e.message, "error"); });
          } else {
            OF.toast("Apply for " + listCat + " — coming in v1.1", "warn");
          }
        });
        row.appendChild(apply);
        host.appendChild(row);
      });
    });
  }

  document.getElementById("vChoose").addEventListener("click", function () {
    // Use ExtendScript folder picker (cross-platform native dialog)
    Bridge.exec('(function(){var f=Folder.selectDialog("Choose Omni Forge library folder"); return f?f.fsName:"";})()').then(function (path) {
      if (!path || path === "null" || path === "undefined") { OF.toast("Cancelled", "warn"); return; }
      Bridge.call("Vault.setRoot", { path: path }).then(function () { OF.toast("Library set", "success"); refreshRoot(); }).catch(function (e) { OF.toast(e.message, "error"); });
    });
  });

  document.getElementById("vSave").addEventListener("click", function () {
    var name = document.getElementById("vName").value.trim();
    var cat  = document.getElementById("vCat").value;
    if (!name) { OF.toast("Name required", "warn"); return; }
    if (cat === "Expressions") {
      var code = document.getElementById("vCode").value.trim();
      if (!code) { OF.toast("Expression code required", "warn"); return; }
      Bridge.call("Vault.saveExpression", { name: name, code: code, property: document.getElementById("vProp").value })
        .then(function () { OF.toast("Saved", "success"); refreshList(); }).catch(function (e) { OF.toast(e.message, "error"); });
    } else if (cat === "Effects") {
      Bridge.call("Vault.saveAnimationPreset", { name: name }).then(function () { OF.toast("Preset saved", "success"); refreshList(); }).catch(function (e) { OF.toast(e.message, "error"); });
    } else {
      OF.toast(cat + " save coming in v1.1", "warn");
    }
  });

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
