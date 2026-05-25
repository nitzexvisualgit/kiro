/**
 * OF.Anchor - 9-point anchor placement that preserves visible position.
 * Works on shape, text, image, solid, precomp layers.
 *
 * point: "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br"
 */
OF.Anchor = (function () {
    function setAnchor(layer, point) {
        if (layer.locked) return false;
        var rect = layer.sourceRectAtTime(layer.time, false);
        var anchorOld = layer.transform.anchorPoint.value;
        var posOld = layer.transform.position.value;

        var px, py;
        switch (point) {
            case "tl": px = rect.left;                py = rect.top;                  break;
            case "tc": px = rect.left + rect.width/2; py = rect.top;                  break;
            case "tr": px = rect.left + rect.width;   py = rect.top;                  break;
            case "ml": px = rect.left;                py = rect.top + rect.height/2;  break;
            case "mc": px = rect.left + rect.width/2; py = rect.top + rect.height/2;  break;
            case "mr": px = rect.left + rect.width;   py = rect.top + rect.height/2;  break;
            case "bl": px = rect.left;                py = rect.top + rect.height;    break;
            case "bc": px = rect.left + rect.width/2; py = rect.top + rect.height;    break;
            case "br": px = rect.left + rect.width;   py = rect.top + rect.height;    break;
            default: throw new Error("Unknown anchor point: " + point);
        }

        var scale = layer.transform.scale.value;
        var dx = (px - anchorOld[0]) * scale[0] / 100;
        var dy = (py - anchorOld[1]) * scale[1] / 100;

        layer.transform.anchorPoint.setValue([px, py, anchorOld[2] || 0]);
        layer.transform.position.setValue([posOld[0] + dx, posOld[1] + dy, posOld[2] || 0]);
        return true;
    }

    function run(args) {
        return OF.U.safe("Anchor " + args.point, function () {
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select at least one layer.");
            var n = 0;
            for (var i = 0; i < sel.length; i++) if (setAnchor(sel[i], args.point)) n++;
            return { count: n };
        });
    }
    return { run: run };
})();
