/**
 * OF.Align - 9-point alignment with two scopes:
 *   scope = "comp" : align each layer to comp bounds
 *   scope = "sel"  : align selected layers to the bounding box of the first selected
 *
 * mode: "left" | "centerH" | "right" | "top" | "centerV" | "bottom" | "distributeH" | "distributeV"
 */
OF.Align = (function () {
    function getBounds(layer) {
        var rect = layer.sourceRectAtTime(layer.time, false);
        var anchor = layer.transform.anchorPoint.value;
        var pos = layer.transform.position.value;
        var scale = layer.transform.scale.value;
        var w = rect.width * scale[0] / 100;
        var h = rect.height * scale[1] / 100;
        var ax = (anchor[0] - rect.left) * scale[0] / 100;
        var ay = (anchor[1] - rect.top) * scale[1] / 100;
        return { left: pos[0] - ax, top: pos[1] - ay, width: w, height: h, pos: pos };
    }

    function setX(layer, newLeft, b) {
        var p = layer.transform.position.value;
        layer.transform.position.setValue([newLeft + (p[0] - b.left), p[1], p[2] || 0]);
    }
    function setY(layer, newTop, b) {
        var p = layer.transform.position.value;
        layer.transform.position.setValue([p[0], newTop + (p[1] - b.top), p[2] || 0]);
    }

    function alignToBox(layers, box, mode) {
        for (var i = 0; i < layers.length; i++) {
            var L = layers[i];
            if (L.locked) continue;
            var b = getBounds(L);
            switch (mode) {
                case "left":    setX(L, box.left, b); break;
                case "centerH": setX(L, box.left + (box.width - b.width) / 2, b); break;
                case "right":   setX(L, box.left + box.width - b.width, b); break;
                case "top":     setY(L, box.top, b); break;
                case "centerV": setY(L, box.top + (box.height - b.height) / 2, b); break;
                case "bottom":  setY(L, box.top + box.height - b.height, b); break;
            }
        }
    }


    function distribute(layers, axis) {
        if (layers.length < 3) return;
        var bounds = [];
        for (var i = 0; i < layers.length; i++) bounds.push({ L: layers[i], b: getBounds(layers[i]) });
        bounds.sort(function (a, b) { return axis === "h" ? a.b.left - b.b.left : a.b.top - b.b.top; });
        var first = bounds[0].b, last = bounds[bounds.length - 1].b;
        var totalSpan, used = 0, gap;
        if (axis === "h") {
            totalSpan = (last.left + last.width) - first.left;
            for (var j = 0; j < bounds.length; j++) used += bounds[j].b.width;
            gap = (totalSpan - used) / (bounds.length - 1);
            var x = first.left + first.width + gap;
            for (var k = 1; k < bounds.length - 1; k++) {
                setX(bounds[k].L, x, bounds[k].b);
                x += bounds[k].b.width + gap;
            }
        } else {
            totalSpan = (last.top + last.height) - first.top;
            for (var jj = 0; jj < bounds.length; jj++) used += bounds[jj].b.height;
            gap = (totalSpan - used) / (bounds.length - 1);
            var y = first.top + first.height + gap;
            for (var kk = 1; kk < bounds.length - 1; kk++) {
                setY(bounds[kk].L, y, bounds[kk].b);
                y += bounds[kk].b.height + gap;
            }
        }
    }

    function run(args) {
        return OF.U.safe("Align " + args.mode, function () {
            var comp = OF.U.activeComp();
            if (!comp) throw new Error("No active composition.");
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select at least one layer.");
            if (args.mode === "distributeH") { distribute(sel, "h"); return { count: sel.length }; }
            if (args.mode === "distributeV") { distribute(sel, "v"); return { count: sel.length }; }
            var box;
            if (args.scope === "comp") {
                box = { left: 0, top: 0, width: comp.width, height: comp.height };
            } else {
                var b0 = getBounds(sel[0]);
                box = { left: b0.left, top: b0.top, width: b0.width, height: b0.height };
                sel = sel.slice(1);
                if (!sel.length) throw new Error("Select 2+ layers in 'sel' mode.");
            }
            alignToBox(sel, box, args.mode);
            return { count: sel.length };
        });
    }
    return { run: run };
})();
