/**
 * OF.Vault - Auto-managed library for reusable assets.
 *
 * Library path is created automatically on first use. No folder picker.
 *   Windows: %APPDATA%\OmniForgeLibrary\
 *   macOS:   ~/Library/Application Support/OmniForgeLibrary/
 *
 * Three categories the user actually wants:
 *   /Effects/        - .ffx animation preset (entire effect stack + values)
 *   /Expressions/    - .json with {code}
 *   /Compositions/   - .aep snippet you can re-import + sidecar manifest
 */
$.global.OF = $.global.OF || {};
OF = $.global.OF;

OF.Vault = (function () {

    function defaultRoot() {
        var base = Folder.userData ? Folder.userData.fsName : null;
        if (!base) return null;
        return base + "/OmniForgeLibrary";
    }

    function configFile() {
        var udFolder = Folder.userData.fsName + "/OmniForge";
        var f = new Folder(udFolder);
        if (!f.exists) f.create();
        return new File(udFolder + "/vault.json");
    }
    function readConfig() {
        var f = configFile();
        if (!f.exists) return {};
        try { f.open("r"); var raw = f.read(); f.close(); return JSON.parse(raw) || {}; }
        catch (e) { return {}; }
    }
    function writeConfig(cfg) {
        var f = configFile();
        f.encoding = "UTF-8";
        f.open("w"); f.write(JSON.stringify(cfg)); f.close();
    }



    function ensureRoot() {
        var cfg = readConfig();
        var rootPath = cfg.root || defaultRoot();
        if (!rootPath) throw new Error("Cannot determine user-data folder for library.");
        var folder = new Folder(rootPath);
        if (!folder.exists && !folder.create()) {
            throw new Error("Could not create library folder: " + rootPath);
        }
        ["Compositions", "Effects", "Expressions"].forEach(function (sub) {
            var sf = new Folder(rootPath + "/" + sub);
            if (!sf.exists) sf.create();
        });
        if (!cfg.root) { cfg.root = rootPath; writeConfig(cfg); }
        return rootPath;
    }

    function safeName(n) {
        return String(n || "asset").replace(/[\\\/:*?"<>|]/g, "_");
    }
    function uniqueName(folder, base, ext) {
        var name = base;
        var i = 1;
        while (new File(folder + "/" + name + ext).exists) {
            name = base + " (" + (++i) + ")";
        }
        return name;
    }

    function getRoot() {
        return OF.U.safeNoUndo(function () { return ensureRoot(); });
    }

    function openInExplorer() {
        return OF.U.safeNoUndo(function () {
            var rootPath = ensureRoot();
            new Folder(rootPath).execute();
            return rootPath;
        });
    }



    function saveExpression(args) {
        return OF.U.safe("Vault: Save Expression", function () {
            if (!args.name) throw new Error("Name required.");
            var root = ensureRoot();
            var code = args.code || "";
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
            if (!code) throw new Error("Paste expression code, or select a property in the timeline that has an expression.");
            var folder = root + "/Expressions";
            var name = uniqueName(folder, safeName(args.name), ".json");
            var f = new File(folder + "/" + name + ".json");
            f.encoding = "UTF-8";
            f.open("w");
            f.write(JSON.stringify({ type: "expression", name: args.name, code: code, saved: new Date().toISOString() }));
            f.close();
            return { saved: f.fsName, name: name };
        });
    }

    function saveEffectPreset(args) {
        return OF.U.safe("Vault: Save Effect Preset", function () {
            if (!args.name) throw new Error("Name required.");
            var root = ensureRoot();
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select a layer with effects to save.");
            var L = sel[0];
            try {
                if (!L.Effects || L.Effects.numProperties === 0) {
                    throw new Error("Selected layer has no effects.");
                }
            } catch (e) {}
            var folder = root + "/Effects";
            var name = uniqueName(folder, safeName(args.name), ".ffx");
            var f = new File(folder + "/" + name + ".ffx");
            L.saveToPreset(f);
            return { saved: f.fsName, name: name };
        });
    }



    function saveComposition(args) {
        return OF.U.safe("Vault: Save Composition", function () {
            if (!args.name) throw new Error("Name required.");
            var root = ensureRoot();
            var comp = OF.U.activeComp();
            if (!comp) throw new Error("No active composition. Open one in the Project panel first.");
            if (!app.project.file) {
                throw new Error("Save your project (File > Save) at least once first - then save the composition to library.");
            }
            var origPath = app.project.file.fsName;
            var folder = root + "/Compositions";
            var name = uniqueName(folder, safeName(args.name), ".aep");
            var aepFile = new File(folder + "/" + name + ".aep");

            app.project.save(aepFile);
            try { app.open(new File(origPath)); } catch (e) {}

            var manifest = new File(folder + "/" + name + ".json");
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
            return { saved: aepFile.fsName, name: name, comp: comp.name };
        });
    }

    function listLibrary(args) {
        return OF.U.safeNoUndo(function () {
            var root = ensureRoot();
            var category = args.category || "Effects";
            var folder = new Folder(root + "/" + category);
            if (!folder.exists) return [];
            var files = folder.getFiles();
            var out = [];
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                if (!(f instanceof File)) continue;
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



    function applyExpressionFile(file) {
        file.encoding = "UTF-8";
        file.open("r"); var raw = file.read(); file.close();
        var data = JSON.parse(raw);
        var comp = OF.U.activeComp();
        if (!comp) throw new Error("Open a composition first.");
        var sel = comp.selectedProperties || [];
        if (!sel.length) throw new Error("Select a target property in the timeline first.");
        var n = 0;
        for (var i = 0; i < sel.length; i++) {
            if (sel[i].propertyType === PropertyType.PROPERTY && sel[i].canSetExpression) {
                try { sel[i].expression = data.code; n++; } catch (e) {}
            }
        }
        if (!n) throw new Error("None of the selected properties accept expressions.");
        return { applied: n, name: data.name };
    }

    function applyEffectPresetFile(file) {
        var sel = OF.U.selectedLayers();
        if (!sel.length) throw new Error("Select target layer(s) to apply the effect preset to.");
        var failed = [];
        var ok = 0;
        for (var i = 0; i < sel.length; i++) {
            try { sel[i].applyPreset(file); ok++; }
            catch (e) { failed.push(sel[i].name + ": " + e.toString()); }
        }
        if (!ok) throw new Error("Could not apply preset. " + (failed[0] || ""));
        return { applied: ok, failed: failed.length };
    }

    function importCompositionFile(manifestFile) {
        manifestFile.encoding = "UTF-8";
        manifestFile.open("r"); var raw = manifestFile.read(); manifestFile.close();
        var data = JSON.parse(raw);
        var aep = new File(data.aepFile);
        if (!aep.exists) throw new Error("Original .aep is missing: " + data.aepFile);
        var io = new ImportOptions(aep);
        io.importAs = ImportAsType.PROJECT;
        var folder = app.project.importFile(io);
        return { imported: aep.name, intoFolder: folder ? folder.name : "(merged)", compName: data.compName };
    }



    function applyAsset(args) {
        return OF.U.safe("Vault: Apply", function () {
            if (!args.path) throw new Error("Path required.");
            var f = new File(args.path);
            if (!f.exists) throw new Error("Asset file missing.");
            var nm = f.name.toLowerCase();
            if (/\.ffx$/.test(nm)) return applyEffectPresetFile(f);
            if (/\.json$/.test(nm)) {
                f.encoding = "UTF-8"; f.open("r"); var raw = f.read(); f.close();
                var t = ""; try { t = (JSON.parse(raw).type || "").toLowerCase(); } catch (e) {}
                if (t === "expression")  return applyExpressionFile(f);
                if (t === "composition") return importCompositionFile(f);
                throw new Error("Unknown asset type: " + (t || "(none)"));
            }
            throw new Error("Unsupported file type: " + nm);
        });
    }

    function deleteAsset(args) {
        return OF.U.safeNoUndo(function () {
            if (!args.path) throw new Error("Path required.");
            var f = new File(args.path);
            if (!f.exists) throw new Error("File not found.");
            // For composition manifests, also delete the .aep
            if (/\.json$/.test(f.name)) {
                try {
                    f.encoding = "UTF-8"; f.open("r"); var raw = f.read(); f.close();
                    var data = JSON.parse(raw);
                    if (data.type === "composition" && data.aepFile) {
                        var aep = new File(data.aepFile);
                        if (aep.exists) aep.remove();
                    }
                } catch (e) {}
            }
            f.remove();
            return { deleted: args.path };
        });
    }

    return {
        getRoot:           getRoot,
        openInExplorer:    openInExplorer,
        saveExpression:    saveExpression,
        saveEffectPreset:  saveEffectPreset,
        saveComposition:   saveComposition,
        listLibrary:       listLibrary,
        applyAsset:        applyAsset,
        deleteAsset:       deleteAsset
    };
})();
