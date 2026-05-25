Router.register("forge", function (root) {
  root.innerHTML =
    // ALIGN
    '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">Align</div>' +
        '<div class="toggle-group" id="alignScope">' +
          '<div class="seg active" data-v="comp">Comp</div>' +
          '<div class="seg" data-v="sel">Sel</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid-3" style="margin-bottom:var(--s-2)">' +
        '<button class="btn" data-align="left">⬅ Left</button>' +
        '<button class="btn" data-align="centerH">↔ Center</button>' +
        '<button class="btn" data-align="right">➡ Right</button>' +
      '</div>' +
      '<div class="grid-3" style="margin-bottom:var(--s-2)">' +
        '<button class="btn" data-align="top">⬆ Top</button>' +
        '<button class="btn" data-align="centerV">↕ Middle</button>' +
        '<button class="btn" data-align="bottom">⬇ Bottom</button>' +
      '</div>' +
      '<div class="grid-2">' +
        '<button class="btn" data-align="distributeH">Distribute H</button>' +
        '<button class="btn" data-align="distributeV">Distribute V</button>' +
      '</div>' +
    '</div>' +

    // ANCHOR
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Anchor Point</div></div>' +
      '<div class="grid-9">' +
        '<div class="gp" data-anchor="tl">↖</div>' +
        '<div class="gp" data-anchor="tc">↑</div>' +
        '<div class="gp" data-anchor="tr">↗</div>' +
        '<div class="gp" data-anchor="ml">←</div>' +
        '<div class="gp" data-anchor="mc">◉</div>' +
        '<div class="gp" data-anchor="mr">→</div>' +
        '<div class="gp" data-anchor="bl">↙</div>' +
        '<div class="gp" data-anchor="bc">↓</div>' +
        '<div class="gp" data-anchor="br">↘</div>' +
      '</div>' +
    '</div>' +

    // PROJECT TOOLS
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Project</div></div>' +
      '<div class="grid-2" style="margin-bottom:var(--s-2)">' +
        '<button class="btn" data-act="organize">Organize Project</button>' +
        '<button class="btn" data-act="precomp">Precomp...</button>' +
      '</div>' +
      '<div class="grid-2">' +
        '<button class="btn btn-soft-amber" data-act="unprecomp">Un-Precomp</button>' +
        '<button class="btn" data-act="resizeComp">Resize Comp</button>' +
      '</div>' +
    '</div>' +


    // PROPERTY CLIPBOARD
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Property Clipboard</div>' +
        '<button class="btn btn-sm btn-soft-danger" data-act="clipClear">Clear All</button>' +
      '</div>' +
      '<div class="slot-row" id="clipSlots">' +
        '<div class="slot active" data-slot="1">1</div>' +
        '<div class="slot" data-slot="2">2</div>' +
        '<div class="slot" data-slot="3">3</div>' +
        '<div class="slot" data-slot="4">4</div>' +
        '<div class="slot" data-slot="5">5</div>' +
      '</div>' +
      '<div class="grid-2 mt-2">' +
        '<button class="btn btn-primary" data-act="clipCopy">Copy</button>' +
        '<button class="btn btn-soft-primary" data-act="clipPaste">Paste</button>' +
      '</div>' +
      '<div class="grid-2 mt-2">' +
        '<button class="btn" data-act="clipDelBefore">Delete Before</button>' +
        '<button class="btn" data-act="clipDelAfter">Delete After</button>' +
      '</div>' +
      '<button class="btn btn-amber btn-block mt-2" data-act="explode">Explode Text</button>' +
    '</div>' +

    // NUMBER COUNTER
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Number Counter</div></div>' +
      '<div class="grid-2">' +
        '<div class="field"><label class="label">Start</label><input class="input" id="ctStart" value="0"></div>' +
        '<div class="field"><label class="label">End</label><input class="input" id="ctEnd" value="100"></div>' +
      '</div>' +
      '<div class="grid-2 mt-2">' +
        '<div class="field"><label class="label">Format</label>' +
          '<select class="select" id="ctFormat">' +
            '<option value="integer">Integer</option>' +
            '<option value="decimal1">1 Decimal</option>' +
            '<option value="decimal2">2 Decimals</option>' +
            '<option value="comma">Comma (1,000)</option>' +
            '<option value="percent">Percent (%)</option>' +
          '</select></div>' +
        '<div class="field"><label class="label">Suffix</label><input class="input" id="ctSuffix" placeholder="e.g. %"></div>' +
      '</div>' +
      '<div class="grid-2 mt-2">' +
        '<div class="field"><label class="label">Prefix</label><input class="input" id="ctPrefix" placeholder="$"></div>' +
        '<div class="field"><label class="label">Pad Digits</label><input class="input" id="ctDigits" value="0"></div>' +
      '</div>' +
      '<button class="btn btn-primary btn-block mt-2" data-act="counter">Create Counter</button>' +
    '</div>' +


    // LAYER CREATION
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Layer Creation &amp; Effects</div></div>' +
      '<div class="grid-3" style="margin-bottom:var(--s-2)">' +
        '<button class="btn" data-layer="solid">Solid</button>' +
        '<button class="btn" data-layer="nullLayer">Null</button>' +
        '<button class="btn" data-layer="camera">Camera</button>' +
      '</div>' +
      '<div class="grid-3" style="margin-bottom:var(--s-2)">' +
        '<button class="btn" data-layer="text">Text</button>' +
        '<button class="btn" data-layer="adjustment">Adjustment</button>' +
        '<button class="btn" data-layer="shape">Shape</button>' +
      '</div>' +
      '<div class="grid-3" style="margin-bottom:var(--s-2)">' +
        '<button class="btn" data-layer="fit">Fit</button>' +
        '<button class="btn" data-layer="glow">Glow</button>' +
        '<button class="btn" data-layer="bounce">Bounce</button>' +
      '</div>' +
      '<div class="grid-3">' +
        '<button class="btn btn-soft-danger" data-layer="removeFx">Remove FX</button>' +
        '<button class="btn" data-layer="trueDup">True Dup</button>' +
        '<button class="btn" data-layer="freezeFrame">Freeze</button>' +
      '</div>' +
      '<button class="btn btn-block mt-2" data-layer="seqLayers">Sequence Layers</button>' +
    '</div>';

  // === Wire-up ===
  var alignScope = "comp";
  root.querySelectorAll("#alignScope .seg").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll("#alignScope .seg").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      alignScope = s.dataset.v;
    });
  });
  root.querySelectorAll("[data-align]").forEach(function (b) {
    b.addEventListener("click", function () {
      Bridge.call("Align.run", { mode: b.dataset.align, scope: alignScope })
        .then(function (r) { OF.toast("Aligned " + r.count + " layer" + (r.count !== 1 ? "s" : ""), "success"); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    });
  });
  root.querySelectorAll("[data-anchor]").forEach(function (b) {
    b.addEventListener("click", function () {
      Bridge.call("Anchor.run", { point: b.dataset.anchor })
        .then(function (r) { OF.toast("Anchor set on " + r.count + " layer" + (r.count !== 1 ? "s" : ""), "success"); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    });
  });


  // Slot selection
  var activeSlot = 1;
  root.querySelectorAll(".slot").forEach(function (s) {
    s.addEventListener("click", function () {
      root.querySelectorAll(".slot").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      activeSlot = parseInt(s.dataset.slot, 10);
    });
  });

  // Layer creation buttons
  root.querySelectorAll("[data-layer]").forEach(function (b) {
    b.addEventListener("click", function () {
      Bridge.call("Layers.run", { op: b.dataset.layer })
        .then(function () { OF.toast(b.textContent + " applied", "success"); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    });
  });

  // Action map
  var actions = {
    organize: function () {
      Bridge.call("Organize.run", {})
        .then(function (r) { OF.toast("Moved " + r.moved + " items into " + r.folders.length + " folders", "success"); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    },

    precomp: function () {
      OF.modal({
        title: "Precompose",
        icon: "📦",
        body:
          '<div class="field" style="margin-bottom:var(--s-3)">' +
            '<label class="label">Mode</label>' +
            '<div class="radio-row">' +
              '<label class="radio"><input type="radio" name="pcmode" value="single" data-field="mode" checked> Single precomp</label>' +
              '<label class="radio"><input type="radio" name="pcmode" value="separate" data-field="mode"> Separate (one each)</label>' +
            '</div>' +
          '</div>' +
          '<div class="field" style="margin-bottom:var(--s-3)">' +
            '<label class="label">Name (single mode)</label>' +
            '<input class="input" data-field="name" placeholder="Auto from first layer">' +
          '</div>' +
          '<label class="check"><input type="checkbox" data-field="trim" checked> Trim duration to layer span</label>' +
          '<label class="check" style="margin-top:6px"><input type="checkbox" data-field="moveAttrs" checked> Move all attributes</label>',
        actions: [{ label: "Cancel", value: false }, { label: "Precompose", primary: true, value: true }]
      }).then(function (r) {
        if (!r.value) return;
        var f = r.fields;
        Bridge.call("Precomp.run", { mode: f.mode, name: f.name, trim: f.trim, moveAttrs: f.moveAttrs })
          .then(function (res) { OF.toast("Created " + res.precomps.length + " precomp(s)", "success"); })
          .catch(function (e) { OF.toast(e.message, "error"); });
      });
    },

    unprecomp: function () {
      Bridge.call("UnPrecomp.run", {})
        .then(function (r) {
          OF.toast("Unpacked " + r.layersUnpacked + " layer(s)", "success");
          if (r.warnings && r.warnings.length) setTimeout(function () { OF.toast(r.warnings[0], "warn"); }, 800);
        })
        .catch(function (e) { OF.toast(e.message, "error"); });
    },


    resizeComp: function () {
      OF.modal({
        title: "Resize Composition",
        body:
          '<div class="grid-2">' +
            '<div class="field"><label class="label">Width</label><input class="input" data-field="w" value="1920"></div>' +
            '<div class="field"><label class="label">Height</label><input class="input" data-field="h" value="1080"></div>' +
          '</div>' +
          '<label class="check mt-2"><input type="checkbox" data-field="scaleLayers" checked> Scale layers proportionally</label>',
        actions: [{ label: "Cancel", value: false }, { label: "Resize", primary: true, value: true }]
      }).then(function (r) {
        if (!r.value) return;
        var f = r.fields;
        Bridge.exec("(function(){var c=app.project.activeItem; if(!(c instanceof CompItem)) return; app.beginUndoGroup('Resize Comp'); var w=" + (parseInt(f.w,10)||1920) + ",h=" + (parseInt(f.h,10)||1080) + ",sx=w/c.width,sy=h/c.height; if(" + (!!f.scaleLayers) + "){for(var i=1;i<=c.numLayers;i++){var L=c.layer(i); var p=L.transform.position.value; L.transform.position.setValue([p[0]*sx,p[1]*sy,p[2]||0]); var s=L.transform.scale.value; L.transform.scale.setValue([s[0]*sx,s[1]*sy,s[2]||100]);}} c.width=w; c.height=h; app.endUndoGroup();})()")
          .then(function () { OF.toast("Comp resized", "success"); });
      });
    },

    clipCopy: function () {
      Bridge.call("Clipboard.run", { action: "copy", slot: activeSlot })
        .then(function (r) {
          OF.toast("Copied " + r.count + " props to slot " + r.slot, "success");
          root.querySelector('.slot[data-slot="' + activeSlot + '"]').classList.add("filled");
        })
        .catch(function (e) { OF.toast(e.message, "error"); });
    },
    clipPaste: function () {
      Bridge.call("Clipboard.run", { action: "paste", slot: activeSlot })
        .then(function (r) { OF.toast("Pasted " + r.pasted + " props from slot " + r.slot, "success"); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    },
    clipDelBefore: function () {
      Bridge.call("Clipboard.run", { action: "deleteBefore" })
        .then(function (r) { OF.toast("Deleted " + r.deleted + " keyframes", "success"); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    },
    clipDelAfter: function () {
      Bridge.call("Clipboard.run", { action: "deleteAfter" })
        .then(function (r) { OF.toast("Deleted " + r.deleted + " keyframes", "success"); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    },
    clipClear: function () {
      Bridge.call("Clipboard.run", { action: "clearAll" }).then(function () {
        root.querySelectorAll(".slot").forEach(function (s) { s.classList.remove("filled"); });
        OF.toast("Clipboard cleared", "success");
      });
    },


    explode: function () {
      OF.modal({
        title: "Explode Text Pro",
        icon: "💥",
        body:
          '<div class="field" style="margin-bottom:var(--s-3)">' +
            '<label class="label">Split Text By</label>' +
            '<div class="radio-row">' +
              '<label class="radio"><input type="radio" name="ex" value="chars" data-field="splitBy"> Chars</label>' +
              '<label class="radio"><input type="radio" name="ex" value="words" data-field="splitBy" checked> Words</label>' +
              '<label class="radio"><input type="radio" name="ex" value="lines" data-field="splitBy"> Lines</label>' +
            '</div>' +
          '</div>' +
          '<div class="field" style="margin-bottom:var(--s-3)">' +
            '<label class="label">Stacking Order (Timeline)</label>' +
            '<select class="select" data-field="stacking">' +
              '<option value="bottomToTop">Bottom to Top</option>' +
              '<option value="topToBottom">Top to Bottom</option>' +
            '</select>' +
          '</div>' +
          '<label class="check"><input type="checkbox" data-field="keepKeyframes" checked> Keep Animations &amp; Keyframes</label>' +
          '<label class="check" style="margin-top:6px"><input type="checkbox" data-field="deleteOriginal" checked> Delete Original Text Layer</label>',
        actions: [{ label: "Cancel", value: false }, { label: "Explode", amber: true, value: true }]
      }).then(function (r) {
        if (!r.value) return;
        var f = r.fields;
        // Radios collected as last-checked; pull explicitly
        var split = root.querySelector('input[name="ex"]:checked'); // root not available, fallback:
        var splitBy = document.querySelector('input[name="ex"]:checked');
        Bridge.call("Explode.run", {
          splitBy: (splitBy && splitBy.value) || "words",
          stacking: f.stacking,
          keepKeyframes: f.keepKeyframes,
          deleteOriginal: f.deleteOriginal
        })
          .then(function (r) { OF.toast("Created " + r.layers + " fragment layers", "success"); })
          .catch(function (e) { OF.toast(e.message, "error"); });
      });
    },

    counter: function () {
      Bridge.call("Counter.run", {
        start: parseFloat(document.getElementById("ctStart").value),
        end:   parseFloat(document.getElementById("ctEnd").value),
        format: document.getElementById("ctFormat").value,
        prefix: document.getElementById("ctPrefix").value,
        suffix: document.getElementById("ctSuffix").value,
        digits: parseInt(document.getElementById("ctDigits").value, 10) || 0,
        duration: 5
      })
        .then(function () { OF.toast("Counter created", "success"); })
        .catch(function (e) { OF.toast(e.message, "error"); });
    }
  };
  root.querySelectorAll("[data-act]").forEach(function (b) {
    b.addEventListener("click", function () { var fn = actions[b.dataset.act]; if (fn) fn(); });
  });

  // Hydrate clipboard slot indicators
  Bridge.call("Clipboard.run", { action: "status" }).then(function (s) {
    for (var i = 1; i <= 5; i++) {
      var el = root.querySelector('.slot[data-slot="' + i + '"]');
      if (el && s[i]) el.classList.add("filled");
    }
  }).catch(function () {});
});
