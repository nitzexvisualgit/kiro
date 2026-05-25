/**
 * OF.Counter - Generates a number counter as a text layer with a stable expression.
 *
 * args:
 *   start, end       (numbers)
 *   format:          "integer" | "decimal1" | "decimal2" | "comma" | "percent" | "custom"
 *   prefix, suffix   (strings)
 *   digits           (zero-pad width, 0 = none)
 *   duration         (seconds, defaults to comp duration)
 */
OF.Counter = (function () {

    function buildExpression(opts) {
        return [
            "var s = " + (opts.start || 0) + ";",
            "var e = " + (opts.end || 100) + ";",
            "var d = " + (opts.duration || 5) + ";",
            "var p = '" + (opts.prefix || "").replace(/'/g, "\\'") + "';",
            "var u = '" + (opts.suffix || "").replace(/'/g, "\\'") + "';",
            "var dig = " + (opts.digits || 0) + ";",
            "var t = Math.max(0, Math.min(time / d, 1));",
            "var v = s + (e - s) * t;",
            "function fmt(n) {",
            "  switch ('" + (opts.format || "integer") + "') {",
            "    case 'integer':  return Math.round(n).toString();",
            "    case 'decimal1': return n.toFixed(1);",
            "    case 'decimal2': return n.toFixed(2);",
            "    case 'comma':    return Math.round(n).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');",
            "    case 'percent':  return Math.round(n) + '%';",
            "    default:         return Math.round(n).toString();",
            "  }",
            "}",
            "var out = fmt(v);",
            "if (dig > 0 && out.indexOf('.') === -1) { while (out.length < dig) out = '0' + out; }",
            "p + out + u"
        ].join("\n");
    }

    function run(args) {
        return OF.U.safe("Create Counter", function () {
            var comp = OF.U.activeComp();
            if (!comp) throw new Error("No active composition.");
            var L = comp.layers.addText("0");
            L.name = "Counter " + Math.round(args.start || 0) + " to " + Math.round(args.end || 100);
            var doc = L.property("Source Text").value;
            doc.fontSize = 100;
            doc.fillColor = [1, 1, 1];
            doc.justification = ParagraphJustification.CENTER_JUSTIFY;
            L.property("Source Text").setValue(doc);
            L.property("Source Text").expression = buildExpression(args);
            L.transform.position.setValue([comp.width / 2, comp.height / 2]);
            return { name: L.name };
        });
    }
    return { run: run };
})();
