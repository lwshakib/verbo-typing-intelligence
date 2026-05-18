# Contributing to Verbo Typing Intelligence

First off, thank you for considering contributing to Verbo Typing Intelligence! It's people like you that make Verbo such a phenomenal predictive AI assistant across Windows and web browsers.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open-source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

---

## 🗺️ Table of Contents

1. [Development Environment Setup](#development-environment-setup)
   - [Fork & Clone](#1-fork--clone)
   - [Setting Up Upstream](#2-setting-up-upstream)
   - [Prerequisites & Installation](#3-prerequisites--installation)
2. [Monorepo Workflow & Architecture](#monorepo-workflow--architecture)
3. [Making Changes & Branching](#making-changes--branching)
4. [Validating Your Code](#validating-your-code)
5. [Submitting a Pull Request](#submitting-a-pull-request)

---

## 🛠️ Development Environment Setup

### 1. Fork & Clone

To begin contributing, create a personal fork of the repository on GitHub.
Once your fork is created, clone it to your local development machine:

```bash
git clone https://github.com/<your-username>/verbo-typing-intelligence.git
cd verbo-typing-intelligence
```

### 2. Setting Up Upstream

To keep your local repository in sync with the official project repository, add the upstream remote:

```bash
git remote add upstream https://github.com/lwshakib/verbo-typing-intelligence.git
```

To verify your remotes:

```bash
git remote -v
# origin    https://github.com/<your-username>/verbo-typing-intelligence.git (fetch)
# origin    https://github.com/<your-username>/verbo-typing-intelligence.git (push)
# upstream  https://github.com/lwshakib/verbo-typing-intelligence.git (fetch)
# upstream  https://github.com/lwshakib/verbo-typing-intelligence.git (push)
```

Whenever you want to pull the latest changes from the main project:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 3. Prerequisites & Installation

This project is built using Node.js (v20+) and `pnpm` (v9.15.9+).
Ensure you have native build tools installed on Windows (Visual Studio C++ build tools & Python) required for compiling native node modules (`uiohook-napi` and `ffi-napi`).

Install all monorepo dependencies:

```bash
pnpm install
```

---

## 🏢 Monorepo Workflow & Architecture

Verbo Typing Intelligence is structured as a Turborepo monorepo:

- `apps/desktop`: Electron application for system-wide Windows predictive typing.
- `apps/chrome-extension`: Chrome extension for web input fields.
- `apps/web`: Next.js web dashboard and presentation page.
- `packages/ui`: Shared shadcn/ui components.

To start development servers across all apps simultaneously:

```bash
pnpm dev
```

To run a specific app in development mode:

```bash
pnpm turbo run dev --filter=desktop
# or
pnpm turbo run dev --filter=chrome-extension
```

---

## 🌿 Making Changes & Branching

We follow a structured branching convention. Before starting work, always branch off from the latest `main`:

```bash
git checkout main
git pull upstream main
git checkout -b <type>/<brief-description>
```

**Branch Naming Examples:**

- `feat/smart-spacing-rules`
- `fix/overlay-positioning-bug`
- `docs/update-readme-images`
- `refactor/electron-ipc-handlers`

---

## 🧪 Validating Your Code

Before committing and submitting your changes, ensure that your code adheres to our formatting, linting, and type-checking standards:

1. **Format Check & Fix:**

   ```bash
   pnpm format:check
   # To automatically format all files:
   pnpm format
   ```

2. **Linting:**

   ```bash
   pnpm lint
   ```

3. **Type Checking:**

   ```bash
   pnpm typecheck
   ```

4. **Verify Full Build:**
   ```bash
   pnpm build
   ```

---

## 🚀 Submitting a Pull Request

1. Commit your changes using descriptive commit messages adhering to Conventional Commits:
   ```bash
   git commit -m "feat(desktop): add smart spacing delay for tab keypresses"
   ```
2. Push your feature branch to your personal fork on GitHub:
   ```bash
   git push origin <your-branch-name>
   ```
3. Open GitHub and navigate to `lwshakib/verbo-typing-intelligence`. You will see a prompt to create a Pull Request from your recently pushed branch.
4. Fill out the provided Pull Request template completely, detailing your changes and verification steps.
5. Once submitted, our automated CI/CD pipeline will execute quality and type checks. Reviewers will provide feedback or approve your PR for merging.

Thank you once again for contributing to Verbo Typing Intelligence!
