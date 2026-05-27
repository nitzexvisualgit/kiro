# Installation Guide

Omni Forge ships as an **Adobe CEP extension** — the same format used by Animation Composer, Motion Bro, and every commercial AE plugin. There is no `.exe` for the panel itself; the installer is a small script that drops the extension into Adobe's CEP folder and enables debug-mode loading.

> **Why not an .exe?** Adobe doesn't allow executables to run *inside* After Effects. Every commercial AE panel uses CEP. The `.bat`/`.sh` "installers" we ship simply automate the file copy + registry tweak.

---

## Windows

### Quick install
1. Unzip the package (e.g. to `Downloads\omni-forge\`)
2. Right-click `installers\windows\install.bat` → **Run as administrator**
3. Quit and reopen After Effects
4. **Window → Extensions → Omni Forge**

### Manual install (if the script fails)
1. Open `%APPDATA%\Adobe\CEP\extensions\` (paste into Explorer's address bar)
2. Create a folder named `com.nitzexvisual.omniforge`
3. Copy the contents of the unzipped `omni-forge` folder into it
4. Enable debug mode (one time only) — open Registry Editor, navigate to:
   `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` (or .9, .10, .12, .13 depending on AE version)
   Add a string value `PlayerDebugMode = 1`
5. Restart AE

### Uninstall
Run `installers\windows\uninstall.bat` — or delete the folder under `%APPDATA%\Adobe\CEP\extensions\`.

---

## macOS

### Quick install
1. Unzip the package
2. Open **Terminal**, drag the `omni-forge` folder onto it (this `cd`s in)
3. Run: `bash installers/mac/install.sh`
4. Quit and reopen After Effects
5. **Window → Extensions → Omni Forge**

If you see *"cannot be opened because the developer cannot be verified"*, run:
```bash
xattr -dr com.apple.quarantine ~/Library/Application\ Support/Adobe/CEP/extensions/com.nitzexvisual.omniforge
```

### Manual install
1. Open Finder → press `Cmd+Shift+G` → paste:
   `~/Library/Application Support/Adobe/CEP/extensions/`
2. Create folder `com.nitzexvisual.omniforge`
3. Copy contents of `omni-forge` into it
4. Enable debug mode (one time):
   ```bash
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   ```
   (replace `11` with `9`/`10`/`12`/`13` if needed)
5. Restart AE

### Uninstall
Run `installers/mac/uninstall.sh`.

---

## Compatibility

| AE Version            | CSXS  | Tested |
|-----------------------|-------|--------|
| AE 2020 (17.x)        | 9     | ✅     |
| AE 2021 (18.x)        | 10    | ✅     |
| AE 2022 (22.x)        | 11    | ✅     |
| AE 2023 (23.x)        | 11    | ✅     |
| AE 2024 (24.x)        | 12    | ✅     |
| AE 2025 / Beta (25.x) | 13    | ✅     |

Both Intel and Apple Silicon Macs are supported.

---

## Production signing (optional but recommended)

For a fully production-grade `.zxp` install with no debug-mode requirement:

1. Buy a code-signing certificate (Sectigo / DigiCert)
2. Use [ZXPSignCmd](https://github.com/Adobe-CEP/CEP-Resources) to sign:
   ```bash
   ZXPSignCmd -sign omni-forge omni-forge.zxp cert.p12 PASSWORD
   ```
3. Distribute the `.zxp` and tell users to install via [ZXP Installer](https://aescripts.com/learn/zxp-installer/) — no debug-mode toggling required.

The unsigned route via `install.bat`/`install.sh` is perfectly fine for direct customers.
