/**
 * OpenMediaForge desktop shell (Electron).
 * Loads the Next.js UI and exposes OS authority: KV (SQLite), keychain, filesystem.
 *
 * Production / packaged: spawns the Next standalone server using the same binary
 * with ELECTRON_RUN_AS_NODE=1 (no separate Node install). Dev: loads next dev URL.
 */
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
} = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { spawn } = require("child_process");
const archiver = require("archiver");

let mainWindow = null;
let SQL = null;
let db = null;
let dbPath = null;
let persistTimer = null;
let nextChild = null;
let nextPortInUse = null;

const KEYTAR_SERVICE = "OpenMediaForge";

function getInitSqlJs() {
  const mod = require("sql.js");
  return mod.default ?? mod;
}

function resolveSqlWasmPath() {
  const candidates = [
    path.join(__dirname, "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
    path.join(
      process.resourcesPath || "",
      "app.asar.unpacked",
      "node_modules",
      "sql.js",
      "dist",
      "sql-wasm.wasm",
    ),
    path.join(
      app.getAppPath(),
      "node_modules",
      "sql.js",
      "dist",
      "sql-wasm.wasm",
    ),
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error(
    "sql.js wasm not found (expected under node_modules or app.asar.unpacked).",
  );
}

async function initDatabase() {
  const initSqlJs = getInitSqlJs();
  const wasmPath = resolveSqlWasmPath();
  SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });
  dbPath = path.join(app.getPath("userData"), "openmediaforge.sqlite");
  let buf = null;
  if (fs.existsSync(dbPath)) {
    buf = fs.readFileSync(dbPath);
  }
  db = buf ? new SQL.Database(buf) : new SQL.Database();
  db.run(
    `CREATE TABLE IF NOT EXISTS kv (store TEXT NOT NULL, k TEXT NOT NULL, v TEXT, PRIMARY KEY(store, k))`,
  );
}

function persistDb() {
  if (!db || !dbPath) return;
  const data = db.export();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => persistDb(), 120);
}

function kvGet(store, key) {
  const stmt = db.prepare(
    "SELECT v FROM kv WHERE store = ? AND k = ?",
  );
  stmt.bind([store, key]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.get();
  stmt.free();
  const v = row[0];
  return v == null ? null : String(v);
}

function kvSet(store, key, value) {
  db.run("INSERT OR REPLACE INTO kv (store, k, v) VALUES (?, ?, ?)", [
    store,
    key,
    value,
  ]);
  schedulePersist();
}

function kvRemove(store, key) {
  db.run("DELETE FROM kv WHERE store = ? AND k = ?", [store, key]);
  schedulePersist();
}

function kvClearStore(store) {
  db.run("DELETE FROM kv WHERE store = ?", [store]);
  schedulePersist();
}

function safeResolveBase(baseDir) {
  return path.resolve(baseDir);
}

function isInsideDir(parentAbs, targetAbs) {
  const rel = path.relative(parentAbs, targetAbs);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function getWorkspaceRoot() {
  const v = kvGet("meta", "workspaceRoot");
  return v || null;
}

function loadKeytar() {
  try {
    return require("keytar");
  } catch {
    return null;
  }
}

function usesNextDevServer() {
  return !!(process.env.OMF_DEV_PORT || process.env.OMF_DEV_URL);
}

function getStandaloneRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "omf-next");
  }
  return path.join(__dirname, "..", ".next", "standalone");
}

function stopNextChild() {
  if (nextChild && !nextChild.killed) {
    try {
      nextChild.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
  nextChild = null;
  nextPortInUse = null;
}

function tryPort(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.unref();
    srv.once("error", () => resolve(null));
    srv.listen(port, "127.0.0.1", () => {
      const addr = srv.address();
      const p = typeof addr === "object" && addr ? addr.port : port;
      srv.close(() => resolve(p));
    });
  });
}

async function pickNextPort() {
  const preferred = parseInt(
    process.env.OMF_INTERNAL_NEXT_PORT || "38479",
    10,
  );
  const first = await tryPort(preferred);
  if (first) return first;
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const p = typeof addr === "object" && addr ? addr.port : 38479;
      srv.close(() => resolve(p));
    });
  });
}

function waitForHttpOk(url, timeoutMs) {
  const http = require("http");
  const started = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve(true);
          return;
        }
        retry();
      });
      req.on("error", () => retry());
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    }
    function retry() {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timeout waiting for Next server at ${url}`));
        return;
      }
      setTimeout(ping, 120);
    }
    ping();
  });
}

async function ensureEmbeddedNextServer() {
  if (nextChild && nextPortInUse && !nextChild.killed) {
    const base = `http://127.0.0.1:${nextPortInUse}`;
    try {
      await waitForHttpOk(`${base}/`, 2500);
      return base;
    } catch {
      stopNextChild();
    }
  }
  return startEmbeddedNextServer();
}

async function startEmbeddedNextServer() {
  const root = getStandaloneRoot();
  const serverJs = path.join(root, "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `Next standalone server missing at ${serverJs}. Run npm run build first.`,
    );
  }
  const port = await pickNextPort();
  nextPortInUse = port;
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    OMF_ELECTRON_DESKTOP: "1",
  };
  nextChild = spawn(process.execPath, [serverJs], {
    cwd: root,
    env,
    stdio: "ignore",
  });
  nextChild.on("exit", (code, signal) => {
    if (code && code !== 0 && signal == null) {
      console.error(`[omf] Next child exited with code ${code}`);
    }
  });
  const base = `http://127.0.0.1:${port}`;
  await waitForHttpOk(`${base}/`, 45_000);
  return base;
}

async function resolveUiBaseUrl() {
  if (!app.isPackaged && usesNextDevServer()) {
    return process.env.OMF_DEV_URL ||
      `http://127.0.0.1:${process.env.OMF_DEV_PORT || "3010"}`;
  }
  return ensureEmbeddedNextServer();
}

