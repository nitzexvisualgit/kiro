/**
 * OF.Clipboard - Property Clipboard with 5 slots.
 * Stores selected properties (with keyframes & expressions) in memory and pastes them
 * onto matching properties of the destination layer(s).
 *
 * args.action = "copy" | "paste" | "deleteBefore" | "deleteAfter" | "clearAll"
 * args.slot = 1..5
 *
 * Storage: keyed in $.global so it survives panel reloads in the same AE session.
 */
OF.Clipboard = (function () {
    if (!$.global.__OF_CLIP__) $.global.__OF_CLIP__ = { 1: null, 2: null, 3: null, 4: null, 5: null };

    function serializeProp(prop) {
        var data = { matchName: prop.matchName, name: prop.name, keys: [], expr: null, value: null, isTime: false };
        try {
            if (prop.expression && prop.expression !== "") data.expr = prop.expression;
            if (prop.numKeys > 0) {
                for (var i = 1; i <= prop.numKeys; i++) {
                    data.keys.push({
                        time: prop.keyTime(i),
                        value: prop.keyValue(i),
                        easeIn: serializeEase(prop.keyInTemporalEase(i)),
                        easeOut: serializeEase(prop.keyOutTemporalEase(i))
                    });
                }
            } else {
                data.value = prop.value;
            }
        } catch (e) {}
        return data;
    }

    function serializeEase(ease) {
        if (!ease) return null;
        var arr = [];
        for (var i = 0; i < ease.length; i++) arr.push({ speed: ease[i].speed, influence: ease[i].influence });
        return arr;
    }

    function deserializeEase(arr) {
        if (!arr) return null;
        var out = [];
        for (var i = 0; i < arr.length; i++) out.push(new KeyframeEase(arr[i].speed, arr[i].influence));
        return out;
    }


    function getSelectedProps() {
        var comp = OF.U.activeComp();
        if (!comp) throw new Error("No active composition.");
        var sel = comp.selectedProperties;
        if (!sel || !sel.length) {
            // Fall back to selected layers' Transform group
            var layers = OF.U.selectedLayers();
            if (!layers.length) throw new Error("Select properties (or layers) first.");
            sel = [];
            for (var i = 0; i < layers.length; i++) sel.push(layers[i].transform);
        }
        // Flatten groups to their leaf Properties
        var out = [];
        function walk(p) {
            if (p.propertyType === PropertyType.PROPERTY) out.push(p);
            else if (p.propertyType === PropertyType.INDEXED_GROUP || p.propertyType === PropertyType.NAMED_GROUP) {
                for (var k = 1; k <= p.numProperties; k++) walk(p.property(k));
            }
        }
        for (var j = 0; j < sel.length; j++) walk(sel[j]);
        return out;
    }

    function findPropOnLayer(layer, matchName) {
        // BFS through layer property tree
        var queue = [layer];
        while (queue.length) {
            var node = queue.shift();
            if (node.matchName === matchName) return node;
            if (node.numProperties) {
                for (var k = 1; k <= node.numProperties; k++) queue.push(node.property(k));
            }
        }
        return null;
    }

    function pasteOnto(slot, layers, deleteBefore, deleteAfter, currentTime) {
        if (!slot || !slot.props) throw new Error("Slot is empty.");
        var pasted = 0;
        for (var i = 0; i < layers.length; i++) {
            for (var j = 0; j < slot.props.length; j++) {
                var data = slot.props[j];
                var dst = findPropOnLayer(layers[i], data.matchName);
                if (!dst) continue;
                try {
                    if (deleteBefore || deleteAfter) {
                        for (var k = dst.numKeys; k >= 1; k--) {
                            var t = dst.keyTime(k);
                            if (deleteBefore && t < currentTime) dst.removeKey(k);
                            else if (deleteAfter && t > currentTime) dst.removeKey(k);
                        }
                    }
                    if (data.expr) dst.expression = data.expr;
                    if (data.keys.length) {
                        for (var m = 0; m < data.keys.length; m++) {
                            var kf = data.keys[m];
                            dst.setValueAtTime(kf.time, kf.value);
                            var idx = dst.nearestKeyIndex(kf.time);
                            if (kf.easeIn && kf.easeOut) dst.setTemporalEaseAtKey(idx, deserializeEase(kf.easeIn), deserializeEase(kf.easeOut));
                        }
                    } else if (data.value !== null && data.value !== undefined) {
                        dst.setValue(data.value);
                    }
                    pasted++;
                } catch (e) {}
            }
        }
        return pasted;
    }


    function run(args) {
        return OF.U.safe("Clipboard " + args.action, function () {
            var slotIdx = args.slot || 1;
            switch (args.action) {
                case "copy":
                    var props = getSelectedProps();
                    var serialized = [];
                    for (var i = 0; i < props.length; i++) serialized.push(serializeProp(props[i]));
                    $.global.__OF_CLIP__[slotIdx] = { props: serialized, when: new Date().getTime() };
                    return { slot: slotIdx, count: serialized.length };

                case "paste":
                    var layers = OF.U.selectedLayers();
                    if (!layers.length) throw new Error("Select destination layer(s).");
                    var n = pasteOnto($.global.__OF_CLIP__[slotIdx], layers, false, false, 0);
                    return { slot: slotIdx, pasted: n };

                case "deleteBefore":
                case "deleteAfter":
                    var ls = OF.U.selectedLayers();
                    if (!ls.length) throw new Error("Select layer(s).");
                    var comp = OF.U.activeComp();
                    var deleted = 0;
                    for (var li = 0; li < ls.length; li++) {
                        var sp = ls[li].selectedProperties;
                        if (!sp || !sp.length) sp = [ls[li].transform];
                        for (var pi = 0; pi < sp.length; pi++) {
                            var p = sp[pi];
                            if (p.propertyType !== PropertyType.PROPERTY) continue;
                            for (var k = p.numKeys; k >= 1; k--) {
                                var t = p.keyTime(k);
                                if (args.action === "deleteBefore" && t < comp.time) { p.removeKey(k); deleted++; }
                                else if (args.action === "deleteAfter" && t > comp.time) { p.removeKey(k); deleted++; }
                            }
                        }
                    }
                    return { deleted: deleted };

                case "clearAll":
                    $.global.__OF_CLIP__ = { 1: null, 2: null, 3: null, 4: null, 5: null };
                    return { cleared: true };

                case "status":
                    var status = {};
                    for (var s = 1; s <= 5; s++) {
                        var v = $.global.__OF_CLIP__[s];
                        status[s] = v ? { count: v.props.length, when: v.when } : null;
                    }
                    return status;
            }
            throw new Error("Unknown clipboard action: " + args.action);
        });
    }
    return { run: run };
})();
