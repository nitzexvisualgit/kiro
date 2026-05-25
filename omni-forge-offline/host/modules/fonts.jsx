/**
 * OF.Fonts - Project-wide font scanner & replacer.
 *
 * scan({ scope: "comp"|"project" }) -> list of { font, count, sample, layers:[{compId,layerIdx}] }
 * replace({ from, to, scope, onlySelected }) -> { replaced }
 */
OF.Fonts = (function () {

    function listAllComps() {
        var out = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof CompItem) out.push(it);
        }
        return out;
    }

    function scanComp(comp, bag) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var L = comp.layer(i);
            if (!(L instanceof TextLayer)) continue;
            try {
                var doc = L.property("Source Text").value;
                var f = doc.font;
                if (!bag[f]) bag[f] = { count: 0, sample: doc.text || "", layers: [] };
                bag[f].count++;
                bag[f].layers.push({ comp: comp.id, idx: L.index, name: L.name });
            } catch (e) {}
        }
    }

    function scan(args) {
        return OF.U.safeNoUndo(function () {
            var bag = {};
            var scope = args.scope || "project";
            var comps = scope === "comp" ? [OF.U.activeComp()] : listAllComps();
            for (var i = 0; i < comps.length; i++) if (comps[i]) scanComp(comps[i], bag);
            var out = [];
            for (var f in bag) out.push({ font: f, count: bag[f].count, sample: bag[f].sample });
            out.sort(function (a, b) { return b.count - a.count; });
            return out;
        });
    }


    function replaceInComp(comp, from, to, onlySelected) {
        var n = 0;
        var selected = {};
        if (onlySelected) {
            var sel = comp.selectedLayers;
            for (var s = 0; s < sel.length; s++) selected[sel[s].index] = true;
        }
        for (var i = 1; i <= comp.numLayers; i++) {
            var L = comp.layer(i);
            if (!(L instanceof TextLayer)) continue;
            if (onlySelected && !selected[L.index]) continue;
            try {
                var doc = L.property("Source Text").value;
                if (from === "*" || doc.font === from) {
                    doc.font = to;
                    L.property("Source Text").setValue(doc);
                    n++;
                }
            } catch (e) {}
        }
        return n;
    }

    function replace(args) {
        return OF.U.safe("Replace Font", function () {
            if (!args.to) throw new Error("Replacement font is required.");
            var scope = args.scope || "project";
            var comps = scope === "comp" ? [OF.U.activeComp()] : listAllComps();
            var n = 0;
            for (var i = 0; i < comps.length; i++) {
                if (comps[i]) n += replaceInComp(comps[i], args.from || "*", args.to, !!args.onlySelected);
            }
            return { replaced: n };
        });
    }

    return { scan: scan, replace: replace };
})();