async function createWindow() {
  const uiBase = await resolveUiBaseUrl();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: "#07080d",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  await mainWindow.loadURL(uiBase);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpc() {
  ipcMain.handle("omf:kv-get", (_e, store, key) => kvGet(store, key));

  ipcMain.handle("omf:kv-set", (_e, store, key, value) => {
    kvSet(store, key, value);
    return true;
  });

  ipcMain.handle("omf:kv-remove", (_e, store, key) => {
    kvRemove(store, key);
    return true;
  });

  ipcMain.handle("omf:kv-clear-store", (_e, store) => {
    kvClearStore(store);
    return true;
  });

  ipcMain.handle("omf:workspace-get", () => getWorkspaceRoot());

  ipcMain.handle("omf:workspace-set", (_e, dirPath) => {
    if (!dirPath || typeof dirPath !== "string") {
      kvRemove("meta", "workspaceRoot");
      schedulePersist();
      return null;
    }
    const abs = safeResolveBase(dirPath);
    kvSet("meta", "workspaceRoot", abs);
    return abs;
  });

  ipcMain.handle("omf:workspace-pick", async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
      title: "Choose OpenMediaForge workspace folder",
    });
    if (res.canceled || !res.filePaths[0]) return null;
    const abs = res.filePaths[0];
    kvSet("meta", "workspaceRoot", abs);
    return abs;
  });

  ipcMain.handle("omf:shell-open-path", async (_e, targetPath) => {
    try {
      const err = await shell.openPath(targetPath);
      return { ok: !err, error: err || undefined };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  ipcMain.handle("omf:shell-reveal", (_e, targetPath) => {
    try {
      shell.showItemInFolder(targetPath);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  ipcMain.handle("omf:pick-media-files", async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Media",
          extensions: ["png", "jpg", "jpeg", "webp", "gif", "mp4", "webm", "wav", "mp3"],
        },
        { name: "All", extensions: ["*"] },
      ],
    });
    if (res.canceled) return [];
    return res.filePaths;
  });

  ipcMain.handle("omf:copy-files-into-dir", async (_e, files, dir) => {
    const ws = getWorkspaceRoot();
    const destRoot = safeResolveBase(dir);
    if (ws && !isInsideDir(ws, destRoot)) {
      throw new Error("Destination must be inside the configured workspace.");
    }
    fs.mkdirSync(destRoot, { recursive: true });
    const copied = [];
    for (const f of files) {
      const base = path.basename(f);
      const target = path.join(destRoot, base);
      fs.copyFileSync(f, target);
      copied.push(target);
    }
    return { copied };
  });

  ipcMain.handle("omf:write-buffer-file", (_e, absPath, base64) => {
    const ws = getWorkspaceRoot();
    const target = safeResolveBase(absPath);
    if (ws && !isInsideDir(ws, target)) {
      throw new Error("Path must be inside workspace.");
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(base64, "base64"));
    return { ok: true };
  });

  ipcMain.handle("omf:write-text-file", (_e, absPath, utf8) => {
    const ws = getWorkspaceRoot();
    const target = safeResolveBase(absPath);
    if (ws && !isInsideDir(ws, target)) {
      throw new Error("Path must be inside workspace.");
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, utf8, "utf8");
    return { ok: true };
  });

  ipcMain.handle("omf:ensure-dir", (_e, absPath) => {
    const ws = getWorkspaceRoot();
    const dir = safeResolveBase(absPath);
    if (ws && !isInsideDir(ws, dir)) {
      throw new Error("Path must be inside workspace.");
    }
    fs.mkdirSync(dir, { recursive: true });
    return { ok: true };
  });

  ipcMain.handle("omf:join-path", (_e, parts) => path.join(...parts));

  ipcMain.handle("omf:default-comfy-base-url", () => "http://127.0.0.1:8188");

  ipcMain.handle("omf:export-zip", async (_e, entries, destAbsPath) => {
    const ws = getWorkspaceRoot();
    const out = safeResolveBase(destAbsPath);
    if (ws && !isInsideDir(ws, out)) {
      throw new Error("ZIP destination must be inside workspace.");
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(out);
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", reject);
      output.on("close", resolve);
      archive.pipe(output);
      for (const ent of entries) {
        if (!fs.existsSync(ent.absPath)) continue;
        archive.file(ent.absPath, { name: ent.arcName });
      }
      archive.finalize().catch(reject);
    });
    return { ok: true };
  });

  ipcMain.handle("omf:keychain-set", async (_e, account, secret) => {
    const kt = loadKeytar();
    if (!kt) throw new Error("Keychain unavailable (keytar not loaded).");
    await kt.setPassword(KEYTAR_SERVICE, account, secret);
    return true;
  });

  ipcMain.handle("omf:keychain-get", async (_e, account) => {
    const kt = loadKeytar();
    if (!kt) return null;
    return (await kt.getPassword(KEYTAR_SERVICE, account)) ?? null;
  });

  ipcMain.handle("omf:keychain-delete", async (_e, account) => {
    const kt = loadKeytar();
    if (!kt) return false;
    return kt.deletePassword(KEYTAR_SERVICE, account);
  });

  ipcMain.handle("omf:runtime-info", () => ({
    packaged: app.isPackaged,
    nextDevServer: !app.isPackaged && usesNextDevServer(),
    appVersion: app.getVersion(),
    platform: process.platform,
    keytarModuleLoaded: !!loadKeytar(),
    nextPort: nextPortInUse,
  }));
}

app.whenReady().then(async () => {
  registerIpc();
  await initDatabase();
  await createWindow();
});

app.on("before-quit", () => {
  stopNextChild();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});
