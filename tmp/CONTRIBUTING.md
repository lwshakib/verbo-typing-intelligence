# Contributing

Thanks for taking the time to contribute to Verbo Typing Intelligence.

This project is an Electron app with a renderer UI, a main process, and a Windows-only automation bridge that reads focused text context and injects keystrokes.

## How to contribute
1. Fork the repository
2. Create a branch
3. Set up the project locally
4. Make your changes
5. Test what you can
6. Open a pull request

## Fork the repo
1. Go to the project repository page on GitHub.
2. Click **Fork**.
3. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/<your-fork>.git
   cd <your-fork>
   ```

## Add the upstream remote (recommended)
This keeps your fork in sync with the original repo:
```bash
git remote add upstream https://github.com/lwshakib/verbo-typing-intelligence.git
git remote -v
```

## Create a branch
Create a branch for your work:
```bash
git checkout -b feat/your-feature
```

If you are fixing a bug:
```bash
git checkout -b fix/what-you-fixed
```

## Set up locally
Requirements:
- Windows (for the UI Automation bridge)
- PowerShell
- Node.js + npm

Install dependencies:
```bash
npm install
```

Start development:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Lint:
```bash
npm run lint
```

## Make changes
General guidelines:
- Keep changes focused (one PR per logical change)
- Follow existing code style and TypeScript types
- Avoid adding secrets to the repo (API keys should stay in the UI/config storage)

## Testing checklist
Before opening a PR, try to confirm at least:
- `npm run lint` passes
- `npm run build` succeeds
- Your UI change looks correct in the “Configurations” window
- If you changed automation logic, verify overlay shows/hides and Tab injection works in a target app

## Submit a pull request
When you open a PR:
1. Describe what you changed and why
2. Include any relevant screenshots (especially for UI changes)
3. Mention how you tested it (steps + results)

## PR review expectations
Maintainership may request changes. Please be responsive and happy to iterate.

