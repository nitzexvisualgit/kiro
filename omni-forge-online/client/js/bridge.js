/**
 * Bridge - the only safe path between the HTML panel and ExtendScript host.
 * Every call returns a Promise. Every error is captured. Nothing throws into the AE crash log.
 *
 * Usage:
 *    Bridge.call('Align.center', { axis: 'h', scope: 'comp' }).then(result => ...)
 */
(function (global) {
  "use strict";

  var cs = new CSInterface();
  var ext = cs.getExtensionID();
  var pending = {};
  var rpcSeq = 0;

  // ExtendScript-side error envelope: { ok: bool, data: any, error: string, stack: string }
  function parseEnvelope(raw) {
    if (raw === undefined || raw === null || raw === "") {
      return { ok: false, error: "Empty response from host" };
    }
    if (raw === "EvalScript error.") {
      return { ok: false, error: "ExtendScript evaluation failed (syntax/runtime error in host)" };
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      // Some hosts return plain strings; treat as success payload
      return { ok: true, data: raw };
    }
  }

  function escapeForES(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  }

  /**
   * Call a host function by dotted path.
   * @param {string} fnPath  e.g. "Forge.align" or "UnPrecomp.run"
   * @param {object} payload JSON-serializable arguments
   * @returns {Promise<any>}
   */
  function call(fnPath, payload) {
    return new Promise(function (resolve, reject) {
      var args = JSON.stringify(payload || {});
      var script = '$.__omniForgeDispatch("' + fnPath + '", "' + escapeForES(args) + '")';
      cs.evalScript(script, function (raw) {
        var env = parseEnvelope(raw);
        if (env.ok) {
          resolve(env.data);
        } else {
          var err = new Error(env.error || "Host error");
          err.stack = env.stack || "";
          err.code = env.code || "HOST_ERROR";
          reject(err);
        }
      });
    });
  }

  /**
   * Run a raw ExtendScript snippet (use sparingly - prefer call()).
   */
  function exec(jsxString) {
    return new Promise(function (resolve) {
      cs.evalScript(jsxString, resolve);
    });
  }

  /**
   * Load a host .jsx file by extension-relative path.
   */
  function loadHostScript(relPath) {
    var extRoot = cs.getSystemPath(SystemPath.EXTENSION);
    var sep = cs.getOSInformation().indexOf("Windows") >= 0 ? "\\" : "/";
    var full = extRoot + sep + relPath.replace(/\//g, sep);
    var script = '$.evalFile(File("' + escapeForES(full) + '"))';
    return exec(script);
  }

  /**
   * Show a toast inside the panel (non-blocking).
   */
  function toast(message, type) {
    var ev = new CustomEvent("of:toast", { detail: { message: message, type: type || "info" } });
    document.dispatchEvent(ev);
  }

  global.Bridge = {
    call: call,
    exec: exec,
    loadHostScript: loadHostScript,
    toast: toast,
    cs: cs,
    extensionId: ext,
    extensionRoot: cs.getSystemPath(SystemPath.EXTENSION),
    userDataRoot: cs.getSystemPath(SystemPath.USER_DATA),
    isMac: cs.getOSInformation().indexOf("Mac") >= 0,
    isWin: cs.getOSInformation().indexOf("Windows") >= 0
  };
})(window);
