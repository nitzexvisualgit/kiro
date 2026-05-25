/**
 * Router - simple tab manager that lazily renders each tab's content into #content.
 */
(function (global) {
  "use strict";

  var routes = {};
  var current = null;

  function register(name, mountFn) {
    routes[name] = mountFn;
  }

  function go(name) {
    if (!routes[name]) {
      console.warn("Unknown route: " + name);
      return;
    }
    current = name;
    var content = document.getElementById("content");
    content.innerHTML = "";
    try {
      routes[name](content);
    } catch (e) {
      content.innerHTML = '<div class="empty"><div class="icon">⚠</div>Failed to load tab: ' + e.message + '</div>';
      console.error(e);
    }
    // sync tabs
    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("active", tabs[i].dataset.tab === name);
    }
  }

  function init() {
    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function (e) {
        go(e.currentTarget.dataset.tab);
      });
    }
    // open external links via system browser
    document.body.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-link]");
      if (a) { e.preventDefault(); Bridge.cs.openURLInDefaultBrowser(a.dataset.link); }
    });
  }

  global.Router = { register: register, go: go, init: init, current: function () { return current; } };
})(window);
