# Kovo

A personal finance tracker — net worth trend, budget vs. actual, a transaction ledger, recurring bills, investments, and savings goals. All data is stored in your browser's `localStorage`, so it's private to your device and browser — nothing is sent to a server.

## Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploy to Vercel (easiest)

This is the simplest option and gives you a real HTTPS URL you can open and "Add to Home Screen" on your phone.

1. Install the CLI once: `npm install -g vercel`
2. From this folder, run: `vercel`
3. Follow the prompts (framework preset: **Vite**, build command `npm run build`, output directory `dist`)
4. Vercel gives you a URL like `kovo-yourname.vercel.app`

Or skip the CLI: push this folder to a GitHub repo, go to [vercel.com/new](https://vercel.com/new), import the repo, and it auto-detects Vite.

## Deploy to GitHub Pages

1. Create a new GitHub repo and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. Install the deploy dependency (already listed in `package.json`, just needs installing):
   ```bash
   npm install
   ```
3. Deploy:
   ```bash
   npm run deploy
   ```
   This builds the app and pushes `dist/` to a `gh-pages` branch.
4. In your repo on GitHub: **Settings → Pages → Source**, select the `gh-pages` branch, save.
5. Your app will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

**Note:** `vite.config.js` uses a relative base path (`base: "./"`), so it works correctly whether it's served from a domain root (Vercel) or a subpath (GitHub Pages project site) — you shouldn't need to change anything.

## Using it on your phone

Once deployed, open the URL in Safari (iOS) or Chrome (Android) on your phone, then:
- **iOS Safari:** tap Share → "Add to Home Screen"
- **Android Chrome:** tap the ⋮ menu → "Add to Home screen" / "Install app"

It'll launch full-screen like a native app, using the Kovo icon.

## About your data

- Everything (accounts, transactions, budgets, bills, goals, investments) is saved to `localStorage` in whatever browser you use it in.
- This means data does **not** sync across devices or browsers — if you use it on your phone and laptop, they'll have separate data.
- There's no account connection to real banks (see the main conversation for why — it needs a backend server and a Plaid production account). Everything here is entered manually.
- Clearing your browser's site data, or using a private/incognito window, will lose your data. Consider exporting a backup periodically (Settings → Reset shows you the shape of the data if you want to build an export button yourself, or ask me to add one).
