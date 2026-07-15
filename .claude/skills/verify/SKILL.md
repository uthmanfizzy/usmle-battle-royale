---
name: verify
description: Build, serve, and drive the MedVale client in a headless browser to verify UI changes at runtime.
---

# Verifying MedVale client changes

## Build + serve

```powershell
cd client
npm run build                                   # Vite, ~3s
npx vite preview --port 4173 --strictPort       # serves dist/, run in background
```

## Drive it

No Playwright in the repo. Install `playwright-core` (small, no browser download)
in the scratchpad and point it at installed Chrome:

```js
const { chromium } = require('playwright-core');
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
```

Edge also exists at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.

## Gotchas

- **The app scrolls `#root`, not the window** (`html, body, #root { height:100%; overflow:auto }`
  in App.css). Measure `document.getElementById('root').scrollTop`, never `window.scrollY`
  (always 0). `element.scrollIntoView()` works; `window.scrollTo()` does not.
- The landing page (`/`) only renders when `localStorage.authToken` is absent; with a
  token App.jsx redirects `/` → `/dashboard`. A fake token bounces back off a 401 from
  the production API — expected.
- Auth CTAs navigate to `https://usmle-battle-royale-production.up.railway.app/auth/google`;
  intercept with `page.route('**/auth/google*', r => r.abort())` to observe without leaving.
- Pre-existing console noise on load: App.jsx's debug game-settings fetch logs errors when
  the production API is unreachable/CORS-blocked from localhost — not a page bug.

## Flows worth driving

- `/` landing: hero, trailer modal (`.lp-trailer-circle`), nav links (scroll `#root`),
  Enter CTAs (auth redirect), burger menu at ≤768px viewport.
- Check mobile at 390px and 320px; assert `document.scrollingElement.scrollWidth <= innerWidth`
  for overflow.
