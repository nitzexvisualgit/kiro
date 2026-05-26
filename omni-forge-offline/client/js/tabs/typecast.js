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
      '<div class="row mt-2"><button class="btn btn-sm btn-block" id="tcRescan">Rescan</button></div>' +
      '<div id="tcInUseList" class="empty mt-2"><div class="icon">Aa</div>Click Rescan to detect fonts.</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">Installed Fonts (Replace With)</div>' +
        '<button class="btn btn-sm" id="tcReloadFonts">Reload</button>' +
      '</div>' +
      '<input class="input" id="tcSearch" placeholder="Search font family or PostScript name...">' +
      '<div id="tcInstalledList" class="mt-2" style="max-height:280px; overflow-y:auto; background:var(--bg-2); border-radius:var(--r-2); border:1px solid var(--line)"></div>' +
      '<div id="tcSelected" style="margin-top:var(--s-2); padding:var(--s-2); background:var(--bg-2); border-radius:var(--r-2); font-size:var(--fs-xs); color:var(--fg-3); text-align:center">No replacement font selected</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Replace Mode</div></div>' +
      '<p style="font-size:var(--fs-xs); color:var(--fg-3); margin-bottom:var(--s-3); line-height:1.5">Pick where to apply the replacement. To replace ONLY a specific source font, click it in the "Fonts In Use" list above first.</p>' +
      '<div class="grid-2">' +
        '<button class="btn btn-primary" data-mode="selection">Selected Layers</button>' +
        '<button class="btn btn-primary" data-mode="comp">Active Comp</button>' +
      '</div>' +
      '<button class="btn btn-amber btn-block mt-2" data-mode="project">Whole Project</button>' +
    '</div>';

  var scopeIn = "project";
  var sourceFont = null;       // PostScript name to match (or null = all)
  var replacementFont = null;  // PostScript name to set
  var installedFonts = [];

  function renderInUse() {
    Bridge.call("Fonts.scan", { scope: scopeIn }).then(function (list) {
      var host = root.querySelector("#tcInUseList");
      if (!list || !list.length) {
        host.className = "empty";
        host.innerHTML = '<div class="icon">Aa</div>No text layers in scope.';
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
            '<div style="color:var(--fg-3); font-size:var(--fs-xs)">' + f.count + ' layer' + (f.count !== 1 ? 's' : '') + (f.sample ? ' - "' + f.sample + '"' : '') + '</div>' +
          '</div>';
        row.dataset.from = f.postScriptName;
        row.addEventListener("click", function () {
          host.querySelectorAll("[data-from]").forEach(function (r) { r.style.borderColor = "transparent"; r.style.background = "var(--bg-2)"; });
          row.style.borderColor = "var(--primary)";
          row.style.background = "var(--primary-soft)";
          sourceFont = f.postScriptName;
        });
        host.appendChild(row);
      });
    }).catch(function (e) { OF.toast(e.message, "error"); });
  }


  function renderInstalled(filterStr) {
    var host = root.querySelector("#tcInstalledList");
    var q = (filterStr || "").toLowerCase().trim();
    if (!installedFonts.length) {
      host.innerHTML = '<div class="empty" style="padding:var(--s-3)"><div class="icon">Aa</div>No installed fonts detected. (Older AE versions don\'t expose this.)</div>';
      return;
    }
    var filtered = q
      ? installedFonts.filter(function (f) { return f.displayName.toLowerCase().indexOf(q) >= 0 || f.postScriptName.toLowerCase().indexOf(q) >= 0; })
      : installedFonts;
    if (!filtered.length) { host.innerHTML = '<div class="empty" style="padding:var(--s-3)">No matches.</div>'; return; }

    // Cap rendering at 300 to keep the panel snappy
    var capped = filtered.slice(0, 300);
    var html = "";
    for (var i = 0; i < capped.length; i++) {
      var f = capped[i];
      html += '<div class="tc-font-row" data-ps="' + f.postScriptName.replace(/"/g, '&quot;') + '" style="padding:6px 10px; cursor:pointer; border-bottom:1px solid var(--line); font-size:var(--fs-sm); color:var(--fg-1)">' +
              '<div style="color:var(--fg-0)">' + f.displayName + '</div>' +
              '<div style="font-size:var(--fs-xs); color:var(--fg-3); font-family:var(--font-mono)">' + f.postScriptName + '</div>' +
              '</div>';
    }
    if (filtered.length > 300) {
      html += '<div style="padding:6px 10px; font-size:var(--fs-xs); color:var(--fg-3); text-align:center">... and ' + (filtered.length - 300) + ' more (refine search)</div>';
    }
    host.innerHTML = html;
    host.querySelectorAll(".tc-font-row").forEach(function (row) {
      row.addEventListener("click", function () {
        host.querySelectorAll(".tc-font-row").forEach(function (r) { r.style.background = ""; });
        row.style.background = "var(--primary-soft)";
        replacementFont = row.dataset.ps;
        root.querySelector("#tcSelected").innerHTML = 'Replacement: <strong style="color:var(--primary)">' + replacementFont + '</strong>';
      });
    });
  }

  function loadInstalled() {
    Bridge.call("Fonts.listInstalled", {}).then(function (list) {
      installedFonts = list || [];
      if (!installedFonts.length) {
        OF.toast("Couldn't enumerate installed fonts (older AE?). You can still type a PostScript name manually.", "warn");
      }
      renderInstalled("");
    }).catch(function (e) { OF.toast(e.message, "error"); });
  }


  // Wire up
  root.querySelectorAll("#tcScopeIn .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll("#tcScopeIn .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      scopeIn = s.dataset.v;
      renderInUse();
    });
  });

  root.querySelector("#tcRescan").addEventListener("click", renderInUse);
  root.querySelector("#tcReloadFonts").addEventListener("click", loadInstalled);

  var searchTimer = null;
  root.querySelector("#tcSearch").addEventListener("input", function (e) {
    clearTimeout(searchTimer);
    var v = e.target.value;
    searchTimer = setTimeout(function () { renderInstalled(v); }, 120);
  });

  root.querySelectorAll("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!replacementFont) {
        OF.toast("Pick a replacement font from the installed list first.", "warn");
        return;
      }
      var mode = b.dataset.mode;
      Bridge.call("Fonts.replace", {
        from:  sourceFont || "*",
        to:    replacementFont,
        scope: mode
      })
        .then(function (r) {
          OF.toast("Replaced font on " + r.replaced + " text layer" + (r.replaced !== 1 ? "s" : "") + " (" + r.scope + ")", "success");
          renderInUse();
        })
        .catch(function (e) { OF.toast(e.message, "error"); });
    });
  });

  // Initial loads
  loadInstalled();
  renderInUse();
});
