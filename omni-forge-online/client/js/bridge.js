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
      // Need to boot. Inject the extension root and re-evaluate main.jsx
      // with FULL diagnostic capture so the user sees the real error.
      var extRoot = cs.getSystemPath(SystemPath.EXTENSION);
      var safe = escapeForES(extRoot);
      var bootScript =
        '$.global._OF_EXT_ROOT = "' + safe + '"; ' +
        '$.global._OF_BOOT_LOG = []; ' +
        'try { ' +
          'var __mf = new File("' + safe + '/host/main.jsx"); ' +
          '$.global._OF_BOOT_LOG.push("main.jsx exists=" + __mf.exists); ' +
          'if (__mf.exists) $.evalFile(__mf); ' +
          'else $.global._OF_BOOT_LOG.push("PATH=" + __mf.fsName); ' +
        '} catch (e) { ' +
          '$.global._OF_BOOT_LOG.push("evalFile threw: " + e.toString() + " (line " + (e.line||"?") + ")"); ' +
        '} ' +
        '(typeof $.__omniForgeDispatch === "function" && typeof OF !== "undefined" && typeof OF.U !== "undefined") ' +
          '? "ready" ' +
          ': ("BOOT_FAIL | " + (typeof OF==="undefined"?"OF=undefined":(typeof OF.U==="undefined"?"OF.U=undefined":"dispatcher=missing")) + " | log: " + $.global._OF_BOOT_LOG.join("; ") + " | extRoot=' + safe + '")';
      return rawEval(bootScript).then(function (r) {
        if (r === "ready") return true;
        throw new Error(r || "Host engine returned no response. Restart AE and try again.");
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


// ============================================================
// Diagnostic helper - call Bridge.diagnostic() from console or
// the Studio tab to get full state for support.
// ============================================================
(function () {
  function diagnostic() {
    var fs = (typeof require !== "undefined") ? (function(){ try { return require("fs"); } catch(e){ return null; } })() : null;
    var path = (typeof require !== "undefined") ? (function(){ try { return require("path"); } catch(e){ return null; } })() : null;
    var extRoot = window.Bridge.extensionRoot;
    var report = {
      time: new Date().toISOString(),
      extensionRoot: extRoot,
      isWin: window.Bridge.isWin,
      isMac: window.Bridge.isMac
    };
    if (fs && path) {
      report.installedVersion = (function(){ try { return fs.readFileSync(path.join(extRoot, ".installed-version"),"utf8").trim(); } catch(e){ return "(missing)"; } })();
      report.hasBridgeJs    = fs.existsSync(path.join(extRoot, "client", "js", "bridge.js"));
      report.hasMainJsx     = fs.existsSync(path.join(extRoot, "host", "main.jsx"));
      report.hasUtilsJsx    = fs.existsSync(path.join(extRoot, "host", "lib", "utils.jsx"));
      report.modulesPresent = (function(){ try { return fs.readdirSync(path.join(extRoot, "host", "modules")); } catch(e){ return []; } })();
    } else {
      report.fs = "node fs unavailable";
    }
    return window.Bridge.rawEval(
      'JSON.stringify({' +
        'OF: typeof OF, ' +
        'OF_U: typeof OF !== "undefined" ? typeof OF.U : "n/a", ' +
        'dispatcher: typeof $.__omniForgeDispatch, ' +
        'extRoot: $.global._OF_EXT_ROOT || "(not set)", ' +
        'bootLog: ($.global._OF_BOOT_LOG || []).join("; "), ' +
        'fileName: $.fileName || "(empty)"' +
      '})'
    ).then(function (raw) {
      try { report.host = JSON.parse(raw); } catch (e) { report.host = { raw: raw }; }
      return report;
    });
  }
  window.Bridge.diagnostic = diagnostic;
})();
