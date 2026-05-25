/**
 * OF.Vault - Save/load library system.
 * Stores 4 categories under a user-chosen library root:
 *   /Compositions/   -> .aep snippets via project.save (we save sub-projects)
 *   /Effects/        -> .ffx files via Animation Preset save
 *   /Expressions/    -> .json {name, code, property}
 *   /Animations/     -> .json {name, payload}
 *
 * On first run, the panel asks the user to pick a folder; we persist it in user_data.
 */
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

    function setRoot(args) {
        return OF.U.safeNoUndo(function () {
            if (!args.path) throw new Error("Path is required.");
            var folder = new Folder(args.path);
            if (!folder.exists) folder.create();
            // Ensure subfolders exist
            ["Compositions", "Effects", "Expressions", "Animations"].forEach(function (sub) {
                var s = new Folder(args.path + "/" + sub);
                if (!s.exists) s.create();
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


    function requireRoot() {
        var cfg = readConfig();
        if (!cfg.root) throw new Error("Set the Vault library folder first.");
        return cfg.root;
    }

    function saveExpression(args) {
        return OF.U.safe("Vault: Save Expression", function () {
            var root = requireRoot();
            if (!args.name || !args.code) throw new Error("Name and code are required.");
            var safeName = args.name.replace(/[\\\/:*?"<>|]/g, "_");
            var file = new File(root + "/Expressions/" + safeName + ".json");
            file.encoding = "UTF-8";
            file.open("w");
            file.write(JSON.stringify({ name: args.name, property: args.property || "", code: args.code, when: new Date().toISOString() }));
            file.close();
            return { saved: file.fsName };
        });
    }

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
                out.push({ name: f.name, path: f.fsName, modified: f.modified ? f.modified.getTime() : 0 });
            }
            out.sort(function (a, b) { return b.modified - a.modified; });
            return out;
        });
    }

    function applyExpression(args) {
        return OF.U.safe("Vault: Apply Expression", function () {
            var f = new File(args.path);
            if (!f.exists) throw new Error("Expression file missing.");
            f.open("r"); var raw = f.read(); f.close();
            var data = JSON.parse(raw);
            var sel = OF.U.activeComp() ? OF.U.activeComp().selectedProperties : [];
            if (!sel || !sel.length) throw new Error("Select target property in the timeline.");
            var n = 0;
            for (var i = 0; i < sel.length; i++) {
                if (sel[i].propertyType === PropertyType.PROPERTY && sel[i].canSetExpression) {
                    sel[i].expression = data.code;
                    n++;
                }
            }
            return { applied: n };
        });
    }

    function saveAnimationPreset(args) {
        return OF.U.safe("Vault: Save Animation Preset", function () {
            var root = requireRoot();
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select a layer with effects/animation to save.");
            var safeName = (args.name || "Preset").replace(/[\\\/:*?"<>|]/g, "_");
            var file = new File(root + "/Effects/" + safeName + ".ffx");
            sel[0].saveToPreset(file);
            return { saved: file.fsName };
        });
    }
    return { setRoot: setRoot, getRoot: getRoot, saveExpression: saveExpression, listLibrary: listLibrary, applyExpression: applyExpression, saveAnimationPreset: saveAnimationPreset };
})();
