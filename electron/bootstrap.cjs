/**
 * Load before Electron so Linux Chromium sandbox can be relaxed when needed.
 * Set OMF_PRESERVE_CHROMIUM_SANDBOX=1 to try the default sandbox (may fail under AppImage/FUSE).
 */
if (
  process.platform === "linux" &&
  !process.env.OMF_PRESERVE_CHROMIUM_SANDBOX
) {
  process.env.ELECTRON_DISABLE_SANDBOX ??= "1";
}
require("./main.cjs");
