"use client"

import * as React from "react"
import { Icon } from "@iconify/react"
import {
  Sparkles,
  Zap,
  Shield,
  Cpu,
  ExternalLink,
  Download,
  Laptop,
  Compass,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@workspace/ui/components/button"
import { Logo } from "@workspace/ui/components/logo"
import { DOWNLOAD_LINKS, REPO_URL } from "../lib/constants"

export default function Page() {
  const { theme, setTheme } = useTheme()
  const [downloading, setDownloading] = React.useState<string | null>(null)

  const handleDownload = (platform: string, url: string) => {
    setDownloading(platform)
    window.location.href = url
    setTimeout(() => setDownloading(null), 2000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Logo className="size-8 text-foreground" />
            <span className="font-mono text-lg font-bold tracking-tight">
              verbo
              <span className="font-normal text-muted-foreground">.ai</span>
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#showcase"
              className="transition-colors hover:text-foreground"
            >
              Showcase
            </a>
            <a
              href="#downloads"
              className="transition-colors hover:text-foreground"
            >
              Downloads
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="relative size-9 cursor-pointer rounded-full hover:bg-muted"
            >
              <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon icon="mdi:github" className="size-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-border pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <div className="mb-8 inline-flex animate-pulse items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 font-mono text-xs">
              <Sparkles className="size-3.5 text-foreground" />
              <span>Context-Aware Predictive Typing AI</span>
            </div>

            <h1 className="mx-auto mb-8 max-w-5xl font-sans text-4xl leading-tight font-bold tracking-tight sm:text-6xl md:text-7xl md:leading-none">
              Write faster. <br />
              <span className="text-muted-foreground">Think seamlessly.</span>
            </h1>

            <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed font-normal text-muted-foreground md:text-xl">
              Verbo monitors your text context across Windows applications and
              modern web browsers, providing lightning-fast inline continuations
              directly at your cursor.
            </p>

            <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="w-full cursor-pointer gap-2 text-base font-medium shadow-lg sm:w-auto"
                onClick={() =>
                  handleDownload("Windows", DOWNLOAD_LINKS.WINDOWS)
                }
              >
                <Icon icon="mdi:microsoft-windows" className="size-5" />
                <span>Download for Windows</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full cursor-pointer gap-2 text-base font-medium sm:w-auto"
                onClick={() => handleDownload("Chrome", DOWNLOAD_LINKS.CHROME)}
              >
                <Icon icon="mdi:google-chrome" className="size-5" />
                <span>Chrome Extension</span>
              </Button>
            </div>
          </div>
        </section>

        {/* SHOWCASE SECTION */}
        <section
          id="showcase"
          className="border-b border-border bg-muted/10 py-24"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Designed for speed & elegance
              </h2>
              <p className="text-base text-muted-foreground md:text-lg">
                Experience frictionless AI continuations rendered as transparent
                overlays ahead of your cursor.
              </p>
            </div>

            <div className="grid items-stretch gap-12 md:grid-cols-2">
              {/* Desktop App Showcase */}
              <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                <div className="flex-1 p-8 pb-0">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs font-medium text-primary">
                    <Laptop className="size-3.5" /> Desktop Application
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">
                    Windows Global Overlay
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    Connects directly to Windows UI Automation bridges. Whether
                    you are drafting in Outlook, Word, or VS Code, press{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono font-bold text-foreground">
                      TAB
                    </code>{" "}
                    to accept suggestions instantly.
                  </p>
                </div>
                <div className="flex items-center justify-center border-t border-border bg-muted/30 p-8 pt-4">
                  <img
                    src="/demos/desktop_app.png"
                    alt="Desktop App Interface"
                    className="max-h-80 w-auto rounded-lg border border-border object-contain shadow-xl transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
              </div>

              {/* Chrome Extension Showcase */}
              <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                <div className="flex-1 p-8 pb-0">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs font-medium text-primary">
                    <Compass className="size-3.5" /> Browser Companion
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">
                    Universal Web Integrations
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    Attaches seamlessly to input fields, textareas, and rich
                    content editors across standard websites. Floating
                    non-intrusive pills keep you focused on your thoughts.
                  </p>
                </div>
                <div className="flex items-center justify-center border-t border-border bg-muted/30 p-8 pt-4">
                  <img
                    src="/demos/chrome_extension.png"
                    alt="Chrome Extension Interface"
                    className="max-h-80 w-auto rounded-lg border border-border object-contain shadow-xl transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="border-b border-border py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Zero Friction Workflow
              </h2>
              <p className="text-muted-foreground">
                Engineered from the ground up for low latency and system
                stability.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Zap className="size-5 text-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-bold">
                  Real-Time Caret Tracking
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Precise screen coordinate tracking places predictive text
                  perfectly aligned in front of your active typing cursor.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Cpu className="size-5 text-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-bold">Gemini Flash AI</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Powered by Google Gemini Flash and Flash-Lite models for
                  lightning-fast inference and strict formatting adherence.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Shield className="size-5 text-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-bold">
                  Total Privacy Control
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Bring your own API key. Your data communicates directly with
                  Google Gen AI endpoints without intermediary servers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DOWNLOADS SECTION */}
        <section id="downloads" className="bg-muted/20 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Download & Install
              </h2>
              <p className="text-muted-foreground">
                Choose your platform below to start using Verbo Typing
                Intelligence today.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Windows */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-foreground/30">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                    <Icon
                      icon="mdi:microsoft-windows"
                      className="size-7 text-foreground"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Windows 10 / 11</h3>
                    <p className="text-xs text-muted-foreground">
                      Setup Installer (.exe)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="cursor-pointer gap-2 font-medium"
                  disabled={downloading === "Windows"}
                  onClick={() =>
                    handleDownload("Windows", DOWNLOAD_LINKS.WINDOWS)
                  }
                >
                  <Download className="size-4" />
                  <span>
                    {downloading === "Windows" ? "Downloading..." : "Download"}
                  </span>
                </Button>
              </div>

              {/* Chrome Extension */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-foreground/30">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                    <Icon
                      icon="mdi:google-chrome"
                      className="size-7 text-foreground"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Chrome Browser</h3>
                    <p className="text-xs text-muted-foreground">
                      Extension Package (.zip)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer gap-2 font-medium"
                  disabled={downloading === "Chrome"}
                  onClick={() =>
                    handleDownload("Chrome", DOWNLOAD_LINKS.CHROME)
                  }
                >
                  <Download className="size-4" />
                  <span>
                    {downloading === "Chrome" ? "Downloading..." : "Download"}
                  </span>
                </Button>
              </div>

              {/* macOS */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-foreground/30">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                    <Icon icon="mdi:apple" className="size-7 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">macOS</h3>
                    <p className="text-xs text-muted-foreground">
                      Disk Image (.dmg)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer gap-2 font-medium"
                  disabled={downloading === "macOS"}
                  onClick={() => handleDownload("macOS", DOWNLOAD_LINKS.MAC)}
                >
                  <Download className="size-4" />
                  <span>
                    {downloading === "macOS" ? "Downloading..." : "Download"}
                  </span>
                </Button>
              </div>

              {/* Linux */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-foreground/30">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                    <Icon icon="mdi:linux" className="size-7 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Linux</h3>
                    <p className="text-xs text-muted-foreground">
                      AppImage Package
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer gap-2 font-medium"
                  disabled={downloading === "Linux"}
                  onClick={() => handleDownload("Linux", DOWNLOAD_LINKS.LINUX)}
                >
                  <Download className="size-4" />
                  <span>
                    {downloading === "Linux" ? "Downloading..." : "Download"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background py-16 text-sm text-muted-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 font-mono text-base font-bold text-foreground">
              <Logo className="size-6 text-foreground" />
              <span>verbo.ai</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed">
              Context-aware inline predictive typing assistant powered by Google
              Gemini AI across Windows OS and Web Browsers.
            </p>
            <div className="flex items-center gap-3 pt-2 text-foreground">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-75"
                aria-label="GitHub"
              >
                <Icon icon="mdi:github" className="size-5" />
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-75"
                aria-label="Twitter"
              >
                <Icon icon="mdi:twitter" className="size-5" />
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-75"
                aria-label="Discord"
              >
                <Icon icon="mdi:discord" className="size-5" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold tracking-wider text-foreground uppercase">
              Products
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#downloads"
                  className="transition-colors hover:text-foreground"
                >
                  Windows Desktop App
                </a>
              </li>
              <li>
                <a
                  href="#downloads"
                  className="transition-colors hover:text-foreground"
                >
                  Chrome Extension
                </a>
              </li>
              <li>
                <a
                  href="#downloads"
                  className="transition-colors hover:text-foreground"
                >
                  macOS Companion
                </a>
              </li>
              <li>
                <a
                  href="#downloads"
                  className="transition-colors hover:text-foreground"
                >
                  Linux AppImage
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold tracking-wider text-foreground uppercase">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={`${REPO_URL}#getting-started`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  Documentation <ExternalLink className="size-3" />
                </a>
              </li>
              <li>
                <a
                  href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  Contributing <ExternalLink className="size-3" />
                </a>
              </li>
              <li>
                <a
                  href={`${REPO_URL}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  Changelog <ExternalLink className="size-3" />
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold tracking-wider text-foreground uppercase">
              Aesthetic
            </h4>
            <p className="text-xs leading-relaxed">
              Designed with a strictly minimal black & white aesthetic for
              absolute clarity and focus.
            </p>
            <p className="pt-4 font-mono text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} Verbo Typing Intelligence. Licensed
              under MIT.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
