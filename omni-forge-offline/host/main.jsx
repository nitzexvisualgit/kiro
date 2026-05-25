/**
 * Omni Forge by Nitzex Visual - Host entry point.
 * Loaded automatically by CEP via manifest <ScriptPath>.
 * Sets up the global $.__omniForgeDispatch(fnPath, jsonArgs) router used by the panel.
 */

#target aftereffects
#targetengine "OmniForge"

(function () {
    var ROOT = (function () {
        // Resolve the extension's host folder absolute path.
        var f = File($.fileName);
        return f.parent.fsName;
    })();

    function loadFile(rel) {
        var f = File(ROOT + "/" + rel);
        if (!f.exists) {
            $.writeln("[OmniForge] missing file: " + f.fsName);
            return false;
        }
        $.evalFile(f);
        return true;
    }

    // Core libs - load order matters
    loadFile("lib/json2.jsx");
    loadFile("lib/utils.jsx");

    // Feature modules
    loadFile("modules/align.jsx");
    loadFile("modules/anchor.jsx");
    loadFile("modules/organize.jsx");
    loadFile("modules/precomp.jsx");
    loadFile("modules/unprecomp.jsx");
    loadFile("modules/clipboard.jsx");
    loadFile("modules/explode.jsx");
    loadFile("modules/counter.jsx");
    loadFile("modules/layers.jsx");
    loadFile("modules/easing.jsx");
    loadFile("modules/fonts.jsx");
    loadFile("modules/effects.jsx");
    loadFile("modules/vault.jsx");
    loadFile("modules/kinetic.jsx");
})();

// Global dispatcher - the panel calls $.__omniForgeDispatch("Module.fn", "{...}")
$.__omniForgeDispatch = function (fnPath, argsJson) {
    try {
        var parts = fnPath.split(".");
        var ns = OF[parts[0]];
        if (!ns) return OF.U.envelope(false, null, "Unknown module: " + parts[0]);
        var fn = ns[parts[1]];
        if (typeof fn !== "function") return OF.U.envelope(false, null, "Unknown function: " + fnPath);
        var args = argsJson ? JSON.parse(argsJson) : {};
        return fn(args);
    } catch (e) {
        return OF.U.envelope(false, null, e);
    }
};

$.writeln("[OmniForge] Host engine ready.");
