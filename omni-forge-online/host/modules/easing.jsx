/**
 * OF.Easing - Apply cubic-bezier easing between consecutive keyframes.
 *
 * Behaves like Flow / JerryFlow plugins:
 *   - User selects 2+ keyframes on one or more properties.
 *   - For each consecutive pair of selected keys, we compute the AE
 *     temporal ease (out-ease of key N + in-ease of key N+1) that
 *     reproduces the cubic-bezier(x1,y1,x2,y2) motion curve.
 *   - Falls back to ALL keys on the selected property if the user only
 *     selected the property (not specific keys).
 *
 * Math:
 *   For multi-dim props (Position, Scale), each dimension gets its own
 *   speed scaled by that dim's value delta.
 *
 *     influenceOut = clamp(x1 * 100, 0.1, 100)
 *     influenceIn  = clamp((1 - x2) * 100, 0.1, 100)
 *     slopeStart   = (x1 > 0) ? y1 / x1     : 0
 *     slopeEnd     = (x2 < 1) ? (1 - y2) / (1 - x2) : 0
 *     speedOut[d]  = (vB[d] - vA[d]) / dt * slopeStart
 *     speedIn[d]   = (vB[d] - vA[d]) / dt * slopeEnd
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
        if (dt <= 0) return false;

        var vA = getKeyValueAsArray(prop, kA, dim);
        var vB = getKeyValueAsArray(prop, kB, dim);

        var x1 = curve[0], y1 = curve[1], x2 = curve[2], y2 = curve[3];
        var slopeStart = (x1 > 0.0001) ? (y1 / x1) : 0;
        var slopeEnd   = (x2 < 0.9999) ? ((1 - y2) / (1 - x2)) : 0;

        var infOut = Math.max(0.1, Math.min(100, x1 * 100));
        var infIn  = Math.max(0.1, Math.min(100, (1 - x2) * 100));

        var outArr = [], inArr = [];
        for (var d = 0; d < dim; d++) {
            var deltaV = vB[d] - vA[d];
            var avgSpeed = deltaV / dt;
            outArr.push(new KeyframeEase(avgSpeed * slopeStart, infOut));
            inArr.push(new KeyframeEase(avgSpeed * slopeEnd, infIn));
        }

        // Preserve untouched eases when side != "both"
        var existingInA  = prop.keyInTemporalEase(kA);
        var existingOutA = prop.keyOutTemporalEase(kA);
        var existingInB  = prop.keyInTemporalEase(kB);
        var existingOutB = prop.keyOutTemporalEase(kB);

        try {
            if (side === "out" || side === "both") {
                prop.setTemporalEaseAtKey(kA, existingInA, outArr);
            }
            if (side === "in" || side === "both") {
                prop.setTemporalEaseAtKey(kB, inArr, existingOutB);
            }
            // Force bezier interpolation so eases actually take effect
            prop.setInterpolationTypeAtKey(kA,
                prop.keyInInterpolationType(kA),
                KeyframeInterpolationType.BEZIER);
            prop.setInterpolationTypeAtKey(kB,
                KeyframeInterpolationType.BEZIER,
                prop.keyOutInterpolationType(kB));
        } catch (e) {
            return false;
        }
        return true;
    }


    function findTargets() {
        var comp = OF.U.activeComp();
        if (!comp) throw new Error("No active composition.");

        // Walk all selected properties; for each, collect the keys to ease.
        var sel = comp.selectedProperties || [];
        var targets = [];

        for (var i = 0; i < sel.length; i++) {
            var p = sel[i];
            if (!p || p.propertyType !== PropertyType.PROPERTY) continue;
            if (!p.canVaryOverTime) continue;
            if (p.numKeys < 2) continue;

            // If specific keyframes are selected, use those.
            // Else fall back to all keyframes on this property.
            var keys = [];
            try {
                if (p.selectedKeys && p.selectedKeys.length >= 2) {
                    for (var s = 0; s < p.selectedKeys.length; s++) keys.push(p.selectedKeys[s]);
                }
            } catch (e) {}
            if (keys.length < 2) {
                for (var k = 1; k <= p.numKeys; k++) keys.push(k);
            }
            keys.sort(function (a, b) { return a - b; });
            targets.push({ prop: p, keys: keys });
        }

        // Fallback: no animated property selected -> walk selected layers'
        // animated transform props with keyframes (helps users who only
        // select layers in the timeline).
        if (!targets.length) {
            var layers = OF.U.selectedLayers();
            for (var li = 0; li < layers.length; li++) {
                var t = layers[li].transform;
                for (var ti = 1; ti <= t.numProperties; ti++) {
                    var prop = t.property(ti);
                    if (prop.numKeys >= 2 && prop.canVaryOverTime) {
                        var allKeys = [];
                        for (var kk = 1; kk <= prop.numKeys; kk++) allKeys.push(kk);
                        targets.push({ prop: prop, keys: allKeys });
                    }
                }
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
                throw new Error("Select 2+ keyframes (or an animated property/layer) first.");
            }

            var pairsEased = 0, propsTouched = 0;
            for (var t = 0; t < targets.length; t++) {
                var prop = targets[t].prop;
                var keys = targets[t].keys;
                var anyOk = false;
                for (var i = 0; i < keys.length - 1; i++) {
                    if (applyBetween(prop, keys[i], keys[i + 1], curve, side)) {
                        pairsEased++;
                        anyOk = true;
                    }
                }
                if (anyOk) propsTouched++;
            }

            if (pairsEased === 0) {
                throw new Error("Could not ease any keyframe pairs. Check that keyframes are at different times.");
            }
            return { pairs: pairsEased, properties: propsTouched, keyframes: pairsEased * 2 };
        });
    }

    return { run: run };
})();
