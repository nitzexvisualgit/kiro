# Troubleshooting

## "Empty response from host" — most common cause

The installer can't replace files that After Effects has open. If you ran `install.bat` while AE was running, you got a half-update with old broken files. v1.0.1+ refuses to install while AE is open.

**Fix:**
1. Quit After Effects **completely** (Ctrl+Q on Windows, Cmd+Q on Mac).
2. Verify in Task Manager / Activity Monitor that no `AfterFX.exe` / `After Effects` process remains.
3. **Re-download** the latest ZIP from https://github.com/nitzexvisualgit/kiro
4. Run the installer again. It will refuse to proceed if AE is still running.
5. Reopen AE → Window → Extensions → Omni Forge.

---

## How to verify the new version is actually installed

The new build leaves a marker file at:

- **Windows:** `%APPDATA%\Adobe\CEP\extensions\com.nitzexvisual.omniforge\.installed-version`
- **Mac:** `~/Library/Application Support/Adobe/CEP/extensions/com.nitzexvisual.omniforge/.installed-version`

Open it in a text editor. If it reads `1.0.1`, the new build is in place. If the file is missing, the old build is still there — re-run the installer with AE closed.

You can also open the bridge.js file:

- **Windows:** `%APPDATA%\Adobe\CEP\extensions\com.nitzexvisual.omniforge\client\js\bridge.js`

Look near the top — it should contain a comment block mentioning "Boot sequence (works around unreliable $.fileName in CEP)". If it doesn't, the old version is still installed.

---

## If you still get an error after reinstalling correctly

The new error toasts are **clickable** — clicking copies the full error text to your clipboard. Click the red toast, then paste the contents back to me. The new bridge captures the actual host-side failure (missing file paths, evalFile exceptions, module load errors) instead of the generic "empty response".

If the toast is still empty/generic, run the diagnostic from Chrome DevTools:

1. With AE open and Omni Forge panel visible, open Chrome → `http://localhost:8088`
2. Click the entry for Omni Forge to open DevTools
3. In Console, run: `Bridge.diagnostic().then(r => console.log(JSON.stringify(r, null, 2)))`
4. Send me the output — it shows exactly which files exist, what loaded, and what didn't.

---

## "Window → Extensions doesn't show Omni Forge"

PlayerDebugMode wasn't set. Re-run the installer **as administrator** (Windows) or with `sudo bash` (Mac) and restart AE.

---

## Mac: "cannot be opened because the developer cannot be verified"

Run once in Terminal:
```bash
xattr -dr com.apple.quarantine ~/Library/Application\ Support/Adobe/CEP/extensions/com.nitzexvisual.omniforge
```
