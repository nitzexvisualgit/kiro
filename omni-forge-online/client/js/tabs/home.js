Router.register("home", function (root) {
  root.innerHTML =
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Welcome</div></div>' +
      '<p style="color:var(--fg-2); font-size:var(--fs-sm); line-height:1.6">' +
        'Omni Forge is your motion graphics command center. Eight surgical workspaces ' +
        'engineered to remove every repetitive task between idea and finish.' +
      '</p>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Quick Stats</div></div>' +
      '<div class="grid-3">' +
        '<div style="padding:var(--s-3); background:var(--bg-2); border-radius:var(--r-2); text-align:center"><div style="font-size:var(--fs-2xl); color:var(--primary); font-weight:600">8</div><div style="font-size:var(--fs-xs); color:var(--fg-3); text-transform:uppercase; letter-spacing:.05em">Workspaces</div></div>' +
        '<div style="padding:var(--s-3); background:var(--bg-2); border-radius:var(--r-2); text-align:center"><div style="font-size:var(--fs-2xl); color:var(--primary); font-weight:600">60+</div><div style="font-size:var(--fs-xs); color:var(--fg-3); text-transform:uppercase; letter-spacing:.05em">Tools</div></div>' +
        '<div style="padding:var(--s-3); background:var(--bg-2); border-radius:var(--r-2); text-align:center"><div style="font-size:var(--fs-2xl); color:var(--primary); font-weight:600">20+</div><div style="font-size:var(--fs-xs); color:var(--fg-3); text-transform:uppercase; letter-spacing:.05em">Animations</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="card">' +
      '<div class="card-header"><div class="card-title">Jump To</div></div>' +
      '<div class="grid-2">' +
        '<button class="btn btn-block" data-go="forge">Forge</button>' +
        '<button class="btn btn-block" data-go="curveset">Curveset</button>' +
        '<button class="btn btn-block" data-go="typecast">Typecast</button>' +
        '<button class="btn btn-block" data-go="fxcore">FX Core</button>' +
        '<button class="btn btn-block" data-go="vault">Vault</button>' +
        '<button class="btn btn-block" data-go="kinetic">Kinetic</button>' +
      '</div>' +
    '</div>';

  root.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () { Router.go(b.dataset.go); });
  });
});
