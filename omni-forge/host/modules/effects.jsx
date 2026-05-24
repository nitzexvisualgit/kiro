/**
 * OF.Effects - Enable/Disable/Remove effects across project, comp, or selection.
 * Also: probe selected layer for an effect's matchName so users can register
 * third-party effects (e.g. Deep Glow, Saber, Optical Flares) by name.
 *
 * scope: "project" | "comp" | "selection"
 * action: "enable" | "disable" | "remove"
 * filter: matchName or display name (or "*" for all). Empty = all.
 */
OF.Effects = (function () {

    function eachLayer(scope, cb) {
        if (scope === "selection") {
            var sel = OF.U.selectedLayers();
            for (var i = 0; i < sel.length; i++) cb(sel[i]);
            return;
        }
        if (scope === "comp") {
            var c = OF.U.activeComp();
            if (!c) throw new Error("No active composition.");
            for (var j = 1; j <= c.numLayers; j++) cb(c.layer(j));
            return;
        }
        // project
        for (var k = 1; k <= app.project.numItems; k++) {
            var it = app.project.item(k);
            if (it instanceof CompItem) for (var l = 1; l <= it.numLayers; l++) cb(it.layer(l));
        }
    }

    function matches(fxProp, filter) {
        if (!filter || filter === "*" || filter === "") return true;
        return fxProp.matchName === filter || fxProp.name === filter;
    }

    function apply(args) {
        return OF.U.safe("FX " + args.action, function () {
            var n = 0;
            eachLayer(args.scope || "selection", function (L) {
                var fx = L.Effects;
                for (var i = fx.numProperties; i >= 1; i--) {
                    var p = fx.property(i);
                    if (!matches(p, args.filter)) continue;
                    try {
                        if (args.action === "enable") { p.enabled = true; n++; }
                        else if (args.action === "disable") { p.enabled = false; n++; }
                        else if (args.action === "remove") { p.remove(); n++; }
                    } catch (e) {}
                }
            });
            return { affected: n };
        });
    }


    function probe() {
        return OF.U.safeNoUndo(function () {
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select a layer with the third-party effect applied.");
            var L = sel[0];
            var fx = L.Effects;
            if (fx.numProperties === 0) throw new Error("No effects on selected layer.");
            // Return the LAST applied effect (typically the user-applied one)
            var p = fx.property(fx.numProperties);
            return { name: p.name, matchName: p.matchName };
        });
    }

    function inventory(args) {
        return OF.U.safeNoUndo(function () {
            var bag = {};
            eachLayer(args.scope || "comp", function (L) {
                var fx = L.Effects;
                for (var i = 1; i <= fx.numProperties; i++) {
                    var p = fx.property(i);
                    var key = p.matchName + "::" + p.name;
                    if (!bag[key]) bag[key] = { matchName: p.matchName, name: p.name, count: 0 };
                    bag[key].count++;
                }
            });
            var out = [];
            for (var k in bag) out.push(bag[k]);
            out.sort(function (a, b) { return b.count - a.count; });
            return out;
        });
    }

    return { apply: apply, probe: probe, inventory: inventory };
})();
