/**
 * Bridge - the only safe path between the HTML panel and ExtendScript host.
 * Every call returns a Promise. Every error is captured.
 *
 * Boot sequence (works around unreliable $.fileName in CEP):
 *   1. First time call() is invoked, the panel injects the extension root path
 *      into the ExtendScript engine via $.global._OF_EXT_ROOT.
 *   2. Panel evalFiles host/main.jsx using the known absolute path.
 *   3. main.jsx loads all feature modules using the injected root.
 *   4. Subsequent calls just dispatch through $.__omniForgeDispatch.
 *
 * If anything fails we surface a real error message instead of "Empty response".
 */
(function (global) {
  "use strict";

  var cs = new CSInterface();
  var ext = cs.getExtensionID();
  var hostBootPromise = null;

  function escapeForES(s) {
    return String(s)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n");
  }

  function rawEval(script) {
    return new Promise(function (resolve) {
      cs.evalScript(script, function (raw) { resolve(raw); });
    });
  }

  // Probe expression run on the host: returns "ready" only if the dispatcher
  // AND the OF namespace AND OF.U (utils) are all present. Module-load can
  // silently fail and leave just the dispatcher behind, which is the bug
  // that produced "Empty response from host" errors.
  var PROBE = '(typeof $.__omniForgeDispatch === "function" && typeof OF !== "undefined" && typeof OF.U !== "undefined") ? "ready" : "boot"';



  function ensureHost() {
    if (hostBootPromise) return hostBootPromise;
    hostBootPromise = rawEval(PROBE).then(function (status) {
      if (status === "ready") return true;
      // Need to boot. Inject the extension root and re-evaluate main.jsx.
      var extRoot = cs.getSystemPath(SystemPath.EXTENSION);
      var safe = escapeForES(extRoot);
      var bootScript =
        '$.global._OF_EXT_ROOT = "' + safe + '"; ' +
        'try { $.evalFile(new File("' + safe + '/host/main.jsx")); } catch (e) { e.toString(); } ' +
        PROBE;
      return rawEval(bootScript).then(function (r) {
        if (r === "ready") return true;
        throw new Error("Host engine failed to load. Try restarting After Effects. (status: " + r + ")");
      });
    }).catch(function (e) {
      hostBootPromise = null;
      throw e;
    });
    return hostBootPromise;
  }

  function parseEnvelope(raw) {
    if (raw === undefined || raw === null || raw === "") {
      return { ok: false, error: "Empty response from host (engine may not be loaded)" };
    }
    if (raw === "EvalScript error.") {
      return { ok: false, error: "ExtendScript syntax/runtime error in host" };
    }
    try { return JSON.parse(raw); }
    catch (e) { return { ok: true, data: raw }; }
  }

  function call(fnPath, payload) {
    return ensureHost().then(function () {
      return new Promise(function (resolve, reject) {
        var args = JSON.stringify(payload || {});
        var script = '$.__omniForgeDispatch("' + fnPath + '", "' + escapeForES(args) + '")';
        cs.evalScript(script, function (raw) {
          var env = parseEnvelope(raw);
          if (env.ok) resolve(env.data);
          else {
            var err = new Error(env.error || "Host error");
            err.stack = env.stack || "";
            reject(err);
          }
        });
      });
    });
  }



  function exec(jsxString) {
    return ensureHost().then(function () { return rawEval(jsxString); });
  }

  function toast(message, type) {
    var ev = new CustomEvent("of:toast", { detail: { message: message, type: type || "info" } });
    document.dispatchEvent(ev);
  }

  global.Bridge = {
    call:           call,
    exec:           exec,
    rawEval:        rawEval,
    ensureHost:     ensureHost,
    toast:          toast,
    cs:             cs,
    extensionId:    ext,
    extensionRoot:  cs.getSystemPath(SystemPath.EXTENSION),
    userDataRoot:   cs.getSystemPath(SystemPath.USER_DATA),
    isMac:          cs.getOSInformation().indexOf("Mac") >= 0,
    isWin:          cs.getOSInformation().indexOf("Windows") >= 0
  };
})(window);
