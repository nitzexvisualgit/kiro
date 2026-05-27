# Developer Notes

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  After Effects (host process)                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CEP Panel (Chromium-embedded, HTML/CSS/JS)              │  │
│  │   client/index.html                                      │  │
│  │   client/js/main.js  ──┐                                 │  │
│  │   client/js/router.js  │                                 │  │
│  │   client/js/tabs/*.js  │ Bridge.call("Module.fn", args)  │  │
│  │   client/js/bridge.js ─┴──→ evalScript ──┐               │  │
│  └──────────────────────────────────────────│───────────────┘  │
│                                              ▼                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ExtendScript engine ("OmniForge" target engine)         │  │
│  │   host/main.jsx       — dispatcher                       │  │
│  │   host/lib/{json2,utils}.jsx                             │  │
│  │   host/modules/*.jsx  — feature modules                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## RPC contract

Every host module exposes functions that take a parsed-JSON `args` and return either:
- `OF.U.safe("Label", function() {...})` — wraps in undo group + success/error envelope
- `OF.U.safeNoUndo(function() {...})`     — no undo group (for read-only ops)

The envelope returned to the panel is JSON: `{ ok: true, data }` or `{ ok: false, error, stack }`.

The panel calls via:
```js
Bridge.call("Align.run", { mode: "centerH", scope: "comp" })
  .then(result => ...)
  .catch(err => ...)
```

## Adding a new module

1. Create `host/modules/myfeature.jsx`:
   ```js
   OF.MyFeature = (function() {
     function doThing(args) {
       return OF.U.safe("My Thing", function() {
         // ... ExtendScript work, throw new Error() on failure ...
         return { didIt: true };
       });
     }
     return { doThing: doThing };
   })();
   ```
2. Register in `host/main.jsx`:
   ```js
   loadFile("modules/myfeature.jsx");
   ```
3. Call from a tab:
   ```js
   Bridge.call("MyFeature.doThing", { foo: 1 }).then(...)
   ```

## Debugging

- Open `chrome://inspect` while AE is running, click the panel's URL
- Or hit `localhost:8088` (configured in `.debug`)
- ExtendScript errors print to AE's `app.write()` log. To see them: `Help > Show Log Messages`
- Toggle `Bridge.cs.openURLInDefaultBrowser('chrome://inspect')` from the panel console

## Testing checklist before each release

- [ ] All 8 tabs load without console errors
- [ ] Forge: align comp, align sel, anchor 9 points, organize, precomp single, precomp separate, precomp w/ trim, **un-precomp 1 layer + multi-layer**, clipboard copy/paste/clear, explode chars/words/lines, counter
- [ ] Curveset: all 32 presets apply, drag handles updates curve, apply easing modifies keyframes
- [ ] Typecast: scan project, scan comp, replace global, replace selected
- [ ] FX Core: enable/disable/remove on each scope, probe captures matchName, manual add persists
- [ ] Vault: choose folder persists, save expression, list, apply expression
- [ ] Kinetic: each animation type, custom curve preset
- [ ] Studio: license info shown, deactivate triggers reload to gate
- [ ] License: invalid key rejected, valid key activates, 4th device blocked, deactivate frees slot
