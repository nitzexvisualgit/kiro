/**
 * OF.Fonts - Font scanner & replacer for AE.
 *
 * scanProject()             -> list of fonts in use across project
 * scanComp()                -> same, but only active comp
 * listInstalled()           -> list of every font installed on this machine
 *                              (uses app.fonts.allFonts in CC 2018+, returns []
 *                              on older AE - the UI shows that gracefully)
 * replace({ from, to, scope, onlySelected })
 *   scope: "selection" | "comp" | "project"
 *   from: PostScript name to match, "*" for all fonts in scope
 *   to: PostScript name to set
 */
$.global.OF = $.global.OF || {};
OF = $.global.OF;

OF.Fonts = (function () {

    function listAllComps() {
        var out = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof CompItem) out.push(it);
        }
        return out;
    }

    function eachTextLayer(scope, cb) {
        if (scope === "selection") {
            var sel = OF.U.selectedLayers();
            for (var i = 0; i < sel.length; i++) {
                if (sel[i] instanceof TextLayer) cb(sel[i]);
            }
            return;
        }
        if (scope === "comp") {
            var c = OF.U.activeComp();
            if (!c) throw new Error("No active composition.");
            for (var j = 1; j <= c.numLayers; j++) {
                if (c.layer(j) instanceof TextLayer) cb(c.layer(j));
            }
            return;
        }
        // project
        var comps = listAllComps();
        for (var k = 0; k < comps.length; k++) {
            for (var l = 1; l <= comps[k].numLayers; l++) {
                if (comps[k].layer(l) instanceof TextLayer) cb(comps[k].layer(l));
            }
        }
    }


    function scanFonts(args) {
        return OF.U.safeNoUndo(function () {
            var bag = {};
            eachTextLayer(args.scope || "project", function (L) {
                try {
                    var doc = L.property("Source Text").value;
                    var ps = doc.font || "(unknown)";
                    if (!bag[ps]) bag[ps] = { count: 0, sample: doc.text || "", postScriptName: ps };
                    bag[ps].count++;
                } catch (e) {}
            });
            var out = [];
            for (var k in bag) {
                if (bag.hasOwnProperty(k)) out.push({
                    font:           bag[k].postScriptName,
                    postScriptName: bag[k].postScriptName,
                    count:          bag[k].count,
                    sample:         (bag[k].sample || "").substring(0, 40)
                });
            }
            out.sort(function (a, b) { return b.count - a.count; });
            return out;
        });
    }

    function listInstalled() {
        return OF.U.safeNoUndo(function () {
            var out = [];
            try {
                if (app.fonts && app.fonts.allFonts) {
                    var all = app.fonts.allFonts;
                    var seen = {};
                    for (var i = 0; i < all.length; i++) {
                        var f = all[i];
                        var ps = f.postScriptName || "";
                        if (!ps || seen[ps]) continue;
                        seen[ps] = true;
                        var family = f.fontFamily || "";
                        var style  = f.fontStyle || "";
                        out.push({
                            postScriptName: ps,
                            family:         family,
                            style:          style,
                            displayName:    family + (style ? " - " + style : "")
                        });
                    }
                }
            } catch (e) {}
            // Sort by family name
            out.sort(function (a, b) {
                var fa = (a.family || a.postScriptName).toLowerCase();
                var fb = (b.family || b.postScriptName).toLowerCase();
                return fa < fb ? -1 : fa > fb ? 1 : 0;
            });
            return out;
        });
    }


    function replace(args) {
        return OF.U.safe("Replace Font", function () {
            if (!args || !args.to) throw new Error("Replacement font is required.");
            var fromPS  = args.from || "*";
            var toPS    = args.to;
            var scope   = args.scope || "project";
            var n = 0;
            eachTextLayer(scope, function (L) {
                try {
                    var doc = L.property("Source Text").value;
                    var current = doc.font;
                    if (fromPS === "*" || current === fromPS) {
                        doc.font = toPS;
                        L.property("Source Text").setValue(doc);
                        n++;
                    }
                } catch (e) {}
            });
            if (!n) throw new Error("No matching text layers in the chosen scope.");
            return { replaced: n, scope: scope };
        });
    }

    return {
        scan:          scanFonts,
        listInstalled: listInstalled,
        replace:       replace
    };
})();
