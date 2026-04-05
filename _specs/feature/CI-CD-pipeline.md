# CI/CD Pipeline Setup Guide — Node.js / TypeScript + GitHub Actions + Vercel

> **Stack:** Node.js · TypeScript  
> **Platform:** GitHub Actions (Lint / Build / Test) + Vercel (Deploy)  
> **Stages:** Lint → Build → Test → *(Vercel auto-deploys on push)*

---

## Prerequisites

Before configuring the pipeline, ensure the following are in place:

- A GitHub repository with your Node.js / TypeScript project
- `package.json` with the scripts below defined
- Node.js version pinned in `.nvmrc` or `package.json → engines`
- A [Vercel account](https://vercel.com/signup) (free Hobby plan) connected to your GitHub repo

### Required `package.json` scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.js",
    "build": "tsc --project tsconfig.json",
    "test": "jest --ci --coverage",
    "start": "node dist/index.js"
  }
}
```

---

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml        ← Pipeline definition (created below)
├── src/
├── dist/                    ← TypeScript output (gitignored)
├── tsconfig.json
├── .eslintrc.js
└── package.json
```

---

## Step 1 — Create the Workflow File

Create the file `.github/workflows/ci-cd.yml` in your repository:

```bash
mkdir -p .github/workflows
touch .github/workflows/ci-cd.yml
```

---

## Step 2 — Paste the Pipeline Configuration

Copy the following into `.github/workflows/ci-cd.yml`:

> **Note:** There is no `deploy` job here — Vercel listens to your GitHub repo and handles deployments automatically after every push.

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ─────────────────────────────────────────
  # Stage 1: Lint
  # ─────────────────────────────────────────
  lint:
    name: Lint & Code Quality
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'       # or pin: node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

  # ─────────────────────────────────────────
  # Stage 2: Build
  # ─────────────────────────────────────────
  build:
    name: TypeScript Build
    runs-on: ubuntu-latest
    needs: lint                              # only runs if lint passes

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Compile TypeScript
        run: npm run build

  # ─────────────────────────────────────────
  # Stage 3: Test
  # ─────────────────────────────────────────
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: build                             # only runs if build passes

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm test

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
          retention-days: 7
```

---

## Step 3 — Connect Vercel to GitHub (one-time setup)

Vercel will watch your repo and auto-deploy whenever a push passes. No deploy token or extra config needed.

1. Go to [vercel.com](https://vercel.com) and sign in (or sign up — free Hobby plan)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Vercel auto-detects Node.js/TypeScript — confirm the settings:
   - **Framework Preset:** Other (or Next.js if applicable)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
5. Click **Deploy**

From this point on, every push to `main` triggers a Vercel production deployment. Every push to any other branch gets a **preview URL** automatically.



## Step 4 — Commit and Push

```bash
git add .github/workflows/ci-cd.yml
git commit -m "ci: add GitHub Actions CI pipeline"
git push origin main
```

GitHub Actions will trigger automatically. Monitor CI runs at:

```
https://github.com/<your-org>/<your-repo>/actions
```

Vercel will pick up the same push and start deploying. Monitor deployments at:

```
https://vercel.com/dashboard
```

---

## Pipeline Flow

```
push / pull_request
        │
        ▼
   ┌─────────┐
   │  Lint   │  ESLint on .ts / .js
   └────┬────┘
        │ pass
        ▼
   ┌─────────┐
   │  Build  │  tsc → compiles to dist/
   └────┬────┘
        │ pass
        ▼
   ┌─────────┐
   │  Test   │  Vitest with --ci --coverage
   └────┬────┘
        │ (Vercel is watching your repo in parallel)
        ▼
   ┌──────────────────────┐
   │  Vercel Auto-Deploy  │  Production (main) or Preview URL (other branches)
   └──────────────────────┘
```

---

## Common Issues & Fixes

| Problem | Fix |
|---|---|
| `npm ci` fails — no `package-lock.json` | Run `npm install` locally and commit the lockfile |
| TypeScript errors only on CI | Ensure `tsconfig.json` is committed and `strict` mode matches local |
| Tests pass locally but fail on CI | Use `--ci` flag in Jest and check for environment-specific paths |
| Vercel deploy fails but CI passes | Check **Output Directory** in Vercel project settings — should be `dist` |
| Vercel shows old build | Make sure Vercel is connected to the correct branch (`main`) in project settings |
| Preview URLs not generating | Check Vercel → Project → Settings → Git — ensure GitHub integration is active |

---

## Optional Enhancements

- **Matrix builds** — test across multiple Node.js versions by adding a `matrix` strategy to the `test` job
- **Caching `node_modules`** — already handled via `cache: 'npm'` in `setup-node`
- **Branch protection rules** — require the `test` job to pass before merging PRs *(GitHub → Settings → Branches → Add rule)*
- **Block Vercel deploy if tests fail** — in Vercel project settings, enable **"Only deploy when GitHub checks pass"** under Git → Deployment Protection
- **Environment variables** — add secrets like API keys in Vercel → Project → Settings → Environment Variables (separate from GitHub secrets)
- **Custom domain** — connect your own domain for free in Vercel → Project → Settings → Domains