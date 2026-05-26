/**
 * OF.SRT - Import an SRT subtitle file as one text layer per cue.
 *
 * Each cue block in the SRT becomes its own text layer with:
 *   - layer.startTime / inPoint / outPoint matching the cue timing
 *   - configurable font / size / fill / stroke / position
 *   - optional precompose-into-group for tidy timeline
 *
 * Robust parser: handles BOM, \r\n, blank lines, missing index numbers,
 * comma OR period decimal separators, and multi-line cue text.
 */
$.global.OF = $.global.OF || {};
OF = $.global.OF;

OF.SRT = (function () {

    function timeToSeconds(t) {
        if (!t) return 0;
        t = String(t).replace(",", ".").replace(/\s+/g, "");
        var parts = t.split(":");
        if (parts.length === 3) {
            return (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
        }
        if (parts.length === 2) {
            return (+parts[0]) * 60 + (+parts[1]);
        }
        return +parts[0] || 0;
    }


    function parseSRT(content) {
        // strip BOM, normalise line endings, split into cue blocks
        var text = String(content || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
        var blocks = text.split(/\n\s*\n+/);
        var cues = [];
        for (var i = 0; i < blocks.length; i++) {
            var lines = blocks[i].split("\n");
            // Find the timestamp line (first line containing -->)
            var tsIdx = -1;
            for (var j = 0; j < lines.length; j++) {
                if (lines[j].indexOf("-->") >= 0) { tsIdx = j; break; }
            }
            if (tsIdx < 0) continue;
            var ts = lines[tsIdx].split("-->");
            if (ts.length < 2) continue;
            var start = timeToSeconds(ts[0]);
            var end   = timeToSeconds(ts[1]);
            if (end <= start) continue;
            // Cue text = remaining lines after timestamp, joined with \r (AE multiline)
            var cueText = lines.slice(tsIdx + 1).join("\r").replace(/\s+$/, "");
            if (!cueText) continue;
            cues.push({ start: start, end: end, text: cueText });
        }
        return cues;
    }


    function applyDocStyle(layer, opts) {
        try {
            var doc = layer.property("Source Text").value;
            if (opts.fontFamily) {
                // Try setting font (PostScript name) - works for installed fonts
                doc.font = opts.fontFamily;
            }
            if (opts.fontSize) doc.fontSize = opts.fontSize;
            if (opts.fillColor) {
                doc.applyFill = true;
                doc.fillColor = opts.fillColor;
            }
            if (opts.hasStroke) {
                doc.applyStroke = true;
                doc.strokeColor = opts.strokeColor || [0, 0, 0];
                doc.strokeWidth = opts.strokeWidth || 4;
                doc.strokeOverFill = false;
            } else {
                doc.applyStroke = false;
            }
            doc.justification = ParagraphJustification.CENTER_JUSTIFY;
            layer.property("Source Text").setValue(doc);
        } catch (e) { /* doc may not support some props on older AE */ }
    }

    function importFile(args) {
        return OF.U.safe("Import SRT", function () {
            var comp = OF.U.activeComp();
            if (!comp) throw new Error("Open a composition first.");
            if (!args || !args.path) throw new Error("No SRT file path given.");

            var f = new File(args.path);
            if (!f.exists) throw new Error("SRT file not found: " + args.path);
            f.encoding = "UTF-8";
            f.open("r");
            var content = f.read();
            f.close();

            var cues = parseSRT(content);
            if (!cues.length) throw new Error("No subtitle cues found in this SRT.");

            var styleOpts = {
                fontFamily:  args.fontFamily,
                fontSize:    args.fontSize    || 60,
                fillColor:   args.fillColor   || [1, 1, 1],
                hasStroke:   !!args.hasStroke,
                strokeColor: args.strokeColor || [0, 0, 0],
                strokeWidth: args.strokeWidth || 4
            };
            var posX = (args.posX != null) ? args.posX : (comp.width / 2);
            var posY = (args.posY != null) ? args.posY : Math.round(comp.height * 0.85);
            var maxCueLen = +args.maxCueLen || 0;   // 0 = no cap
            var minCueLen = +args.minCueLen || 0;   // 0 = no floor


            // Need to extend comp duration if SRT runs past it
            var lastEnd = cues[cues.length - 1].end;
            if (lastEnd > comp.duration) comp.duration = lastEnd + 1;

            var created = [];
            for (var i = 0; i < cues.length; i++) {
                var c = cues[i];
                var dur = c.end - c.start;
                if (maxCueLen && dur > maxCueLen) c.end = c.start + maxCueLen;
                if (minCueLen && dur < minCueLen) c.end = c.start + minCueLen;

                var layer = comp.layers.addText(c.text);
                var nameSnippet = c.text.replace(/[\r\n]+/g, " ").substring(0, 32);
                layer.name = (i + 1) + " | " + nameSnippet;

                applyDocStyle(layer, styleOpts);
                layer.transform.position.setValue([posX, posY, 0]);

                // Time the layer to its cue
                layer.startTime = c.start;
                layer.inPoint   = c.start;
                layer.outPoint  = c.end;

                created.push(layer);
            }

            // Optionally precompose all the new caption layers into one comp
            if (args.precompose && created.length) {
                var indices = [];
                for (var k = 0; k < created.length; k++) indices.push(created[k].index);
                indices.sort(function (a, b) { return a - b; });
                var preName = (args.groupName || "Captions") + " - " + new Date().getTime();
                comp.layers.precompose(indices, preName, true);
            }

            return {
                count:    created.length,
                duration: lastEnd,
                first:    cues[0].start,
                last:     cues[cues.length - 1].end
            };
        });
    }

    return {
        importFile: importFile,
        parse:      function (args) {
            return OF.U.safeNoUndo(function () { return parseSRT(args.content || ""); });
        }
    };
})();
