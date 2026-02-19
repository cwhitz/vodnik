# Vodnik → Public Hosted Tool: What It Takes

**Architecture note:** The backend currently receives the user's key per-request and uses it to call the AI provider — BYOT in practice already. The key transits your server but is never stored. Two paths exist for deployment: **keep the backend proxy** (simpler, key touches your server in-flight) or **go direct-from-browser** (key never leaves the client, eliminates backend entirely).

---

## Infrastructure

| Item | Size | Notes |
|---|---|---|
| Deploy frontend (Vercel / Cloudflare Pages / Netlify) | **S** | Build output is a static Vite bundle — drop-in deploy |
| Deploy backend (Fly.io / Railway / Render) | **S** | Single Dockerfile, one service, no DB needed |
| Custom domain + SSL | **XS** | Automatic with any of the above providers |
| CORS lockdown (allow only your domain, not `*`) | **XS** | One-line change in `main.py` |
| **Alt path: eliminate backend entirely** | **M** | Rewrite `generationApi.ts` to call OpenAI/Anthropic/xAI directly from the browser. All three support browser-side CORS. No server costs, no latency hop. Key never leaves the client. |

---

## Security & Key Handling

| Item | Size | Notes |
|---|---|---|
| Audit that API keys are never logged server-side | **S** | Check FastAPI access logs, error handlers — strip key from any logged request body |
| Rate limiting hardening | **S** | Current 30 req/min is per-IP; fine for BYOT since costs go to user's account anyway |
| HTTPS-only enforcement | **XS** | Handled by host platform |
| Content validation / prompt injection guards | **M** | Optional for v1, but public exposure invites abuse of the generation endpoints |

---

## Google Drive Integration

| Item | Size | Notes |
|---|---|---|
| Google Cloud project + OAuth consent screen | **S** | 30 min setup, but... |
| Google OAuth app verification (for public users) | **L** | Google requires a review/verification process for apps requesting Drive scopes from arbitrary users. Can take 1–4 weeks and requires a privacy policy URL. |

---

## Legal & Compliance

| Item | Size | Notes |
|---|---|---|
| Privacy policy | **S** | Standard BYOT policy: "we never store your key or content." Easy to write, must be live for Google OAuth verification. |
| Terms of service | **S** | Basic ToS covering acceptable use, no warranties |
| Cookie/localStorage notice | **XS** | Keys and settings are in `localStorage` — GDPR technically requires disclosure |

---

## UX & Product Polish

| Item | Size | Notes |
|---|---|---|
| First-run onboarding (explain BYOT, link to provider key pages) | **S** | The settings modal needs a "where do I get a key?" flow for new users |
| Empty state for new users (no text yet) | **XS** | A friendly prompt in the editor area |
| Error message improvements (surface API key errors clearly) | **S** | Currently likely shows generic errors; "Invalid API key" should bubble up legibly |
| Mobile / tablet responsiveness | **XL** | The layout is a fixed-column desktop app. Not blocking for v1 if you target desktop explicitly, but a significant lift if you want broad reach. |
| Accessibility pass (keyboard nav, ARIA labels) | **L** | Not blocking for v1 |

---

## Media Handling at Scale

| Item | Size | Notes |
|---|---|---|
| Current approach (base64 data URLs in memory) is fine for small images | **XS** | No change needed for v1 |
| Large video files will cause browser memory pressure | **M** | For v1, document a size limit. For v1.1, consider object URLs + cleanup on unload, or warn users. |
| Zip file size limits on save | **XS** | No server-side limit since save is client-only; just a UX note |

---

## Ops & Monitoring

| Item | Size | Notes |
|---|---|---|
| Error tracking (Sentry or similar) | **S** | Install on both frontend and backend; critical for knowing when things break in prod |
| Uptime monitoring | **XS** | UptimeRobot free tier is sufficient |
| Backend health check endpoint | **XS** | One-liner `GET /health` for the platform to ping |
| Analytics (optional) | **S** | Plausible or Fathom are privacy-respecting; useful for knowing which AI providers get used |

---

## CI/CD

| Item | Size | Notes |
|---|---|---|
| Frontend auto-deploy on push | **XS** | All the above platforms do this out of the box |
| Backend auto-deploy on push | **S** | Dockerfile + GitHub Action or platform native CI |
| Build checks / type-check in CI | **S** | `tsc --noEmit` + `npm run build` gate on PRs |

---

## Recommended Launch Sequence

1. **XS/S sprint:** CORS lockdown, deploy frontend + backend, domain, key logging audit, health check
2. **S sprint:** Error messaging UX, first-run onboarding, privacy policy + ToS
3. **M sprint (if keeping Drive):** Google OAuth verification submission — start early, it blocks Drive for public users
4. **Post-launch:** Error tracking, analytics, video memory handling, mobile (if demand warrants it)

The **fastest path to public** is: go direct-from-browser (eliminate the backend), deploy the frontend statically, skip Google Drive for v1, and add a simple onboarding modal explaining how to get an API key. That's roughly **2–3 days of focused work**.
