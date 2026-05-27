/**
 * OF.Fonts - Font scanner & replacer for AE.
 *
 * scan({scope})           list of fonts in use
 * listInstalled()         every font installed on this machine
 * replace({to,scope,from})replace fonts; verifies the change actually applied
 *   to:    PostScript name to set
 *   from:  PostScript name to match (or "*" for all)
 *   scope: "selection" | "comp" | "project"
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
            var count = 0;
            eachTextLayer((args && args.scope) || "project", function (L) {
                try {
                    var doc = L.property("Source Text").value;
                    var ps = doc.font || "(unknown)";
                    if (!bag[ps]) bag[ps] = { count: 0, sample: doc.text || "" };
                    bag[ps].count++;
                    count++;
                } catch (e) {}
            });
            var out = [];
            for (var k in bag) {
                if (bag.hasOwnProperty(k)) {
                    out.push({
                        font:           k,
                        postScriptName: k,
                        count:          bag[k].count,
                        sample:         (bag[k].sample || "").substring(0, 40)
                    });
                }
            }
            out.sort(function (a, b) { return b.count - a.count; });
            return out;
        });
    }

    function listInstalled() {
        return OF.U.safeNoUndo(function () {
            var out = [];
            var seen = {};
            // Method 1: app.fonts.allFonts (AE 24.0+ / 2024+)
            try {
                if (app.fonts && app.fonts.allFonts) {
                    var all = app.fonts.allFonts;
                    // allFonts may be an array or array-like FontList
                    var len = all.length || 0;
                    for (var i = 0; i < len; i++) {
                        var f = all[i];
                        if (!f) continue;
                        var ps = "";
                        try { ps = f.postScriptName || ""; } catch (e) { continue; }
                        if (!ps || seen[ps]) continue;
                        seen[ps] = true;
                        var family = "";
                        var style  = "";
                        try { family = f.fontFamily || ""; } catch (e) {}
                        try { style  = f.fontStyle || ""; } catch (e) {}
                        out.push({
                            postScriptName: ps,
                            family:         family,
                            style:          style,
                            displayName:    family + (style ? " " + style : "")
                        });
                    }
                }
            } catch (e) {}

            // Method 2: If allFonts returned nothing, try reading system fonts
            // via Folder on Windows. This is a fallback for older AE versions.
            if (!out.length) {
                try {
                    var fontDir = null;
                    if ($.os.indexOf("Windows") >= 0) {
                        fontDir = new Folder(Folder.system.fsName + "/Fonts");
                    } else {
                        fontDir = new Folder("/Library/Fonts");
                    }
                    if (fontDir && fontDir.exists) {
                        var files = fontDir.getFiles();
                        for (var j = 0; j < files.length; j++) {
                            var ff = files[j];
                            if (!(ff instanceof File)) continue;
                            var nm = ff.name;
                            if (!/\.(ttf|otf|ttc|woff)$/i.test(nm)) continue;
                            var display = nm.replace(/\.(ttf|otf|ttc|woff)$/i, "");
                            if (seen[display]) continue;
                            seen[display] = true;
                            out.push({
                                postScriptName: display,
                                family:         display,
                                style:          "",
                                displayName:    display
                            });
                        }
                    }
                } catch (e) {}
            }

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
            if (!args || !args.to) throw new Error("Replacement font (PostScript name) is required.");
            var fromPS = args.from || "*";
            var toPS   = String(args.to).replace(/^\s+|\s+$/g, "");
            var scope  = args.scope || "project";

            // Find target text layers
            var targets = [];
            eachTextLayer(scope, function (L) {
                try {
                    var doc = L.property("Source Text").value;
                    var current = doc.font;
                    if (fromPS === "*" || current === fromPS) {
                        targets.push({ layer: L, originalFont: current });
                    }
                } catch (e) {}
            });

            if (!targets.length) {
                if (fromPS === "*") {
                    throw new Error("No text layers found in scope '" + scope + "'.");
                }
                throw new Error("No text layers using '" + fromPS + "' found in scope '" + scope + "'.");
            }

            var ok = 0;
            var failures = [];
            for (var i = 0; i < targets.length; i++) {
                var L = targets[i].layer;
                var srcText = L.property("Source Text");
                try {
                    var doc = srcText.value;
                    doc.font = toPS;
                    srcText.setValue(doc);
                    // Verify
                    var afterDoc = srcText.value;
                    if (afterDoc.font === toPS) {
                        ok++;
                    } else {
                        failures.push(L.name + ": AE silently rejected the font (still '" + afterDoc.font + "')");
                    }
                } catch (e) {
                    failures.push(L.name + ": " + e.toString());
                }
            }

            if (!ok) {
                var msg = "Replacement failed on all " + targets.length + " text layer(s).";
                if (failures.length) msg += " First reason: " + failures[0];
                msg += " (Tried setting font to '" + toPS + "')";
                throw new Error(msg);
            }
            return { replaced: ok, failed: failures.length, total: targets.length, scope: scope, to: toPS };
        });
    }

    return {
        scan:          scanFonts,
        listInstalled: listInstalled,
        replace:       replace
    };
})();
