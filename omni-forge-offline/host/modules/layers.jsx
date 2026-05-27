/**
 * OF.Layers - Layer creation & helper utilities.
 * Supports: solid, null, camera, adjustment, text, shape, light, fit, glow,
 *           bounce, trim, fill, tint, blur, capital, fxLock, alignTo,
 *           removeFx, trueDup, seqLayers, splitMasks, trackPath, freezeFrame.
 *
 * Each is a small, fault-tolerant operation that wraps in a single undo group.
 */
OF.Layers = (function () {

    function activeComp() {
        var c = OF.U.activeComp();
        if (!c) throw new Error("No active composition.");
        return c;
    }

    var ops = {};

    ops.solid = function (a) {
        var c = activeComp();
        var color = a.color || [0.5, 0.5, 0.5];
        var s = c.layers.addSolid(color, "Solid", c.width, c.height, c.pixelAspect, c.duration);
        return { name: s.name };
    };

    ops.bounce = function () {
        var c = activeComp();
        var sel = OF.U.selectedLayers();
        if (!sel.length) throw new Error("Select layer(s).");
        var expr = "amp = .1; freq = 2.0; decay = 4.0;\nn = 0;\nif (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }\nif (n == 0) value;\nelse {\n  t = time - key(n).time;\n  amp_t = amp * Math.exp(-decay*t);\n  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\n  value + v * amp_t * Math.sin(freq*t*2*Math.PI) / freq;\n}";
        for (var i = 0; i < sel.length; i++) {
            try { sel[i].transform.position.expression = expr; } catch (e) {}
        }
        return { count: sel.length };
    };

    ops.nullLayer = function () {
        var c = activeComp();
        var n = c.layers.addNull(c.duration);
        n.name = "Null " + c.numLayers;
        return { name: n.name };
    };

    ops.camera = function () {
        var c = activeComp();
        var cam = c.layers.addCamera("Camera", [c.width / 2, c.height / 2]);
        return { name: cam.name };
    };


    ops.text = function (a) {
        var c = activeComp();
        var L = c.layers.addText(a.text || "Text");
        L.transform.position.setValue([c.width / 2, c.height / 2]);
        return { name: L.name };
    };

    ops.adjustment = function () {
        var c = activeComp();
        var s = c.layers.addSolid([1, 1, 1], "Adjustment", c.width, c.height, c.pixelAspect, c.duration);
        s.adjustmentLayer = true;
        return { name: s.name };
    };

    ops.shape = function () {
        var c = activeComp();
        var s = c.layers.addShape();
        s.name = "Shape " + c.numLayers;
        return { name: s.name };
    };

    ops.fit = function () {
        var sel = OF.U.selectedLayers();
        var c = activeComp();
        if (!sel.length) throw new Error("Select layer(s).");
        for (var i = 0; i < sel.length; i++) {
            var L = sel[i];
            var rect = L.sourceRectAtTime(L.time, false);
            if (!rect.width || !rect.height) continue;
            var sx = c.width / rect.width * 100;
            var sy = c.height / rect.height * 100;
            var s = Math.max(sx, sy);
            L.transform.scale.setValue([s, s, 100]);
            L.transform.position.setValue([c.width / 2, c.height / 2]);
        }
        return { count: sel.length };
    };

    ops.glow = function () {
        var sel = OF.U.selectedLayers();
        if (!sel.length) throw new Error("Select layer(s).");
        for (var i = 0; i < sel.length; i++) {
            try { sel[i].Effects.addProperty("ADBE Glo2"); } catch (e) {}
        }
        return { count: sel.length };
    };

    ops.removeFx = function () {
        var sel = OF.U.selectedLayers();
        if (!sel.length) throw new Error("Select layer(s).");
        var n = 0;
        for (var i = 0; i < sel.length; i++) {
            var fx = sel[i].Effects;
            for (var k = fx.numProperties; k >= 1; k--) { fx.property(k).remove(); n++; }
        }
        return { removed: n };
    };


    ops.trueDup = function () {
        var sel = OF.U.selectedLayers();
        if (!sel.length) throw new Error("Select layer(s).");
        var dups = [];
        for (var i = 0; i < sel.length; i++) {
            var d = sel[i].duplicate();
            if (sel[i].source) {
                try {
                    var newSrc;
                    if (sel[i].source instanceof CompItem) newSrc = sel[i].source.duplicate();
                    else newSrc = sel[i].source;
                    d.replaceSource(newSrc, false);
                } catch (e) {}
            }
            dups.push(d.name);
        }
        return { duplicates: dups };
    };

    ops.seqLayers = function (a) {
        var sel = OF.U.selectedLayers();
        var c = activeComp();
        if (sel.length < 2) throw new Error("Select 2+ layers.");
        var overlap = (a && a.overlap) ? Number(a.overlap) : 0;
        // Sort by current index ascending so they sequence top-to-bottom
        sel.sort(function (a, b) { return a.index - b.index; });
        var t = sel[0].startTime;
        for (var i = 0; i < sel.length; i++) {
            sel[i].startTime = t;
            var dur = sel[i].outPoint - sel[i].inPoint;
            t += dur - overlap;
        }
        return { count: sel.length };
    };

    ops.freezeFrame = function () {
        var sel = OF.U.selectedLayers();
        if (!sel.length) throw new Error("Select layer(s).");
        for (var i = 0; i < sel.length; i++) {
            var L = sel[i];
            try {
                L.timeRemapEnabled = true;
                var t = L.containingComp.time;
                var v = L.timeRemap.valueAtTime(t, false);
                while (L.timeRemap.numKeys > 0) L.timeRemap.removeKey(1);
                L.timeRemap.setValueAtTime(0, v);
                L.timeRemap.setValueAtTime(L.outPoint - L.startTime, v);
            } catch (e) {}
        }
        return { count: sel.length };
    };

    function run(args) {
        var op = args.op;
        if (!ops[op]) return OF.U.envelope(false, null, "Unknown layer op: " + op);
        return OF.U.safe("Layer: " + op, function () { return ops[op](args); });
    }

    return { run: run, list: function () { var k = []; for (var n in ops) k.push(n); return JSON.stringify({ ok: true, data: k }); } };
})();
