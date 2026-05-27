Router.register("kinetic", function (root) {
  var ANIMATIONS = [
    { id: "slideRight",   name: "Slide Right",    type: "in"   },
    { id: "slideUp",      name: "Slide Up",       type: "in"   },
    { id: "slideDown",    name: "Slide Down",     type: "in"   },
    { id: "scaleUp",      name: "Scale Up",       type: "in"   },
    { id: "scaleDown",    name: "Scale Down",     type: "in"   },
    { id: "bounceIn",     name: "Bounce In",      type: "in"   },
    { id: "rotateIn",     name: "Rotate In",      type: "in"   },
    { id: "blurIn",       name: "Blur In",        type: "in"   },
    { id: "fadeIn",       name: "Fade In",        type: "in"   },
    { id: "fadeOut",      name: "Fade Out",       type: "out"  },
    { id: "slideOutLeft", name: "Slide Out Left", type: "out"  },
    { id: "slideOutRight",name: "Slide Out Right",type: "out"  },
    { id: "scaleOut",     name: "Scale Out",      type: "out"  },
    { id: "float",        name: "Float",          type: "loop" },
    { id: "pulse",        name: "Pulse",          type: "loop" },
    { id: "wiggle",       name: "Wiggle",         type: "loop" },
    { id: "spin",         name: "Spin",           type: "loop" },
    { id: "shake",        name: "Shake",          type: "loop" }
  ];

  root.innerHTML =
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Filter</div>' +
        '<div class="toggle-group" id="kFilter">' +
          '<div class="seg active" data-v="all">All</div>' +
          '<div class="seg" data-v="in">In</div>' +
          '<div class="seg" data-v="out">Out</div>' +
          '<div class="seg" data-v="loop">Loop</div>' +
        '</div>' +
      '</div>' +
      '<input class="input" id="kSearch" placeholder="Search animations...">' +
      '<div id="kList" class="mt-3"></div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Apply Settings</div></div>' +
      '<div class="grid-2">' +
        '<div class="field"><label class="label">Duration (s)</label><input class="input" id="kDur" value="0.6"></div>' +
        '<div class="field"><label class="label">Curve Preset</label>' +
          '<select class="select" id="kCurve">' +
            '<option value="0.16,1,0.3,1">Smooth</option>' +
            '<option value="0.25,0.1,0.25,1">Ease</option>' +
            '<option value="0,0,1,1">Linear</option>' +
            '<option value="0.68,-0.55,0.265,1.55">Back</option>' +
            '<option value="0.6,0.04,0.98,0.335">Circ In</option>' +
            '<option value="0.075,0.82,0.165,1">Circ Out</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div id="kSelected" style="margin-top:var(--s-3); padding:var(--s-3); background:var(--bg-2); border-radius:var(--r-2); font-size:var(--fs-sm); color:var(--fg-3); text-align:center">No animation selected</div>' +
      '<div class="grid-2 mt-2">' +
        '<button class="btn btn-primary" id="kApply">Apply Animation</button>' +
        '<button class="btn btn-soft-danger" id="kRemove">Remove</button>' +
      '</div>' +
    '</div>';


  var filter = "all";
  var search = "";
  var selected = null;

  function render() {
    var host = root.querySelector("#kList");
    host.innerHTML = "";
    var filtered = ANIMATIONS.filter(function (a) {
      if (filter !== "all" && a.type !== filter) return false;
      if (search && a.name.toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
      return true;
    });
    if (!filtered.length) { host.innerHTML = '<div class="empty"><div class="icon">🎬</div>No animations match.</div>'; return; }
    filtered.forEach(function (a) {
      var row = document.createElement("div");
      row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-2); border-radius:var(--r-2); margin-bottom:4px; cursor:pointer; border:1px solid transparent; transition:all 120ms;";
      var icon = a.type === "in" ? "▶" : a.type === "out" ? "◀" : "↻";
      row.innerHTML = '<div style="display:flex; align-items:center; gap:8px"><span style="color:var(--' + (a.type === "in" ? "primary" : a.type === "out" ? "danger" : "info") + ')">' + icon + '</span><span style="color:var(--fg-0); font-size:var(--fs-sm)">' + a.name + '</span></div><span class="pill ' + a.type + '">' + a.type + '</span>';
      row.addEventListener("click", function () {
        host.querySelectorAll("[data-anim]").forEach(function (r) { r.style.borderColor = "transparent"; r.style.background = "var(--bg-2)"; });
        row.style.borderColor = "var(--primary)";
        row.style.background = "var(--primary-soft)";
        selected = a;
        root.querySelector("#kSelected").innerHTML = "Selected: <strong style='color:var(--fg-0)'>" + a.name + "</strong>";
      });
      row.dataset.anim = a.id;
      host.appendChild(row);
    });
  }

  root.querySelectorAll("#kFilter .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll("#kFilter .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      filter = s.dataset.v;
      render();
    });
  });
  root.querySelector("#kSearch").addEventListener("input", function (e) { search = e.target.value; render(); });

  root.querySelector("#kApply").addEventListener("click", function () {
    if (!selected) { OF.toast("Select an animation first", "warn"); return; }
    var curve = root.querySelector("#kCurve").value.split(",").map(parseFloat);
    Bridge.call("Kinetic.apply", {
      id: selected.id,
      target: selected.type,
      dur: parseFloat(root.querySelector("#kDur").value) || 0.6,
      curve: curve
    })
      .then(function (r) { OF.toast("Applied to " + r.count + " layer(s)", "success"); })
      .catch(function (e) { OF.toast(e.message, "error"); });
  });
  root.querySelector("#kRemove").addEventListener("click", function () {
    Bridge.call("Kinetic.remove", {})
      .then(function (r) { OF.toast("Removed from " + r.count + " layer(s)", "success"); })
      .catch(function (e) { OF.toast(e.message, "error"); });
  });

  render();
});
