/**
 * OF.Easing - Apply temporal eases derived from a CSS-style cubic-bezier (x1,y1,x2,y2).
 * AE expresses easing per keyframe as KeyframeEase(speed, influence).
 * We approximate the bezier into AE eases using common conversion: influence ~ |handle| * 100.
 *
 * args:
 *   curve: [x1,y1,x2,y2]  (each 0..1, but x1/x2 outside [0,1] means anticipation/overshoot)
 *   side: "in" | "out" | "both"
 */
OF.Easing = (function () {

    function bezierToEase(curve, side) {
        // Use "influence" as % of segment between keyframes, "speed" left at 0 for shape control.
        // This is the same approach BezierLab/FlowExtension use - it's a stable approximation.
        var x1 = curve[0], y1 = curve[1], x2 = curve[2], y2 = curve[3];
        var influenceIn  = Math.max(0.1, Math.min(100, (1 - x2) * 100));
        var influenceOut = Math.max(0.1, Math.min(100, x1 * 100));
        var ease = {
            inEase:  new KeyframeEase(0, influenceIn),
            outEase: new KeyframeEase(0, influenceOut)
        };
        return ease;
    }

    function applyTo(prop, side, ease) {
        if (!prop || prop.numKeys < 2) return 0;
        var changed = 0;
        for (var i = 1; i <= prop.numKeys; i++) {
            var dim = prop.propertyValueType === PropertyValueType.TwoD || prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ? 2
                    : prop.propertyValueType === PropertyValueType.ThreeD || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL ? 3
                    : 1;
            var inArr = [], outArr = [];
            for (var d = 0; d < dim; d++) {
                inArr.push(new KeyframeEase(ease.inEase.speed, ease.inEase.influence));
                outArr.push(new KeyframeEase(ease.outEase.speed, ease.outEase.influence));
            }
            try {
                if (side === "in" || side === "both") prop.setTemporalEaseAtKey(i, inArr, prop.keyOutTemporalEase(i));
                if (side === "out" || side === "both") prop.setTemporalEaseAtKey(i, prop.keyInTemporalEase(i), outArr);
                if (side === "both") prop.setTemporalEaseAtKey(i, inArr, outArr);
                prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
                changed++;
            } catch (e) {}
        }
        return changed;
    }


    function selectedAnimatedProps() {
        var comp = OF.U.activeComp();
        if (!comp) throw new Error("No active composition.");
        var props = comp.selectedProperties;
        var out = [];
        if (props && props.length) {
            for (var i = 0; i < props.length; i++) {
                if (props[i].propertyType === PropertyType.PROPERTY && props[i].numKeys >= 2) out.push(props[i]);
            }
        }
        if (!out.length) {
            // Fallback: any animated transform on selected layers
            var sel = OF.U.selectedLayers();
            for (var j = 0; j < sel.length; j++) {
                var t = sel[j].transform;
                for (var k = 1; k <= t.numProperties; k++) {
                    var p = t.property(k);
                    if (p.numKeys >= 2) out.push(p);
                }
            }
        }
        return out;
    }

    function run(args) {
        return OF.U.safe("Apply Easing", function () {
            var curve = args.curve || [0.25, 0.1, 0.25, 1];
            var side = args.side || "both";
            var ease = bezierToEase(curve, side);
            var props = selectedAnimatedProps();
            if (!props.length) throw new Error("No animated properties selected.");
            var n = 0;
            for (var i = 0; i < props.length; i++) n += applyTo(props[i], side, ease);
            return { keyframes: n, properties: props.length };
        });
    }
    return { run: run };
})();
