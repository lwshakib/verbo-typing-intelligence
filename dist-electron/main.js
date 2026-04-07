var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import { uIOhook } from "uiohook-napi";
import { EventEmitter } from "events";
import { spawn } from "child_process";
import readline from "readline";
import fs from "fs";
import os from "os";
import path from "path";
class KeyHook extends EventEmitter {
  // Recommended 300-500ms
  constructor() {
    super();
    __publicField(this, "debouncedTimer", null);
    __publicField(this, "debounceMs", 400);
  }
  start() {
    uIOhook.on("keydown", (e) => {
      this.handleKeyDown(e);
    });
    uIOhook.start();
    console.log("Global key hook started");
  }
  stop() {
    uIOhook.stop();
  }
  handleKeyDown(e) {
    if (this.debouncedTimer) {
      clearTimeout(this.debouncedTimer);
    }
    if (e.keycode === 15) {
      console.log("[Hook] Tab pressed (inject)");
      this.emit("tab-pressed");
      return;
    }
    if (e.keycode === 1) {
      console.log("[Hook] Esc pressed (hide)");
      this.emit("esc-pressed");
      return;
    }
    this.debouncedTimer = setTimeout(() => {
      console.log("[Hook] Typing paused - emitting trigger");
      this.emit("typing-paused");
    }, this.debounceMs);
  }
}
const keyHook = new KeyHook();
class UIAutomation {
  constructor() {
    __publicField(this, "bridge", null);
    __publicField(this, "reader", null);
    __publicField(this, "pendingRequest", null);
    __publicField(this, "scriptPath", path.join(os.tmpdir(), "verbo-uia-bridge.ps1"));
  }
  createBridgeScript() {
    const psScript = `
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms
$ErrorActionPreference = "SilentlyContinue"

try {
    while ($true) {
        $cmd = [Console]::In.ReadLine()
        if (-not $cmd) { break }
        
        if ($cmd -eq "GET") {
            $focused = [Windows.Automation.AutomationElement]::FocusedElement
            if ($focused) {
                $target = $focused
                # If we're focused on a container, search for the actual text control
                if ($focused.Current.ControlType.ProgrammaticName -match 'Pane|Window|Group|Custom') {
                    $docCondition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ControlTypeProperty, [Windows.Automation.ControlType]::Document)
                    $editCondition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ControlTypeProperty, [Windows.Automation.ControlType]::Edit)
                    $found = $focused.FindFirst([Windows.Automation.TreeScope]::Descendants, $docCondition)
                    if (-not $found) { $found = $focused.FindFirst([Windows.Automation.TreeScope]::Descendants, $editCondition) }
                    if ($found) { $target = $found }
                }

                $text = ""
                $caret = @{x=0;y=0;h=0}
                try { 
                    $textPattern = $target.GetCurrentPattern([Windows.Automation.TextPattern]::Pattern)
                    $text = $textPattern.DocumentRange.GetText(-1)
                    $selection = $textPattern.GetSelection()
                    if ($selection.Length -gt 0) {
                        $rects = $selection[0].GetBoundingRectangles()
                        if ($rects.Length -gt 0) {
                            $safeX = $rects[0].X; if ([Double]::IsInfinity($safeX) -or [Double]::IsNaN($safeX)) { $safeX = 0 }
                            $safeY = $rects[0].Y; if ([Double]::IsInfinity($safeY) -or [Double]::IsNaN($safeY)) { $safeY = 0 }
                            $safeH = $rects[0].Height; if ([Double]::IsInfinity($safeH) -or [Double]::IsNaN($safeH)) { $safeH = 0 }
                            $caret = @{x=$safeX; y=$safeY; h=$safeH}
                        }
                    }
                } catch {
                    try { 
                        $valPattern = $target.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern)
                        $text = $valPattern.Current.Value
                    } catch {}
                }

                if ($text) { $text = $text -replace "[\\x00-\\x1F\\x7F]", "" }

                @{
                    fullText = $text
                    controlType = $target.Current.ControlType.ProgrammaticName
                    className = $target.Current.ClassName
                    caret = $caret
                } | ConvertTo-Json -Compress | Write-Host
            } else {
                Write-Host "{}"
            }
        } elseif ($cmd.StartsWith("INJECT|")) {
            try {
                $textToInject = $cmd.Substring(7)
                $escaped = ""
                foreach ($char in $textToInject.ToCharArray()) {
                    if ("+^%~(){}".Contains($char)) {
                        $escaped += "{$char}"
                    } else {
                        $escaped += $char
                    }
                }
                [System.Windows.Forms.SendKeys]::SendWait($escaped)
                Write-Host "OK"
            } catch {
                Write-Host "ERROR: $($_.Exception.Message)"
            }
        }
    }
} catch {
    $_ | Out-String | Write-Error
}
    `;
    fs.writeFileSync(this.scriptPath, psScript, "utf8");
  }
  init() {
    var _a;
    if (this.bridge) return;
    this.createBridgeScript();
    console.log(`[UIA] Starting persistent bridge from: ${this.scriptPath}`);
    this.bridge = spawn("powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      this.scriptPath
    ], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    this.reader = readline.createInterface({
      input: this.bridge.stdout,
      terminal: false
    });
    this.reader.on("line", (line) => {
      if (this.pendingRequest) {
        if (line === "OK") {
          this.pendingRequest(true);
        } else {
          try {
            this.pendingRequest(JSON.parse(line));
          } catch {
            this.pendingRequest({});
          }
        }
        this.pendingRequest = null;
      }
    });
    (_a = this.bridge.stderr) == null ? void 0 : _a.on("data", (data) => {
      console.error("[UIA Bridge Error]:", data.toString());
    });
    this.bridge.on("exit", (code) => {
      console.warn(`[UIA Bridge] Process exited with code ${code}. Restarting...`);
      this.bridge = null;
      setTimeout(() => this.init(), 1e3);
    });
  }
  async getTextContext() {
    if (!this.bridge) this.init();
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (this.pendingRequest) {
          console.warn("[UIA Bridge] Request timed out. Bridge may be unresponsive.");
          this.pendingRequest = null;
          resolve(this.getEmptyContext());
        }
      }, 2e3);
      this.pendingRequest = (data) => {
        clearTimeout(timeout);
        resolve({
          fullText: data.fullText || "",
          cursorPosition: (data.fullText || "").length,
          selectedText: "",
          controlType: data.controlType || "unknown",
          processName: data.className || "unknown",
          caretRect: data.caret && data.caret.h > 0 ? { x: data.caret.x, y: data.caret.y, width: 0, height: data.caret.h } : void 0
        });
      };
      if (this.bridge && this.bridge.stdin) {
        this.bridge.stdin.write("GET\n");
      } else {
        clearTimeout(timeout);
        resolve(this.getEmptyContext());
      }
    });
  }
  async injectText(text) {
    if (!this.bridge) this.init();
    return new Promise((resolve) => {
      var _a, _b;
      this.pendingRequest = () => resolve(true);
      (_b = (_a = this.bridge) == null ? void 0 : _a.stdin) == null ? void 0 : _b.write(`INJECT|${text}
`);
    });
  }
  getEmptyContext() {
    return {
      fullText: "",
      cursorPosition: 0,
      selectedText: "",
      controlType: "unknown",
      processName: "unknown"
    };
  }
  cleanup() {
    if (this.bridge) {
      this.bridge.kill();
    }
    if (fs.existsSync(this.scriptPath)) {
      try {
        fs.unlinkSync(this.scriptPath);
      } catch {
      }
    }
  }
}
const uia = new UIAutomation();
const WORKER_URL = "https://cloudflare-ai-gateway.sk00990099009916.workers.dev/";
const API_KEY = "Jl515OpIfKjIYJHTXFfCo0ufoTHNCzQWAL5DMPIS0HEHDrjw4MncZxIjkRcitUuqKVBvmDaVNWp4iSBGjz3w4EgUwGA3biGmeUsaGbsTuqnyhAsuhAF99tc7OerLtCphoFZJnXlFUEk7cBcyLmOwcVCDfMGcKCPCPIsT01b9bJCZbc0t5iZN3m3DcVHf37X2i2lVLZiypcC1ctNnwAbCq0oVrMELG3lEiq7OHC7HzVQ2cGS7oXyCBelICMrTNWpx";
async function getAISuggestions(text, context = "") {
  var _a, _b, _c, _d, _e, _f;
  if (!text && !context) return { suggestion: "" };
  try {
    console.log("[AI] Sending request to worker...", { textLen: text.length });
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "x-session-affinity": "verbo-typing-session-1"
        // Optional: unique per session
      },
      body: JSON.stringify({
        model: "glm-4.7-flash",
        messages: [
          {
            role: "system",
            content: "You are a real-time typing assistant. Provide a short, logical completion for the user's text. Return ONLY the suggested completion text, nothing else. If you cannot provide a completion, return an empty string."
          },
          {
            role: "user",
            content: `Complete this text: "${text}"`
          }
        ],
        temperature: 0.3
        // Lower temperature for more deterministic suggestions
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("[AI] Request failed:", response.status, errText);
      throw new Error(`AI Request failed: ${response.statusText}`);
    }
    const result = await response.json();
    console.log("[AI] Received raw result:", JSON.stringify(result).slice(0, 100) + "...");
    const suggestion = ((_c = (_b = (_a = result.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content) || "";
    const reasoning = ((_f = (_e = (_d = result.choices) == null ? void 0 : _d[0]) == null ? void 0 : _e.message) == null ? void 0 : _f.reasoning) || "";
    console.log("[AI] Extracted suggestion:", suggestion);
    return { suggestion, reasoning };
  } catch (err) {
    console.error("[AI Service] Error fetching suggestions:", err);
    return { suggestion: "" };
  }
}
const __dirname$1 = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
let overlayWin = null;
let lastSuggestion = "";
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
function createOverlayWindow() {
  overlayWin = new BrowserWindow({
    width: 600,
    height: 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs")
    }
  });
  overlayWin.setIgnoreMouseEvents(true, { forward: true });
  if (VITE_DEV_SERVER_URL) {
    overlayWin.loadURL(`${VITE_DEV_SERVER_URL}#/overlay`);
  } else {
    overlayWin.loadURL(`file://${path$1.join(RENDERER_DIST, "index.html")}#/overlay`);
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  createOverlayWindow();
  uia.init();
  keyHook.start();
  keyHook.on("typing-paused", async () => {
    console.log("[Main] Received typing-paused event");
    const context = await uia.getTextContext();
    if (!context.fullText) {
      console.log("[Main] No text context found");
      return;
    }
    console.log("[Main] Requesting AI suggestions...");
    const { suggestion } = await getAISuggestions(context.fullText.slice(-100));
    if (!suggestion) {
      console.log("[Main] No suggestion received from AI");
      return;
    }
    console.log("[Main] Suggestion received:", suggestion);
    lastSuggestion = suggestion;
    if (overlayWin) {
      if (context.caretRect) {
        console.log("[Main] Positioning overlay at:", context.caretRect);
        overlayWin.setBounds({
          x: Math.round(context.caretRect.x + 20),
          y: Math.round(context.caretRect.y + context.caretRect.height + 5),
          width: 800,
          height: 120
        });
      }
      overlayWin.webContents.send("show-suggestion", suggestion, context.fullText);
    }
  });
  keyHook.on("tab-pressed", async () => {
    console.log("[Main] Received tab-pressed event");
    if (lastSuggestion) {
      console.log("[Main] Injecting suggestion:", lastSuggestion);
      await uia.injectText(lastSuggestion);
      lastSuggestion = "";
      overlayWin == null ? void 0 : overlayWin.webContents.send("hide-suggestion");
    }
  });
  keyHook.on("esc-pressed", () => {
    console.log("[Main] Received esc-pressed event");
    lastSuggestion = "";
    overlayWin == null ? void 0 : overlayWin.webContents.send("hide-suggestion");
  });
});
app.on("will-quit", () => {
  keyHook.stop();
  uia.cleanup();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
