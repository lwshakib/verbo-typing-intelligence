import { spawn, ChildProcess } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface TextContext {
  fullText: string;
  cursorPosition: number;
  selectedText: string;
  controlType: string;
  processName: string;
  caretRect?: { x: number; y: number; width: number; height: number };
}

export class UIAutomation {
  private bridge: ChildProcess | null = null;
  private reader: readline.Interface | null = null;
  private pendingRequest: ((data: any) => void) | null = null;
  private scriptPath: string = path.join(os.tmpdir(), 'verbo-uia-bridge.ps1');

  private createBridgeScript(): void {
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
    fs.writeFileSync(this.scriptPath, psScript, 'utf8');
  }

  init(): void {
    if (this.bridge) return;

    this.createBridgeScript();

    console.log(`[UIA] Starting persistent bridge from: ${this.scriptPath}`);
    this.bridge = spawn('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', this.scriptPath
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.reader = readline.createInterface({
      input: this.bridge.stdout!,
      terminal: false
    });

    this.reader.on('line', (line) => {
      // console.log('[UIA Bridge Output]:', line);
      if (this.pendingRequest) {
        if (line === 'OK') {
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

    this.bridge.stderr?.on('data', (data) => {
      console.error('[UIA Bridge Error]:', data.toString());
    });

    this.bridge.on('exit', (code) => {
      console.warn(`[UIA Bridge] Process exited with code ${code}. Restarting...`);
      this.bridge = null;
      // Automatically restart after a short delay
      setTimeout(() => this.init(), 1000);
    });
  }

  async getTextContext(): Promise<TextContext> {
    if (!this.bridge) this.init();
    
    return new Promise((resolve) => {
      // Request timeout handling
      const timeout = setTimeout(() => {
        if (this.pendingRequest) {
          console.warn('[UIA Bridge] Request timed out. Bridge may be unresponsive.');
          this.pendingRequest = null;
          resolve(this.getEmptyContext());
        }
      }, 2000);

      this.pendingRequest = (data) => {
        clearTimeout(timeout);
        resolve({
          fullText: data.fullText || '',
          cursorPosition: (data.fullText || '').length,
          selectedText: '',
          controlType: data.controlType || 'unknown',
          processName: data.className || 'unknown',
          caretRect: data.caret && data.caret.h > 0 ? { x: data.caret.x, y: data.caret.y, width: 0, height: data.caret.h } : undefined
        });
      };

      if (this.bridge && this.bridge.stdin) {
        this.bridge.stdin.write('GET\n');
      } else {
        clearTimeout(timeout);
        resolve(this.getEmptyContext());
      }
    });
  }

  async injectText(text: string): Promise<boolean> {
    if (!this.bridge) this.init();

    return new Promise((resolve) => {
      this.pendingRequest = () => resolve(true);
      this.bridge?.stdin?.write(`INJECT|${text}\n`);
    });
  }

  private getEmptyContext(): TextContext {
    return {
      fullText: '',
      cursorPosition: 0,
      selectedText: '',
      controlType: 'unknown',
      processName: 'unknown'
    };
  }

  cleanup(): void {
    if (this.bridge) {
      this.bridge.kill();
    }
    if (fs.existsSync(this.scriptPath)) {
      try {
        fs.unlinkSync(this.scriptPath);
      } catch {}
    }
  }
}

export const uia = new UIAutomation();
