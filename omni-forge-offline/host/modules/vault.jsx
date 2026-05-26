/**
 * OF.Vault - Reusable-asset library system.
 *
 * Categories saved to subfolders under a user-chosen library root:
 *   /Expressions/      .json  { code, property }
 *   /Scripts/          .jsx   raw ExtendScript source
 *   /Animations/       .json  serialized transform keyframes/expressions
 *   /Effects/          .ffx   AE animation preset (saveToPreset)
 *   /Compositions/     .aep + sidecar .json manifest
 *
 * Apply path is symmetric: each save method has a matching apply method.
 */
$.global.OF = $.global.OF || {};
OF = $.global.OF;

OF.Vault = (function () {

    function configFile() {
        var udFolder = Folder.userData.fullName + "/OmniForge";
        var f = new Folder(udFolder);
        if (!f.exists) f.create();
        return new File(udFolder + "/vault.json");
    }
    function readConfig() {
        var f = configFile();
        if (!f.exists) return { root: null };
        f.open("r"); var raw = f.read(); f.close();
        try { return JSON.parse(raw); } catch (e) { return { root: null }; }
    }
    function writeConfig(cfg) {
        var f = configFile();
        f.encoding = "UTF-8";
        f.open("w"); f.write(JSON.stringify(cfg)); f.close();
    }
    function requireRoot() {
        var cfg = readConfig();
        if (!cfg.root) throw new Error("Set the Vault library folder first.");
        var folder = new Folder(cfg.root);
        if (!folder.exists) throw new Error("Library folder not found: " + cfg.root);
        return cfg.root;
    }
    function ensureSubfolder(root, sub) {
        var f = new Folder(root + "/" + sub);
        if (!f.exists) f.create();
        return f.fsName;
    }
    function safeName(n) {
        return String(n || "asset").replace(/[\\\/:*?"<>|]/g, "_");
    }


    // ---------- Public: config ----------

    function setRoot(args) {
        return OF.U.safeNoUndo(function () {
            if (!args.path) throw new Error("Path is required.");
            var folder = new Folder(args.path);
            if (!folder.exists) folder.create();
            ["Expressions", "Scripts", "Animations", "Effects", "Compositions"].forEach(function (s) {
                var sf = new Folder(args.path + "/" + s);
                if (!sf.exists) sf.create();
            });
            var cfg = readConfig();
            cfg.root = args.path;
            writeConfig(cfg);
            return { root: args.path };
        });
    }
    function getRoot() {
        return OF.U.safeNoUndo(function () { return readConfig().root || null; });
    }

    // ---------- Save: Expressions ----------

    function saveExpression(args) {
        return OF.U.safe("Vault: Save Expression", function () {
            var root = requireRoot();
            if (!args.name) throw new Error("Name required.");
            var code = args.code || "";
            // If code not provided, try to read from currently selected property
            if (!code) {
                var comp = OF.U.activeComp();
                var sel = (comp && comp.selectedProperties) ? comp.selectedProperties : [];
                for (var i = 0; i < sel.length; i++) {
                    if (sel[i].propertyType === PropertyType.PROPERTY && sel[i].expression) {
                        code = sel[i].expression;
                        break;
                    }
                }
            }
            if (!code) throw new Error("Provide expression code or select a property with an expression.");
            ensureSubfolder(root, "Expressions");
            var f = new File(root + "/Expressions/" + safeName(args.name) + ".json");
            f.encoding = "UTF-8";
            f.open("w");
            f.write(JSON.stringify({
                type:     "expression",
                name:     args.name,
                property: args.property || "",
                code:     code,
                saved:    new Date().toISOString()
            }));
            f.close();
            return { saved: f.fsName };
        });
    }


    // ---------- Save: Scripts ----------

    function saveScript(args) {
        return OF.U.safe("Vault: Save Script", function () {
            var root = requireRoot();
            if (!args.name) throw new Error("Name required.");
            if (!args.code) throw new Error("Script code is empty.");
            ensureSubfolder(root, "Scripts");
            var f = new File(root + "/Scripts/" + safeName(args.name) + ".jsx");
            f.encoding = "UTF-8";
            f.open("w");
            f.write(args.code);
            f.close();
            return { saved: f.fsName };
        });
    }

    // ---------- Save: Animation (keyframes from selected layer) ----------

    function saveAnimation(args) {
        return OF.U.safe("Vault: Save Animation", function () {
            var root = requireRoot();
            if (!args.name) throw new Error("Name required.");
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select a layer to capture its animation.");
            var L = sel[0];

            var snap = {
                type:    "animation",
                name:    args.name,
                source:  L.name,
                saved:   new Date().toISOString(),
                version: 1,
                transform: {}
            };
            var transformProps = ["position", "scale", "rotation", "opacity", "anchorPoint"];
            for (var i = 0; i < transformProps.length; i++) {
                var pn = transformProps[i];
                try {
                    var p = L.transform[pn];
                    if (!p) continue;
                    if (p.numKeys === 0 && !p.expression) continue;
                    var entry = { keys: [], expr: p.expression || null };
                    for (var k = 1; k <= p.numKeys; k++) {
                        var kv = p.keyValue(k);
                        entry.keys.push({
                            time:  p.keyTime(k),
                            value: (typeof kv === "number") ? kv : [].slice.call(kv)
                        });
                    }
                    snap.transform[pn] = entry;
                } catch (e) {}
            }
            ensureSubfolder(root, "Animations");
            var f = new File(root + "/Animations/" + safeName(args.name) + ".json");
            f.encoding = "UTF-8";
            f.open("w");
            f.write(JSON.stringify(snap));
            f.close();
            return { saved: f.fsName, captured: (function () { var n = 0; for (var k in snap.transform) n++; return n; })() };
        });
    }


    // ---------- Save: Effect Preset (.ffx) ----------

    function saveEffectPreset(args) {
        return OF.U.safe("Vault: Save Effect Preset", function () {
            var root = requireRoot();
            if (!args.name) throw new Error("Name required.");
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select a layer with effects to save.");
            ensureSubfolder(root, "Effects");
            var f = new File(root + "/Effects/" + safeName(args.name) + ".ffx");
            sel[0].saveToPreset(f);
            return { saved: f.fsName };
        });
    }

    // ---------- Save: Composition ----------
    // Strategy: prompt user to confirm, save the entire current project
    // under the library, restore the original. Less surgical than ideal,
    // but reliable. The sidecar manifest tracks which comp was saved.

    function saveComposition(args) {
        return OF.U.safe("Vault: Save Composition", function () {
            var root = requireRoot();
            if (!args.name) throw new Error("Name required.");
            var comp = OF.U.activeComp();
            if (!comp) throw new Error("No active composition.");
            if (!app.project.file) throw new Error("Save your project first (File > Save), then save the comp to library.");

            var origPath = app.project.file.fsName;
            ensureSubfolder(root, "Compositions");
            var aepFile = new File(root + "/Compositions/" + safeName(args.name) + ".aep");
            // Save current project to library (whole project, side-effect: file path changes)
            app.project.save(aepFile);
            // Reopen original so the user's session continues with their real file
            try { app.open(new File(origPath)); } catch (e) {}

            // Manifest pointing at the .aep + comp name
            var manifest = new File(root + "/Compositions/" + safeName(args.name) + ".json");
            manifest.encoding = "UTF-8";
            manifest.open("w");
            manifest.write(JSON.stringify({
                type:     "composition",
                name:     args.name,
                compName: comp.name,
                aepFile:  aepFile.fsName,
                saved:    new Date().toISOString()
            }));
            manifest.close();
            return { saved: aepFile.fsName, comp: comp.name };
        });
    }


    // ---------- List ----------

    function listLibrary(args) {
        return OF.U.safeNoUndo(function () {
            var root = requireRoot();
            var category = args.category || "Expressions";
            var folder = new Folder(root + "/" + category);
            if (!folder.exists) return [];
            var files = folder.getFiles();
            var out = [];
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                if (!(f instanceof File)) continue;
                // For Compositions skip the .aep itself; show only manifest .json
                if (category === "Compositions" && /\.aep$/i.test(f.name)) continue;
                out.push({
                    name:     f.displayName || f.name,
                    path:     f.fsName,
                    modified: f.modified ? f.modified.getTime() : 0
                });
            }
            out.sort(function (a, b) { return b.modified - a.modified; });
            return out;
        });
    }

    // ---------- Apply / Import ----------

    function applyExpression(file) {
        file.encoding = "UTF-8";
        file.open("r"); var raw = file.read(); file.close();
        var data = JSON.parse(raw);
        var comp = OF.U.activeComp();
        if (!comp) throw new Error("Open a composition first.");
        var sel = comp.selectedProperties || [];
        if (!sel.length) throw new Error("Select a target property in the timeline.");
        var n = 0;
        for (var i = 0; i < sel.length; i++) {
            if (sel[i].propertyType === PropertyType.PROPERTY && sel[i].canSetExpression) {
                sel[i].expression = data.code;
                n++;
            }
        }
        if (!n) throw new Error("None of the selected properties accept expressions.");
        return { applied: n, name: data.name };
    }

    function applyAnimation(file) {
        file.encoding = "UTF-8";
        file.open("r"); var raw = file.read(); file.close();
        var data = JSON.parse(raw);
        var sel = OF.U.selectedLayers();
        if (!sel.length) throw new Error("Select target layer(s).");
        var n = 0;
        for (var li = 0; li < sel.length; li++) {
            var L = sel[li];
            for (var pn in data.transform) {
                if (!data.transform.hasOwnProperty(pn)) continue;
                var p = L.transform[pn];
                if (!p) continue;
                var entry = data.transform[pn];
                try {
                    while (p.numKeys > 0) p.removeKey(1);
                    p.expression = "";
                    if (entry.expr) p.expression = entry.expr;
                    for (var k = 0; k < entry.keys.length; k++) {
                        p.setValueAtTime(entry.keys[k].time, entry.keys[k].value);
                    }
                } catch (e) {}
            }
            n++;
        }
        return { applied: n, name: data.name };
    }

    function applyEffectPreset(file) {
        var sel = OF.U.selectedLayers();
        if (!sel.length) throw new Error("Select target layer(s).");
        for (var i = 0; i < sel.length; i++) sel[i].applyPreset(file);
        return { applied: sel.length };
    }

    function runScript(file) {
        file.encoding = "UTF-8";
        file.open("r"); var code = file.read(); file.close();
        try { eval(code); return { ran: true }; }
        catch (e) { throw new Error("Script error: " + e.toString() + " (line " + (e.line || "?") + ")"); }
    }

    function importComposition(file) {
        // file is the manifest .json; read the aepFile path it points to.
        file.encoding = "UTF-8";
        file.open("r"); var raw = file.read(); file.close();
        var data = JSON.parse(raw);
        var aep = new File(data.aepFile);
        if (!aep.exists) throw new Error("Original .aep missing: " + data.aepFile);
        var io = new ImportOptions(aep);
        io.importAs = ImportAsType.PROJECT;
        var folder = app.project.importFile(io);
        return { imported: aep.name, intoFolder: folder ? folder.name : "(merged)", compName: data.compName };
    }

    function applyAsset(args) {
        return OF.U.safe("Vault: Apply", function () {
            if (!args.path) throw new Error("Path required.");
            var f = new File(args.path);
            if (!f.exists) throw new Error("Asset file missing: " + args.path);
            var nm = f.name.toLowerCase();
            if (/\.json$/.test(nm)) {
                f.encoding = "UTF-8";
                f.open("r"); var raw = f.read(); f.close();
                var t = "";
                try { t = (JSON.parse(raw).type || "").toLowerCase(); } catch (e) {}
                if (t === "expression")  return applyExpression(f);
                if (t === "animation")   return applyAnimation(f);
                if (t === "composition") return importComposition(f);
                throw new Error("Unknown asset type in JSON: " + t);
            }
            if (/\.jsx$/.test(nm)) return runScript(f);
            if (/\.ffx$/.test(nm)) return applyEffectPreset(f);
            if (/\.aep$/.test(nm)) {
                var io = new ImportOptions(f);
                io.importAs = ImportAsType.PROJECT;
                var folder = app.project.importFile(io);
                return { imported: f.name, intoFolder: folder ? folder.name : "(merged)" };
            }
            throw new Error("Unknown asset type: " + nm);
        });
    }

    return {
        setRoot:           setRoot,
        getRoot:           getRoot,
        saveExpression:    saveExpression,
        saveScript:        saveScript,
        saveAnimation:     saveAnimation,
        saveEffectPreset:  saveEffectPreset,
        saveComposition:   saveComposition,
        listLibrary:       listLibrary,
        applyAsset:        applyAsset,
        applyExpression:   function (args) { return OF.U.safe("Apply Expression", function () { return applyExpression(new File(args.path)); }); }
    };
})();
