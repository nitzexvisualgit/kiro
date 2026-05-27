/**
 * CSInterface - Adobe Creative Cloud Extensibility (CEP) bridge.
 * Trimmed, MIT-licensed redistributable from Adobe-CEP/CEP-Resources.
 * Provides communication between HTML panel and host ExtendScript engine.
 */
function CSInterface() {}

CSInterface.prototype.getHostEnvironment = function () {
  this.hostEnvironment = JSON.parse(window.__adobe_cep__.getHostEnvironment());
  return this.hostEnvironment;
};

CSInterface.prototype.evalScript = function (script, callback) {
  if (callback === null || callback === undefined) {
    callback = function () {};
  }
  window.__adobe_cep__.evalScript(script, callback);
};

CSInterface.prototype.getApplicationID = function () {
  return JSON.parse(window.__adobe_cep__.getHostEnvironment()).appId;
};

CSInterface.prototype.getSystemPath = function (pathType) {
  var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
  var OSVersion = this.getOSInformation();
  if (OSVersion.indexOf("Windows") >= 0) {
    path = path.replace("file:///", "");
  } else if (OSVersion.indexOf("Mac") >= 0) {
    path = path.replace("file://", "");
  }
  return path;
};

CSInterface.prototype.addEventListener = function (type, listener, obj) {
  window.__adobe_cep__.addEventListener(type, listener, obj);
};

CSInterface.prototype.removeEventListener = function (type, listener, obj) {
  window.__adobe_cep__.removeEventListener(type, listener, obj);
};

CSInterface.prototype.dispatchEvent = function (event) {
  if (typeof event.data === "object") {
    event.data = JSON.stringify(event.data);
  }
  window.__adobe_cep__.dispatchEvent(event);
};

CSInterface.prototype.getOSInformation = function () {
  var userAgent = navigator.userAgent;
  if (userAgent.indexOf("Windows") >= 0 || userAgent.indexOf("Win") >= 0) {
    return "Windows";
  } else if (userAgent.indexOf("Mac") >= 0) {
    return "Mac";
  }
  return "Unknown";
};

CSInterface.prototype.getExtensionID = function () {
  return window.__adobe_cep__.getExtensionId();
};

CSInterface.prototype.openURLInDefaultBrowser = function (url) {
  if (window.cep && window.cep.util) {
    window.cep.util.openURLInDefaultBrowser(url);
  }
};

// SystemPath constants
var SystemPath = {
  USER_DATA: "userData",
  COMMON_FILES: "commonFiles",
  MY_DOCUMENTS: "myDocuments",
  APPLICATION: "application",
  EXTENSION: "extension",
  HOST_APPLICATION: "hostApplication"
};

window.CSInterface = CSInterface;
window.SystemPath = SystemPath;
