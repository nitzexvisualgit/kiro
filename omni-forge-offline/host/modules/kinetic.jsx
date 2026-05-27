/**
 * OF.Kinetic - Animation library. Pure expression-based for stability.
 * Each animation generates property keyframes or a self-contained expression
 * so users can re-edit naturally.
 *
 * args.id     - animation id (slideRight, slideUp, scaleUp, bounceIn, rotateIn,
 *               blurIn, fadeOut, slideOutLeft, slideOutRight, scaleOut,
 *               float, pulse, wiggle, spin, shake)
 * args.dur    - duration in seconds (default 0.6)
 * args.curve  - [x1,y1,x2,y2] cubic-bezier (default ease-out)
 * args.target - "in" applies at layer.inPoint, "out" applies at layer.outPoint, "loop" applies as expression
 */
OF.Kinetic = (function () {

    function easeBoth(prop, idx, ease) {
        try {
            var ein = [], eout = [];
            for (var d = 0; d < (prop.value.length || 1); d++) {
                ein.push(new KeyframeEase(0, ease.influenceIn));
                eout.push(new KeyframeEase(0, ease.influenceOut));
            }
            prop.setTemporalEaseAtKey(idx, ein, eout);
            prop.setInterpolationTypeAtKey(idx, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        } catch (e) {}
    }

    function makeEase(curve) {
        var c = curve || [0.16, 1, 0.3, 1];
        return { influenceIn: Math.max(1, (1 - c[2]) * 100), influenceOut: Math.max(1, c[0] * 100) };
    }

    var ANIMS = {};

    ANIMS.slideRight = function (L, t, dur, ease) {
        var p = L.transform.position;
        var v = p.value;
        p.setValueAtTime(t, [v[0] - L.containingComp.width, v[1], v[2] || 0]);
        p.setValueAtTime(t + dur, v);
        easeBoth(p, p.numKeys, ease);
    };
    ANIMS.slideUp = function (L, t, dur, ease) {
        var p = L.transform.position; var v = p.value;
        p.setValueAtTime(t, [v[0], v[1] + L.containingComp.height, v[2] || 0]);
        p.setValueAtTime(t + dur, v); easeBoth(p, p.numKeys, ease);
    };
    ANIMS.slideDown = function (L, t, dur, ease) {
        var p = L.transform.position; var v = p.value;
        p.setValueAtTime(t, [v[0], v[1] - L.containingComp.height, v[2] || 0]);
        p.setValueAtTime(t + dur, v); easeBoth(p, p.numKeys, ease);
    };


    ANIMS.scaleUp = function (L, t, dur, ease) {
        var s = L.transform.scale; var v = s.value;
        s.setValueAtTime(t, [0, 0, 100]); s.setValueAtTime(t + dur, v);
        easeBoth(s, s.numKeys, ease);
    };
    ANIMS.scaleDown = function (L, t, dur, ease) {
        var s = L.transform.scale; var v = s.value;
        s.setValueAtTime(t, [v[0]*1.5, v[1]*1.5, 100]); s.setValueAtTime(t + dur, v);
        easeBoth(s, s.numKeys, ease);
    };
    ANIMS.bounceIn = function (L, t, dur, ease) {
        var s = L.transform.scale; var v = s.value;
        s.setValueAtTime(t, [0, 0, 100]);
        s.setValueAtTime(t + dur*0.6, [v[0]*1.15, v[1]*1.15, 100]);
        s.setValueAtTime(t + dur, v);
        easeBoth(s, s.numKeys, ease);
    };
    ANIMS.rotateIn = function (L, t, dur, ease) {
        var r = L.transform.rotation;
        r.setValueAtTime(t, -180); r.setValueAtTime(t + dur, 0);
        easeBoth(r, r.numKeys, ease);
        ANIMS.scaleUp(L, t, dur, ease);
    };
    ANIMS.blurIn = function (L, t, dur) {
        try {
            var blur = L.Effects.addProperty("ADBE Gaussian Blur 2");
            var b = blur.property("Blurriness");
            b.setValueAtTime(t, 100);
            b.setValueAtTime(t + dur, 0);
        } catch (e) {}
    };
    ANIMS.fadeOut = function (L, t, dur, ease) {
        var o = L.transform.opacity;
        o.setValueAtTime(t, 100); o.setValueAtTime(t + dur, 0);
        easeBoth(o, o.numKeys, ease);
    };
    ANIMS.fadeIn = function (L, t, dur, ease) {
        var o = L.transform.opacity;
        o.setValueAtTime(t, 0); o.setValueAtTime(t + dur, 100);
        easeBoth(o, o.numKeys, ease);
    };
    ANIMS.slideOutLeft = function (L, t, dur, ease) {
        var p = L.transform.position; var v = p.value;
        p.setValueAtTime(t, v); p.setValueAtTime(t + dur, [v[0] - L.containingComp.width, v[1], v[2]||0]);
        easeBoth(p, p.numKeys, ease);
    };
    ANIMS.slideOutRight = function (L, t, dur, ease) {
        var p = L.transform.position; var v = p.value;
        p.setValueAtTime(t, v); p.setValueAtTime(t + dur, [v[0] + L.containingComp.width, v[1], v[2]||0]);
        easeBoth(p, p.numKeys, ease);
    };
    ANIMS.scaleOut = function (L, t, dur, ease) {
        var s = L.transform.scale; var v = s.value;
        s.setValueAtTime(t, v); s.setValueAtTime(t + dur, [0, 0, 100]);
        easeBoth(s, s.numKeys, ease);
    };


    // Loop animations - applied as expressions
    ANIMS.float = function (L) { L.transform.position.expression = "amp = 8; freq = 1.5;\nvalue + [0, Math.sin(time * freq * Math.PI * 2) * amp]"; };
    ANIMS.pulse = function (L) { L.transform.scale.expression = "amp = 5; freq = 2;\ns = 100 + Math.sin(time * freq * Math.PI * 2) * amp;\n[s, s, value[2] || 100]"; };
    ANIMS.wiggle = function (L) { L.transform.position.expression = "wiggle(2, 25)"; };
    ANIMS.spin = function (L) { L.transform.rotation.expression = "time * 90"; };
    ANIMS.shake = function (L) { L.transform.position.expression = "amp = 6; freq = 18;\nvalue + [Math.random() * amp - amp/2, Math.random() * amp - amp/2] * Math.sin(time * freq)"; };

    function applyAnimation(args) {
        return OF.U.safe("Apply Animation: " + args.id, function () {
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select layer(s).");
            var fn = ANIMS[args.id];
            if (!fn) throw new Error("Unknown animation: " + args.id);
            var dur = args.dur || 0.6;
            var ease = makeEase(args.curve);
            var n = 0;
            for (var i = 0; i < sel.length; i++) {
                var L = sel[i];
                var t = (args.target === "out") ? Math.max(L.outPoint - dur, L.inPoint) : L.inPoint;
                if (args.target === "loop") fn(L);
                else fn(L, t, dur, ease);
                n++;
            }
            return { count: n };
        });
    }

    function removeAnimation() {
        return OF.U.safe("Remove Animation", function () {
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select layer(s).");
            for (var i = 0; i < sel.length; i++) {
                var L = sel[i];
                ["position", "scale", "rotation", "opacity", "anchorPoint"].forEach(function (n) {
                    try {
                        var p = L.transform[n];
                        p.expression = "";
                        while (p.numKeys > 0) p.removeKey(1);
                    } catch (e) {}
                });
            }
            return { count: sel.length };
        });
    }

    return { apply: applyAnimation, remove: removeAnimation };
})();
