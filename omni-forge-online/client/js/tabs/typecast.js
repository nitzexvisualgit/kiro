Router.register("typecast", function (root) {
  root.innerHTML =
    '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">Fonts In Use</div>' +
        '<div class="toggle-group" id="tcScopeIn">' +
          '<div class="seg active" data-v="project">Project</div>' +
          '<div class="seg" data-v="comp">Comp</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-sm btn-block mt-2" id="tcRescan">Rescan</button>' +
      '<div id="tcInUseList" class="empty mt-2"><div class="icon">Aa</div>Click Rescan to detect fonts.</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Replace Font</div></div>' +
      '<div class="field">' +
        '<label class="label">New Font Name (type exact name as it appears in AE font menu)</label>' +
        '<input class="input" id="tcNewFont" placeholder="e.g. Arial, Inter, Futura, Montserrat-Bold">' +
      '</div>' +
      '<p style="font-size:var(--fs-xs); color:var(--fg-3); margin-top:var(--s-2); line-height:1.5">Type the font name exactly as it appears in After Effects\' Character panel font dropdown. To replace only a specific source font, click it in the list above first.</p>' +
      '<div class="grid-2 mt-3">' +
        '<button class="btn btn-primary" data-mode="selection">Replace in Selected Layers</button>' +
        '<button class="btn btn-primary" data-mode="comp">Replace in Active Comp</button>' +
      '</div>' +
      '<button class="btn btn-amber btn-block mt-2" data-mode="project">Replace in Whole Project</button>' +
    '</div>';

  var scopeIn = "project";
  var sourceFont = null;

  function renderInUse() {
    Bridge.call("Fonts.scan", { scope: scopeIn }).then(function (list) {
      var host = root.querySelector("#tcInUseList");
      if (!list || !list.length) {
        host.className = "empty";
        host.innerHTML = '<div class="icon">Aa</div>No text layers found.';
        return;
      }
      host.className = "";
      host.innerHTML = "";
      list.forEach(function (f) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px; cursor:pointer; border:1px solid transparent;";
        row.innerHTML =
          '<div style="flex:1; min-width:0">' +
            '<div style="color:var(--fg-0); font-size:var(--fs-sm); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">' + f.font + '</div>' +
            '<div style="color:var(--fg-3); font-size:var(--fs-xs)">' + f.count + ' layer' + (f.count !== 1 ? 's' : '') + '</div>' +
          '</div>';
        row.dataset.from = f.postScriptName;
        row.addEventListener("click", function () {
          host.querySelectorAll("[data-from]").forEach(function (r) { r.style.borderColor = "transparent"; r.style.background = "var(--bg-2)"; });
          row.style.borderColor = "var(--primary)";
          row.style.background = "var(--primary-soft)";
          sourceFont = f.postScriptName;
          OF.toast("Source: " + f.font + " (click a Replace button to apply)", "info");
        });
        host.appendChild(row);
      });
    }).catch(function (e) { OF.toast(e.message, "error"); });
  }

  root.querySelectorAll("#tcScopeIn .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll("#tcScopeIn .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      scopeIn = s.dataset.v;
      renderInUse();
    });
  });
  root.querySelector("#tcRescan").addEventListener("click", renderInUse);

  root.querySelectorAll("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () {
      var newFont = (root.querySelector("#tcNewFont").value || "").trim();
      if (!newFont) {
        OF.toast("Type the new font name first.", "warn");
        return;
      }
      Bridge.call("Fonts.replace", {
        from:  sourceFont || "*",
        to:    newFont,
        scope: b.dataset.mode
      })
        .then(function (r) {
          var msg = "Replaced " + r.replaced + " of " + r.total + " layer(s)";
          if (r.failed) msg += " (" + r.failed + " failed)";
          OF.toast(msg, "success");
          renderInUse();
        })
        .catch(function (e) { OF.toast(e.message, "error"); });
    });
  });

  renderInUse();
});
