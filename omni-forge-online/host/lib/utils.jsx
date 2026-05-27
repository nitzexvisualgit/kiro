/**
 * Omni Forge - Host utilities.
 * Safe AE primitives, error-boxed wrappers, type guards.
 *
 * IMPORTANT: OF is stored on $.global so it survives across IIFE scopes
 * and is reachable by the dispatcher (which is registered outside the
 * loader IIFE in main.jsx). Storing it as a `var` made it disappear after
 * main.jsx's loader finished, causing "OF is undefined" at dispatch time.
 */

if (!$.global.OF) $.global.OF = {};
var OF = $.global.OF;

OF.U = (function () {
  function isComp(item) {
    return item && (item instanceof CompItem);
  }
  function activeComp() {
    var c = app.project.activeItem;
    return isComp(c) ? c : null;
  }
  function selectedLayers() {
    var c = activeComp();
    if (!c) return [];
    var sel = c.selectedLayers;
    var out = [];
    for (var i = 0; i < sel.length; i++) out.push(sel[i]);
    return out;
  }
  function allLayers(comp) {
    var out = [];
    for (var i = 1; i <= comp.numLayers; i++) out.push(comp.layer(i));
    return out;
  }
  function envelope(ok, data, err) {
    if (ok) return JSON.stringify({ ok: true, data: (data === undefined ? null : data) });
    return JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err), stack: (err && err.stack) || "" });
  }
  function safe(label, fn) {
    try {
      app.beginUndoGroup("Omni Forge: " + label);
      var result = fn();
      app.endUndoGroup();
      return envelope(true, result);
    } catch (e) {
      try { app.endUndoGroup(); } catch (_) {}
      return envelope(false, null, e);
    }
  }
  function safeNoUndo(fn) {
    try { return envelope(true, fn()); }
    catch (e) { return envelope(false, null, e); }
  }
  function findOrCreateFolder(name, parent) {
    parent = parent || app.project.rootFolder;
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof FolderItem && it.name === name && it.parentFolder === parent) return it;
    }
    return app.project.items.addFolder(name);
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  return {
    isComp: isComp,
    activeComp: activeComp,
    selectedLayers: selectedLayers,
    allLayers: allLayers,
    envelope: envelope,
    safe: safe,
    safeNoUndo: safeNoUndo,
    findOrCreateFolder: findOrCreateFolder,
    clamp: clamp
  };
})();
