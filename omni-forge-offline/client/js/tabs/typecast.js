Router.register("typecast", function (root) {
  root.innerHTML =
    '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">Fonts In Project</div>' +
        '<button class="btn btn-sm" id="tcRefresh">↻ Refresh</button>' +
      '</div>' +
      '<div id="tcList" class="empty"><div class="icon">Aa</div>Click Refresh to scan fonts.</div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Replacement</div></div>' +
      '<div class="field"><label class="label">Replace With (font family name)</label>' +
        '<input class="input" id="tcReplace" placeholder="e.g. Inter, Helvetica Neue, Futura">' +
      '</div>' +
      '<div class="field mt-2"><label class="label">Scope</label>' +
        '<div class="toggle-group" id="tcScope">' +
          '<div class="seg active" data-v="project">Project</div>' +
          '<div class="seg" data-v="comp">Active Comp</div>' +
        '</div>' +
      '</div>' +
      '<label class="check mt-2"><input type="checkbox" id="tcOnlySel"> Only selected layers</label>' +
      '<button class="btn btn-primary btn-block mt-3" id="tcApply">Replace Selected Font</button>' +
    '</div>';

  var selectedFrom = null;
  var scope = "project";

  function refresh() {
    Bridge.call("Fonts.scan", { scope: scope }).then(function (list) {
      var host = root.querySelector("#tcList");
      if (!list || !list.length) {
        host.className = "empty";
        host.innerHTML = '<div class="icon">Aa</div>No text layers found in scope.';
        return;
      }
      host.className = "";
      host.innerHTML = "";
      list.forEach(function (f) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px; cursor:pointer; border:1px solid transparent;";
        row.innerHTML = '<div><div style="font-size:var(--fs-sm); color:var(--fg-0)">' + f.font + '</div><div style="font-size:var(--fs-xs); color:var(--fg-3)">' + f.count + ' layer' + (f.count !== 1 ? 's' : '') + '</div></div>' +
                        '<span class="pill">' + (f.sample ? '"' + f.sample.substring(0, 14) + '"' : '') + '</span>';
        row.addEventListener("click", function () {
          host.querySelectorAll("[data-from]").forEach(function (r) { r.style.borderColor = "transparent"; r.style.background = "var(--bg-2)"; });
          row.style.borderColor = "var(--primary)";
          row.style.background = "var(--primary-soft)";
          selectedFrom = f.font;
        });
        row.dataset.from = f.font;
        host.appendChild(row);
      });
    }).catch(function (e) { OF.toast(e.message, "error"); });
  }


  root.querySelector("#tcRefresh").addEventListener("click", refresh);
  root.querySelectorAll("#tcScope .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll("#tcScope .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      scope = s.dataset.v;
    });
  });
  root.querySelector("#tcApply").addEventListener("click", function () {
    var to = root.querySelector("#tcReplace").value.trim();
    if (!to) { OF.toast("Enter a replacement font.", "warn"); return; }
    if (!selectedFrom) { OF.toast("Select a source font from the list (or it will replace all).", "warn"); }
    Bridge.call("Fonts.replace", {
      from: selectedFrom || "*",
      to: to,
      scope: scope,
      onlySelected: root.querySelector("#tcOnlySel").checked
    })
      .then(function (r) { OF.toast("Replaced " + r.replaced + " text layers", "success"); refresh(); })
      .catch(function (e) { OF.toast(e.message, "error"); });
  });

  refresh();
});
