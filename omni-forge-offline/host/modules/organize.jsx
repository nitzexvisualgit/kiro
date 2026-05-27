/**
 * OF.Organize - Auto-bin every project item into category folders.
 *   Compositions / Solids / Images / Vectors / Audio / Video / Sequences / Misc
 * Idempotent: running twice doesn't duplicate folders.
 */
OF.Organize = (function () {
    var BINS = {
        Compositions: { match: function (it) { return it instanceof CompItem; } },
        Solids:       { match: function (it) { return it instanceof FootageItem && it.mainSource instanceof SolidSource; } },
        Images:       { ext: ["jpg","jpeg","png","tif","tiff","bmp","heic","webp","gif","exr","hdr","dpx"] },
        Vectors:      { ext: ["ai","eps","svg","pdf"] },
        Audio:        { ext: ["mp3","wav","aac","aif","aiff","m4a","flac","ogg","wma"] },
        Video:        { ext: ["mp4","mov","avi","mkv","mxf","prores","webm","r3d","braw","m4v","mpg","mpeg"] },
        Sequences:    { match: function (it) { return it instanceof FootageItem && it.mainSource && it.mainSource.isStill === false && it.duration > 0 && /\[\d+-\d+\]|\#\#\#/.test(it.name); } },
        Misc:         { match: function () { return true; } }
    };

    function extOf(name) {
        var m = /\.([a-z0-9]+)$/i.exec(name || "");
        return m ? m[1].toLowerCase() : "";
    }

    function classify(item) {
        if (BINS.Compositions.match(item)) return "Compositions";
        if (item instanceof FolderItem) return null;
        if (BINS.Solids.match(item)) return "Solids";
        if (BINS.Sequences.match(item)) return "Sequences";
        var e = extOf(item.name);
        for (var k in BINS) {
            if (BINS[k].ext) {
                for (var i = 0; i < BINS[k].ext.length; i++) if (BINS[k].ext[i] === e) return k;
            }
        }
        return "Misc";
    }


    function ensureFolder(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof FolderItem && it.name === name && it.parentFolder === app.project.rootFolder) return it;
        }
        return app.project.items.addFolder(name);
    }

    function run(args) {
        return OF.U.safe("Organize Project", function () {
            if (app.project.numItems === 0) throw new Error("Project is empty.");
            var prefix = (args && args.prefix) ? args.prefix : "_";
            var folders = {};
            // First pass - scan everything (skip our own folders)
            var items = [];
            for (var i = 1; i <= app.project.numItems; i++) items.push(app.project.item(i));

            var moved = 0;
            for (var j = 0; j < items.length; j++) {
                var it = items[j];
                if (!it || it instanceof FolderItem) continue;
                // Skip if already inside one of our bins
                if (it.parentFolder && it.parentFolder.name && it.parentFolder.name.indexOf(prefix) === 0) continue;
                var bucket = classify(it);
                if (!bucket) continue;
                var folderName = prefix + bucket;
                if (!folders[folderName]) folders[folderName] = ensureFolder(folderName);
                it.parentFolder = folders[folderName];
                moved++;
            }

            // Cleanup: remove any of our bins that ended up empty
            for (var name in folders) {
                if (folders[name].numItems === 0) folders[name].remove();
            }
            return { moved: moved, folders: (function(){ var a=[]; for (var n in folders) if (folders[n].numItems>0) a.push(n); return a; })() };
        });
    }
    return { run: run };
})();
