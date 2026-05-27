/**
 * OF.Precomp - Advanced precompose.
 *   args.mode = "single"    : one precomp containing all selected layers
 *   args.mode = "separate"  : each selected layer wrapped in its own precomp
 *   args.trim = true        : trim each precomp duration to layer in/out span
 *   args.moveAttrs = true   : standard "move all attributes" (recommended)
 *   args.name (optional)    : base name for single mode
 */
OF.Precomp = (function () {
    function precomposeOne(comp, layerIndices, name, moveAttrs) {
        // ExtendScript precompose: comp.layers.precompose(arrIndices, name, moveAllAttributes?)
        // moveAllAttributes only works when there's exactly one layer; for multi we always move.
        var pre = comp.layers.precompose(layerIndices, name, !!moveAttrs);
        // The new comp item is returned in AE 17+. For older AE we hunt for it.
        if (pre instanceof CompItem) return pre;
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof CompItem && it.name === name) return it;
        }
        return null;
    }

    function trimPrecompToLayer(precompLayer, precompItem) {
        // Find original timing from the precomp layer in parent comp
        var inPoint = precompLayer.inPoint;
        var outPoint = precompLayer.outPoint;
        var startTime = precompLayer.startTime;
        var dur = outPoint - inPoint;
        if (dur <= 0) return;

        // Adjust child comp duration
        precompItem.duration = dur;
        // Shift internal layers so visible content starts at 0
        var offset = inPoint - startTime;
        for (var i = 1; i <= precompItem.numLayers; i++) {
            var L = precompItem.layer(i);
            try { L.startTime -= offset; } catch (e) {}
        }
        // Reset parent precomp layer's startTime/inPoint so it sits at original position
        precompLayer.startTime = inPoint;
        precompLayer.inPoint = inPoint;
        precompLayer.outPoint = outPoint;
    }


    function uniqueName(base) {
        var n = base, i = 1;
        var taken = {};
        for (var k = 1; k <= app.project.numItems; k++) taken[app.project.item(k).name] = true;
        while (taken[n]) { n = base + " " + (++i); }
        return n;
    }

    function run(args) {
        return OF.U.safe("Precompose", function () {
            var comp = OF.U.activeComp();
            if (!comp) throw new Error("No active composition.");
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select at least one layer.");

            var mode = args.mode || (sel.length === 1 ? "single" : "single");
            var trim = !!args.trim;
            var moveAttrs = (args.moveAttrs !== false);
            var baseName = args.name || (sel[0].name + " Comp");
            var results = [];

            if (mode === "single") {
                var indices = [];
                for (var i = 0; i < sel.length; i++) indices.push(sel[i].index);
                indices.sort(function (a, b) { return a - b; });
                var name = uniqueName(baseName);
                var pre = precomposeOne(comp, indices, name, sel.length === 1 && moveAttrs);
                if (!pre) throw new Error("Precompose failed.");
                if (trim) {
                    var newLayer = null;
                    for (var l = 1; l <= comp.numLayers; l++) if (comp.layer(l).source === pre) { newLayer = comp.layer(l); break; }
                    if (newLayer) trimPrecompToLayer(newLayer, pre);
                }
                results.push({ name: pre.name, duration: pre.duration });
            } else {
                // Separate: process from highest index to lowest so indices stay valid
                var snapshots = [];
                for (var s = 0; s < sel.length; s++) snapshots.push({ idx: sel[s].index, name: sel[s].name });
                snapshots.sort(function (a, b) { return b.idx - a.idx; });
                for (var t = 0; t < snapshots.length; t++) {
                    var nm = uniqueName(snapshots[t].name + " Comp");
                    var p = precomposeOne(comp, [snapshots[t].idx], nm, moveAttrs);
                    if (p && trim) {
                        var nl = null;
                        for (var ll = 1; ll <= comp.numLayers; ll++) if (comp.layer(ll).source === p) { nl = comp.layer(ll); break; }
                        if (nl) trimPrecompToLayer(nl, p);
                    }
                    if (p) results.push({ name: p.name, duration: p.duration });
                }
            }
            return { precomps: results };
        });
    }
    return { run: run };
})();
