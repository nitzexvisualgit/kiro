/**
 * Omni Forge by Nitzex Visual - Host entry point.
 *
 * Robust boot:
 *   - Tries panel-injected $.global._OF_EXT_ROOT first (most reliable).
 *   - Falls back to $.fileName (works on some AE versions).
 *   - If neither available, defers - the panel will re-evaluate this file
 *     after injecting the root.
 *
 * Fail-safe dispatcher: even if module loading partially fails, the
 * dispatcher returns a structured JSON error instead of an empty string.
 */

#target aftereffects
#targetengine "OmniForge"

(function () {
    function findRoot() {
        // Method 1: panel-injected extension root (most reliable in CEP)
        if ($.global._OF_EXT_ROOT) {
            return $.global._OF_EXT_ROOT + "/host";
        }
        // Method 2: $.fileName (sometimes empty in CEP context)
        try {
            if ($.fileName) {
                var f = File($.fileName);
                if (f.parent && f.parent.exists) return f.parent.fsName;
            }
        } catch (e) {}
        return null;
    }

    var ROOT = findRoot();
    if (!ROOT) {
        $.writeln("[OmniForge] Boot deferred - waiting for extension root from panel.");
        return;
    }

    function loadFile(rel) {
        var f = new File(ROOT + "/" + rel);
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
    loadFile("modules/srt.jsx");

    $.writeln("[OmniForge] Host engine ready. ROOT=" + ROOT);
})();

// Fail-safe envelope helper. Used when OF.U isn't available (early errors).
// Hand-builds JSON to avoid depending on json2.jsx being loaded.
function __OF_safeError(err) {
    function esc(s) {
        return String(s)
            .replace(/\\/g, "\\\\").replace(/"/g, '\\"')
            .replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
    }
    var msg = (err && err.message) ? err.message : String(err || "Unknown error");
    var stack = (err && err.stack) || "";
    return '{"ok":false,"error":"' + esc(msg) + '","stack":"' + esc(stack) + '"}';
}

// Global dispatcher - the panel calls $.__omniForgeDispatch("Module.fn", "{...}")
$.__omniForgeDispatch = function (fnPath, argsJson) {
    try {
        // OF lives on $.global to survive across IIFE scopes - see utils.jsx
        var OF = $.global.OF;
        if (!OF) {
            return __OF_safeError("Host modules not loaded. Restart After Effects.");
        }
        var parts = fnPath.split(".");
        var ns = OF[parts[0]];
        if (!ns) return (OF.U ? OF.U.envelope(false, null, "Unknown module: " + parts[0]) : __OF_safeError("Unknown module: " + parts[0]));
        var fn = ns[parts[1]];
        if (typeof fn !== "function") {
            return (OF.U ? OF.U.envelope(false, null, "Unknown function: " + fnPath) : __OF_safeError("Unknown function: " + fnPath));
        }
        var args = argsJson ? JSON.parse(argsJson) : {};
        return fn(args);
    } catch (e) {
        return __OF_safeError(e);
    }
};

$.writeln("[OmniForge] Dispatcher registered.");
