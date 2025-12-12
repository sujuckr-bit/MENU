# Deployment guide — Frontend to Vercel, API recommendations, Cloudflare DNS

This document explains how to deploy the project frontend to Vercel, recommendations for hosting the Node API (because Vercel serverless is not suitable for long-lived WebSocket connections), and how to configure Cloudflare DNS/proxy if you use a custom domain.

---

## 1) Prepare repository

1. Create a Git repository and push the workspace root (`MENU/`) to GitHub, GitLab or Bitbucket.
   - Example:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin <your-repo-url>
     git push -u origin main
     ```

## 2) Deploy frontend to Vercel (static)

Vercel is ideal for static frontends. The app in this repo serves static files from the project root (no build step required).

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Login and link the project:
   ```bash
   vercel login
   cd <path-to-repo>
   vercel link    # follow prompts to select scope + project
   ```
3. Deploy (preview or production):
   ```bash
   vercel --prod
   ```

Notes:
- `vercel.json` was added to the repo to enable some basic settings. You can customize rewrites/headers there.
- If your frontend needs to call the API, set an environment variable in Vercel: `API_BASE=https://api.yourdomain.com` (in Project Settings → Environment Variables) and update `assets/js/api-config.js` to use that value.

## 3) Host the API (recommended options)

Important: Vercel serverless functions are not a good fit for long-lived WebSocket connections used by this app. Use one of these hosts that support persistent Node processes and WebSocket connections:

- Render (https://render.com) — easy to connect to a Git repo, supports WebSockets.
- Railway / Fly.io / DigitalOcean App Platform — all support Node services and WebSockets.

Quick Render steps (overview):

1. Push `server/` folder to a repo (can be same repo or separate). Render will run `npm install` and `npm start` by default.
2. Create a new Web Service on Render and point it to the repo branch.
3. Build command: leave empty or use `npm install`; Start command: `npm start`.
4. Ensure the `PORT` environment variable is respected (the app uses `process.env.PORT || 3000`). Render sets `PORT` automatically.
5. After deploy, note the public URL (e.g. `https://bazar-api.onrender.com`) and use it as `API_BASE` in the Vercel frontend project settings.

## 4) Configure Cloudflare (optional)

If you have a custom domain and use Cloudflare for DNS/CDN/WAF:

1. Add your domain to Cloudflare and set nameservers at your registrar.
2. In Cloudflare DNS create these records:
   - For frontend (Vercel): add a CNAME for `www` pointing to `cname.vercel-dns.com` (Vercel provides the exact target when you add the domain in Vercel). Use Cloudflare proxy (orange cloud) only if Vercel supports it for your setup; otherwise set DNS only.
   - For API (Render): create a CNAME or A record depending on your provider instructions and enable proxy if you want Cloudflare features. Be cautious: proxying can affect WebSocket connections; enable the orange cloud only if you test websockets.

3. On Vercel/Render add your custom domain (they will provide verification and certificates).

## 5) WebSocket considerations

- If you enable Cloudflare proxy (orange cloud) in front of your API, Cloudflare supports WebSockets, but some Cloudflare features (caching, WAF rules) may interfere. Test real-time flows after enabling.
- If you need to tunnel a local API via Cloudflare, consider Cloudflare Tunnel.

## 6) Automating deployment from CI

- Vercel will automatically deploy on push if you connected the Git provider during project import.
- For the API, Render/GitHub Actions can be used to trigger a redeploy.

## 7) What I can do for you

- Create `vercel.json` (done).
- Create optional GitHub Action workflows to deploy the frontend automatically on push to `main`.
- Attempt an automatic deploy using Vercel CLI — I will need your permission and either your Vercel login or you run the `vercel` commands locally.

---

If you want, I can now:

- (A) Create a GitHub Action workflow to auto-deploy the frontend to Vercel on push.
- (B) Generate a Render deployment guide or a `render.yaml` (Render Blueprint) to deploy the `server/` service.
- (C) Proceed with Vercel CLI steps locally (I need you to run `vercel login` on your machine) and I can run `vercel --prod` here if you authorize.

Reply with which of A/B/C you'd like, or tell me to continue with manual instructions only.
