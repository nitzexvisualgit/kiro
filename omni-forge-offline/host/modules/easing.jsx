/**
 * OF.Easing - Cubic-bezier easing applied between consecutive keyframes,
 *             Flow / JerryFlow style.
 *
 * Walk strategy (most permissive first, so users don't have to think
 * about WHAT to select):
 *   1. comp.selectedProperties (user clicked a property name or selected keys)
 *   2. Every property (recursively) of every selected layer
 *   3. Every property of every layer in active comp (last resort)
 *
 * For each selected property: if 2+ keys are selected use those, else use ALL keys.
 *
 * Returns {pairs, properties, errors[]} so the panel can show real reasons
 * if nothing eased.
 */
$.global.OF = $.global.OF || {};
OF = $.global.OF;



OF.Easing = (function () {

    function getDim(prop) {
        try {
            var v = prop.value;
            if (typeof v === "number") return 1;
            if (v && v.length) return v.length;
        } catch (e) {}
        return 1;
    }

    function getKeyValueAsArray(prop, idx, dim) {
        var v = prop.keyValue(idx);
        if (typeof v === "number") return [v];
        var out = [];
        for (var i = 0; i < dim; i++) out.push(v[i]);
        return out;
    }

    function applyBetween(prop, kA, kB, curve, side) {
        var dim = getDim(prop);
        var tA = prop.keyTime(kA), tB = prop.keyTime(kB);
        var dt = tB - tA;
        if (dt <= 0.0001) {
            throw new Error("Keyframes are at the same time");
        }
        var vA = getKeyValueAsArray(prop, kA, dim);
        var vB = getKeyValueAsArray(prop, kB, dim);

        var x1 = curve[0], y1 = curve[1], x2 = curve[2], y2 = curve[3];
        var slopeStart = (x1 > 0.0001) ? (y1 / x1) : 0;
        var slopeEnd   = (x2 < 0.9999) ? ((1 - y2) / (1 - x2)) : 0;
        var infOut = Math.max(0.1, Math.min(100, x1 * 100));
        var infIn  = Math.max(0.1, Math.min(100, (1 - x2) * 100));

        var outArr = [], inArr = [];
        for (var d = 0; d < dim; d++) {
            var avgSpeed = (vB[d] - vA[d]) / dt;
            outArr.push(new KeyframeEase(avgSpeed * slopeStart, infOut));
            inArr.push(new KeyframeEase(avgSpeed * slopeEnd, infIn));
        }

        var existingInA  = prop.keyInTemporalEase(kA);
        var existingOutB = prop.keyOutTemporalEase(kB);

        if (side === "out" || side === "both") {
            prop.setTemporalEaseAtKey(kA, existingInA, outArr);
        }
        if (side === "in" || side === "both") {
            prop.setTemporalEaseAtKey(kB, inArr, existingOutB);
        }
        try {
            prop.setInterpolationTypeAtKey(kA, prop.keyInInterpolationType(kA), KeyframeInterpolationType.BEZIER);
            prop.setInterpolationTypeAtKey(kB, KeyframeInterpolationType.BEZIER, prop.keyOutInterpolationType(kB));
        } catch (e) {}
        return true;
    }



    function tryAddTarget(prop, targets, seen) {
        if (!prop || prop.propertyType !== PropertyType.PROPERTY) return;
        if (!prop.canVaryOverTime || prop.numKeys < 2) return;
        var key = "";
        try { key = prop.parentProperty.matchName + "::" + prop.matchName + "::" + prop.propertyIndex; } catch (e) { key = String(Math.random()); }
        if (seen[key]) return;
        seen[key] = true;
        var keys = [];
        try {
            if (prop.selectedKeys && prop.selectedKeys.length >= 2) {
                for (var s = 0; s < prop.selectedKeys.length; s++) keys.push(prop.selectedKeys[s]);
            }
        } catch (e) {}
        if (keys.length < 2) {
            for (var k = 1; k <= prop.numKeys; k++) keys.push(k);
        }
        keys.sort(function (a, b) { return a - b; });
        targets.push({ prop: prop, keys: keys });
    }

    function walkLayerProps(layer, cb) {
        function walk(group) {
            var n = 0;
            try { n = group.numProperties; } catch (e) { return; }
            for (var i = 1; i <= n; i++) {
                var p;
                try { p = group.property(i); } catch (e) { continue; }
                if (!p) continue;
                if (p.propertyType === PropertyType.PROPERTY) cb(p);
                else if (p.propertyType === PropertyType.NAMED_GROUP || p.propertyType === PropertyType.INDEXED_GROUP) walk(p);
            }
        }
        walk(layer);
    }

    function findTargets() {
        var comp = OF.U.activeComp();
        if (!comp) throw new Error("No active composition.");
        var targets = [];
        var seen = {};

        // Level 1: explicitly selected properties (user selected keys/property)
        var sel = comp.selectedProperties || [];
        for (var i = 0; i < sel.length; i++) tryAddTarget(sel[i], targets, seen);

        // Level 2: walk every property of every selected layer
        if (!targets.length) {
            var layers = OF.U.selectedLayers();
            for (var li = 0; li < layers.length; li++) {
                walkLayerProps(layers[li], function (p) { tryAddTarget(p, targets, seen); });
            }
        }
        return targets;
    }



    function run(args) {
        return OF.U.safe("Apply Easing", function () {
            var curve = args.curve || [0.25, 0.1, 0.25, 1];
            var side  = args.side || "both";
            var targets = findTargets();
            if (!targets.length) {
                throw new Error("Select an animated property (or select 2+ keyframes, or select a layer with animation).");
            }

            var pairsEased = 0, propsTouched = 0;
            var errors = [];

            for (var t = 0; t < targets.length; t++) {
                var prop = targets[t].prop;
                var keys = targets[t].keys;
                var anyOk = false;
                for (var i = 0; i < keys.length - 1; i++) {
                    try {
                        if (applyBetween(prop, keys[i], keys[i + 1], curve, side)) {
                            pairsEased++;
                            anyOk = true;
                        }
                    } catch (err) {
                        errors.push(prop.name + " keys " + keys[i] + "-" + keys[i+1] + ": " + (err.message || err.toString()));
                    }
                }
                if (anyOk) propsTouched++;
            }

            if (pairsEased === 0) {
                var msg = "Could not apply easing.";
                if (errors.length) msg += " First reason: " + errors[0];
                else msg += " Make sure your keyframes are at different times.";
                throw new Error(msg);
            }
            return { pairs: pairsEased, properties: propsTouched, keyframes: pairsEased * 2, errors: errors.length };
        });
    }

    return { run: run };
})();
