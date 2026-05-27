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
      '<div class="card-header"><div class="card-title">Replace With</div></div>' +
      '<input class="input" id="tcSearch" placeholder="Search installed fonts...">' +
      '<div id="tcFontList" class="mt-2" style="max-height:240px; overflow-y:auto; background:var(--bg-2); border-radius:var(--r-2); border:1px solid var(--line)"><div class="empty" style="padding:var(--s-3)"><div class="icon">Aa</div>Loading fonts...</div></div>' +
      '<div class="field mt-2">' +
        '<label class="label">Or type font name manually</label>' +
        '<input class="input" id="tcManual" placeholder="e.g. Inter, Futura, Arial">' +
      '</div>' +
      '<div id="tcSelected" style="margin-top:var(--s-2); padding:6px 10px; background:var(--primary-soft); border-radius:var(--r-2); font-size:var(--fs-sm); color:var(--primary); text-align:center; display:none"></div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Apply</div></div>' +
      '<div class="grid-2">' +
        '<button class="btn btn-primary" data-mode="selection">Selected Layers</button>' +
        '<button class="btn btn-primary" data-mode="comp">Active Comp</button>' +
      '</div>' +
      '<button class="btn btn-amber btn-block mt-2" data-mode="project">Whole Project</button>' +
    '</div>';

  var scopeIn = "project";
  var sourceFont = null;
  var replacementFont = "";
  var installedFonts = [];

  function renderInUse() {
    Bridge.call("Fonts.scan", { scope: scopeIn }).then(function (list) {
      var host = root.querySelector("#tcInUseList");
      if (!list || !list.length) { host.className = "empty"; host.innerHTML = '<div class="icon">Aa</div>No text layers found.'; return; }
      host.className = ""; host.innerHTML = "";
      list.forEach(function (f) {
        var row = document.createElement("div");
        row.style.cssText = "padding:8px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px; cursor:pointer; border:1px solid transparent;";
        row.innerHTML = '<div style="color:var(--fg-0); font-size:var(--fs-sm)">' + f.font + '</div><div style="color:var(--fg-3); font-size:var(--fs-xs)">' + f.count + ' layer' + (f.count !== 1 ? 's' : '') + '</div>';
        row.addEventListener("click", function () {
          host.querySelectorAll("div[style]").forEach(function (r) { r.style.borderColor = "transparent"; r.style.background = "var(--bg-2)"; });
          row.style.borderColor = "var(--primary)"; row.style.background = "var(--primary-soft)";
          sourceFont = f.postScriptName;
          OF.toast("Will replace only: " + f.font, "info");
        });
        host.appendChild(row);
      });
    }).catch(function (e) { OF.toast(e.message, "error"); });
  }

  function renderFontList(filter) {
    var host = root.querySelector("#tcFontList");
    var q = (filter || "").toLowerCase();
    var filtered = q ? installedFonts.filter(function (f) { return f.displayName.toLowerCase().indexOf(q) >= 0; }) : installedFonts;
    if (!installedFonts.length) { host.innerHTML = '<div class="empty" style="padding:var(--s-3)"><div class="icon">Aa</div>Could not load font list. Type font name manually below.</div>'; return; }
    if (!filtered.length) { host.innerHTML = '<div class="empty" style="padding:var(--s-3)">No matches</div>'; return; }
    var capped = filtered.slice(0, 200);
    var html = "";
    for (var i = 0; i < capped.length; i++) {
      html += '<div class="tc-row" data-ps="' + capped[i].postScriptName + '" style="padding:5px 10px; cursor:pointer; border-bottom:1px solid var(--line); font-size:var(--fs-sm); color:var(--fg-1)">' + capped[i].displayName + '</div>';
    }
    if (filtered.length > 200) html += '<div style="padding:5px 10px; font-size:var(--fs-xs); color:var(--fg-3); text-align:center">+' + (filtered.length - 200) + ' more (type to filter)</div>';
    host.innerHTML = html;
    host.querySelectorAll(".tc-row").forEach(function (row) {
      row.addEventListener("click", function () {
        host.querySelectorAll(".tc-row").forEach(function (r) { r.style.background = ""; });
        row.style.background = "var(--primary-soft)";
        replacementFont = row.dataset.ps;
        var sel = root.querySelector("#tcSelected");
        sel.style.display = "block";
        sel.textContent = "Selected: " + replacementFont;
      });
    });
  }

  function loadFonts() {
    Bridge.call("Fonts.listInstalled", {}).then(function (list) {
      installedFonts = list || [];
      renderFontList("");
    }).catch(function () { renderFontList(""); });
  }

  // Wire up
  root.querySelectorAll("#tcScopeIn .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll("#tcScopeIn .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active"); scopeIn = s.dataset.v; renderInUse();
    });
  });
  root.querySelector("#tcRescan").addEventListener("click", renderInUse);
  var timer = null;
  root.querySelector("#tcSearch").addEventListener("input", function (e) {
    clearTimeout(timer); var v = e.target.value;
    timer = setTimeout(function () { renderFontList(v); }, 100);
  });

  root.querySelectorAll("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () {
      var manual = (root.querySelector("#tcManual").value || "").replace(/^\s+|\s+$/g, "");
      var target = manual || replacementFont;
      if (!target) { OF.toast("Select a font from the list or type one manually.", "warn"); return; }
      Bridge.call("Fonts.replace", { from: sourceFont || "*", to: target, scope: b.dataset.mode })
        .then(function (r) {
          var msg = "Replaced " + r.replaced + "/" + r.total + " layers";
          if (r.failed) msg += " (" + r.failed + " failed)";
          OF.toast(msg, "success"); renderInUse();
        })
        .catch(function (e) { OF.toast(e.message, "error"); });
    });
  });

  loadFonts();
  renderInUse();
});
