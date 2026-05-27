/**
 * OF.Explode - Explode Text Pro.
 *
 * args:
 *   splitBy:       "chars" | "words" | "lines"
 *   stacking:      "bottomToTop" | "topToBottom"
 *   keepKeyframes: bool   (duplicate the original layer for each fragment so its anims survive)
 *   deleteOriginal: bool
 *
 * Each fragment becomes its own text layer. Position is preserved per-fragment using
 * sourceRect width measurements so the layout is identical to the original.
 */
OF.Explode = (function () {

    function splitText(text, mode) {
        if (mode === "chars") {
            var out = [];
            for (var i = 0; i < text.length; i++) out.push(text.charAt(i));
            return out;
        }
        if (mode === "lines") return text.split(/\r?\n/);
        // words: split on whitespace, keep separators so we know spacing
        return text.split(/(\s+)/).filter(function (s) { return s !== ""; });
    }

    function duplicateLayer(layer) {
        layer.duplicate();
        return layer.containingComp.layer(layer.index - 1); // duplicate sits above original
    }

    function setText(layer, str) {
        var doc = layer.property("Source Text").value;
        doc.text = str;
        layer.property("Source Text").setValue(doc);
    }

    function measureWidth(layer) {
        try { return layer.sourceRectAtTime(layer.time, false).width; } catch (e) { return 0; }
    }


    function explodeOne(textLayer, opts) {
        var comp = textLayer.containingComp;
        var srcDoc = textLayer.property("Source Text").value;
        var fullText = srcDoc.text;
        var fragments = splitText(fullText, opts.splitBy);

        // Measure original starting X position
        var origPos = textLayer.transform.position.value;
        var origRect = textLayer.sourceRectAtTime(textLayer.time, false);
        var origAnchor = textLayer.transform.anchorPoint.value;

        // Working position: compute leftmost X in comp space
        // For default left-justified text: position.x ~= origPos[0] - (anchor.x - rect.left)*scale
        // We'll create each fragment at the same Y as original; X advances by measured widths.
        var startX = origPos[0] - (origAnchor[0] - origRect.left);
        var y = origPos[1];

        var newLayers = [];
        var cursorX = startX;

        for (var i = 0; i < fragments.length; i++) {
            var frag = fragments[i];
            if (opts.splitBy === "words" && /^\s+$/.test(frag)) {
                // Whitespace-only token: advance cursor using a temporary measurement
                var tmp = duplicateLayer(textLayer);
                setText(tmp, frag);
                cursorX += measureWidth(tmp);
                tmp.remove();
                continue;
            }

            var nl = duplicateLayer(textLayer);
            nl.name = textLayer.name + " - " + (opts.splitBy === "lines" ? "Line " : (opts.splitBy === "words" ? "Word " : "Char ")) + (i + 1);

            if (!opts.keepKeyframes) {
                // Strip animations on Source Text only - preserve transform animations? user's call.
                try { nl.property("Source Text").expression = ""; } catch (e) {}
                try {
                    var st = nl.property("Source Text");
                    while (st.numKeys > 0) st.removeKey(1);
                } catch (e) {}
            }

            setText(nl, frag);

            // For chars/words mode, place at cursor X; for lines, stack vertically using rect height
            if (opts.splitBy === "lines") {
                var lh = origRect.height; // approximate line height
                nl.transform.position.setValue([origPos[0], y + i * lh, origPos[2] || 0]);
            } else {
                var w = measureWidth(nl);
                var anchor = nl.transform.anchorPoint.value;
                // place so that left edge of this fragment sits at cursorX
                var xPos = cursorX + (anchor[0] - 0); // anchor.x relative to fragment's own rect.left=0
                nl.transform.position.setValue([xPos, y, origPos[2] || 0]);
                cursorX += w;
            }
            newLayers.push(nl);
        }


        // Stacking order in timeline panel
        if (opts.stacking === "topToBottom") {
            // newLayers[0] should be highest
            for (var s = newLayers.length - 1; s >= 0; s--) newLayers[s].moveToBeginning();
        } else {
            // bottom to top: last fragment at top
            for (var t = 0; t < newLayers.length; t++) newLayers[t].moveToBeginning();
        }

        if (opts.deleteOriginal) textLayer.remove();
        return newLayers.length;
    }

    function run(args) {
        return OF.U.safe("Explode Text", function () {
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select one or more text layers.");
            var opts = {
                splitBy: args.splitBy || "words",
                stacking: args.stacking || "bottomToTop",
                keepKeyframes: args.keepKeyframes !== false,
                deleteOriginal: args.deleteOriginal !== false
            };
            var total = 0, processed = 0;
            for (var i = 0; i < sel.length; i++) {
                var L = sel[i];
                if (!(L instanceof TextLayer)) continue;
                total += explodeOne(L, opts);
                processed++;
            }
            if (!processed) throw new Error("Selection contains no text layers.");
            return { layers: total, processed: processed };
        });
    }
    return { run: run };
})();
