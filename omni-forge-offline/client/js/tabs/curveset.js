Router.register("curveset", function (root) {
  // 32 cubic-bezier presets covering AE/CSS standards
  var PRESETS = [
    ["linear",    [0,0,1,1]],         ["easeIn",     [0.42,0,1,1]],     ["easeOut",   [0,0,0.58,1]],     ["ease",      [0.25,0.1,0.25,1]],
    ["sineIn",    [0.47,0,0.745,0.715]],["sineOut",  [0.39,0.575,0.565,1]],["sine",    [0.445,0.05,0.55,0.95]],["quadIn",  [0.55,0.085,0.68,0.53]],
    ["quadOut",   [0.25,0.46,0.45,0.94]],["quad",    [0.455,0.03,0.515,0.955]],["cubicIn",[0.55,0.055,0.675,0.19]],["cubicOut",[0.215,0.61,0.355,1]],
    ["cubic",     [0.645,0.045,0.355,1]],["quartIn", [0.895,0.03,0.685,0.22]],["quartOut",[0.165,0.84,0.44,1]],["quart",    [0.77,0,0.175,1]],
    ["quintIn",   [0.755,0.05,0.855,0.06]],["quintOut",[0.23,1,0.32,1]],["quint",  [0.86,0,0.07,1]],     ["expoIn",   [0.95,0.05,0.795,0.035]],
    ["expoOut",   [0.19,1,0.22,1]],   ["expo",       [1,0,0,1]],         ["circIn",    [0.6,0.04,0.98,0.335]],["circOut", [0.075,0.82,0.165,1]],
    ["circ",      [0.785,0.135,0.15,0.86]],["backIn",[0.6,-0.28,0.735,0.045]],["backOut",[0.175,0.885,0.32,1.275]],["back",  [0.68,-0.55,0.265,1.55]],
    ["smoothIn",  [0.4,0,1,1]],       ["smoothOut",  [0,0,0.6,1]],       ["smooth",    [0.4,0,0.6,1]],   ["snap",      [0.7,0,0.3,1]]
  ];

  var curve = [0.25, 0.1, 0.25, 1];
  var side = "both";

  root.innerHTML =
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Curveset Editor</div></div>' +
      '<div class="bezier-wrap">' +
        '<canvas class="bezier-canvas" id="bzCanvas" width="400" height="400"></canvas>' +
      '</div>' +
      '<div class="row-between mt-3">' +
        '<div class="toggle-group" id="bzSide">' +
          '<div class="seg" data-v="in">In</div>' +
          '<div class="seg active" data-v="both">Both</div>' +
          '<div class="seg" data-v="out">Out</div>' +
        '</div>' +
        '<div id="bzVals" style="font-family:var(--font-mono); font-size:var(--fs-xs); color:var(--fg-2)"></div>' +
      '</div>' +
      '<button class="btn btn-primary btn-block mt-3" id="bzApply">Apply Easing</button>' +
      '<div class="grid-3 mt-2">' +
        '<button class="btn btn-sm" id="bzCopyCSS">Copy CSS</button>' +
        '<button class="btn btn-sm" id="bzSavePreset">Save Preset</button>' +
        '<button class="btn btn-sm btn-soft-danger" id="bzReset">Reset</button>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Presets</div></div>' +
      '<div class="preset-grid" id="bzPresets"></div>' +
    '</div>';


  var canvas = root.querySelector("#bzCanvas");
  var ctx = canvas.getContext("2d");

  // Match canvas internal size to its CSS pixel size for crisp drawing
  function fitCanvas() {
    var r = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    fitCanvas();
    var w = canvas.getBoundingClientRect().width;
    var h = canvas.getBoundingClientRect().height;
    var pad = 24;
    var x0 = pad, y0 = h - pad;
    var x1 = w - pad, y1 = pad;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (var i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x0 + (x1 - x0) * (i / 4), y0);
      ctx.lineTo(x0 + (x1 - x0) * (i / 4), y1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x0, y0 + (y1 - y0) * (i / 4));
      ctx.lineTo(x1, y0 + (y1 - y0) * (i / 4));
      ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke();

    // Bezier curve
    var p1x = x0 + (x1 - x0) * curve[0];
    var p1y = y0 + (y1 - y0) * curve[1];
    var p2x = x0 + (x1 - x0) * curve[2];
    var p2y = y0 + (y1 - y0) * curve[3];

    // Handles
    ctx.strokeStyle = "rgba(163,230,53,0.35)";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(p1x, p1y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(p2x, p2y); ctx.stroke();

    // Curve
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(p1x, p1y, p2x, p2y, x1, y1);
    ctx.stroke();

    // Endpoints
    drawHandle(x0, y0, "#a3e635");
    drawHandle(x1, y1, "#a3e635");
    drawHandle(p1x, p1y, "#a3e635", true);
    drawHandle(p2x, p2y, "#a3e635", true);

    // Update value display
    root.querySelector("#bzVals").textContent =
      curve[0].toFixed(2) + ", " + curve[1].toFixed(2) + ", " + curve[2].toFixed(2) + ", " + curve[3].toFixed(2);
  }


  function drawHandle(x, y, color, hollow) {
    ctx.fillStyle = hollow ? "#0a0a0a" : color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    if (hollow) { ctx.fill(); ctx.stroke(); } else { ctx.fill(); }
  }

  // Drag handles
  var dragging = null;
  function pickHandle(mx, my) {
    var w = canvas.getBoundingClientRect().width;
    var h = canvas.getBoundingClientRect().height;
    var pad = 24;
    var x0 = pad, y0 = h - pad, x1 = w - pad, y1 = pad;
    var p1x = x0 + (x1 - x0) * curve[0], p1y = y0 + (y1 - y0) * curve[1];
    var p2x = x0 + (x1 - x0) * curve[2], p2y = y0 + (y1 - y0) * curve[3];
    if (Math.hypot(mx - p1x, my - p1y) < 14) return 1;
    if (Math.hypot(mx - p2x, my - p2y) < 14) return 2;
    return null;
  }
  function setHandleFromMouse(idx, mx, my) {
    var w = canvas.getBoundingClientRect().width;
    var h = canvas.getBoundingClientRect().height;
    var pad = 24;
    var x0 = pad, y0 = h - pad, x1 = w - pad, y1 = pad;
    var nx = (mx - x0) / (x1 - x0);
    var ny = (my - y0) / (y1 - y0);
    if (idx === 1) { curve[0] = Math.max(0, Math.min(1, nx)); curve[1] = ny; }
    else { curve[2] = Math.max(0, Math.min(1, nx)); curve[3] = ny; }
    draw();
  }
  canvas.addEventListener("mousedown", function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    dragging = pickHandle(mx, my);
  });
  window.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    var rect = canvas.getBoundingClientRect();
    setHandleFromMouse(dragging, e.clientX - rect.left, e.clientY - rect.top);
  });
  window.addEventListener("mouseup", function () { dragging = null; });

  // Side toggle
  root.querySelectorAll("#bzSide .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll("#bzSide .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      side = s.dataset.v;
    });
  });

  // Apply
  root.querySelector("#bzApply").addEventListener("click", function () {
    Bridge.call("Easing.run", { curve: curve, side: side })
      .then(function (r) { OF.toast("Eased " + r.pairs + " keyframe pair" + (r.pairs !== 1 ? "s" : "") + " across " + r.properties + " propert" + (r.properties !== 1 ? "ies" : "y"), "success"); })
      .catch(function (e) { OF.toast(e.message, "error"); });
  });


  // Copy CSS / Save / Reset
  root.querySelector("#bzCopyCSS").addEventListener("click", function () {
    var s = "cubic-bezier(" + curve.map(function (v) { return v.toFixed(3); }).join(", ") + ")";
    if (navigator.clipboard) navigator.clipboard.writeText(s);
    OF.toast("Copied: " + s, "success");
  });
  root.querySelector("#bzReset").addEventListener("click", function () {
    curve = [0, 0, 1, 1]; draw(); OF.toast("Reset to linear", "info");
  });
  root.querySelector("#bzSavePreset").addEventListener("click", function () {
    OF.modal({
      title: "Save Curve Preset",
      body: '<div class="field"><label class="label">Name</label><input class="input" data-field="name" placeholder="My Curve"></div>',
      actions: [{ label: "Cancel", value: false }, { label: "Save", primary: true, value: true }]
    }).then(function (r) {
      if (!r.value || !r.fields.name) return;
      Bridge.call("Vault.saveExpression", {
        name: r.fields.name,
        property: "Curve",
        code: "// cubic-bezier(" + curve.join(",") + ")"
      }).then(function () { OF.toast("Saved preset", "success"); }).catch(function (e) { OF.toast(e.message, "error"); });
    });
  });

  // Render preset grid
  function makeMiniSvg(c) {
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 100 C ' + (c[0]*100) + ' ' + (100 - c[1]*100) + ', ' + (c[2]*100) + ' ' + (100 - c[3]*100) + ', 100 0"/></svg>';
  }
  var grid = root.querySelector("#bzPresets");
  PRESETS.forEach(function (p) {
    var d = document.createElement("div");
    d.className = "preset";
    d.innerHTML = makeMiniSvg(p[1]) + '<div class="nm">' + p[0] + '</div>';
    d.addEventListener("click", function () {
      grid.querySelectorAll(".preset").forEach(function (x) { x.classList.remove("active"); });
      d.classList.add("active");
      curve = p[1].slice();
      draw();
    });
    grid.appendChild(d);
  });

  // Initial draw - wait for layout
  requestAnimationFrame(draw);
  window.addEventListener("resize", draw);
});
