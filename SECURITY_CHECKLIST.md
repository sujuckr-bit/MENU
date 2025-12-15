# SECURITY CHECKLIST — Post-Remediation Verification

Follow these steps after applying Phase 1–3 fixes. Mark each item as PASS/FAIL and attach evidence (screenshots, logs).

## Phase 1 — Critical
- [ ] Remove `FALLBACK_PASSWORD` from `assets/js/auth.js` — verify no client-side bypass.
- [ ] Remove hardcoded credentials from `tools/*` — verify tools read from env vars.
- [ ] Remove displayed default password from `admin-login.html`.

## Phase 2 — High
- [ ] `SESSION_SECRET` sourced from env var in `server/index.js` — verify production throws without it.
- [ ] CORS origin restricted to allowed list — test with curl from disallowed origin.

## Phase 3 — Medium
- [ ] Replace `innerHTML` usages with `textContent` or sanitized output (DOMPurify) — review `script.js` and `assets/js/*`.
- [ ] Add input validation to server endpoints — verify invalid inputs are rejected.
- [ ] Ensure default password hash not created in code — verify first-time setup flows.

## General
- [ ] `.env.example` present and `.env` excluded by `.gitignore`.
- [ ] No secrets in git history (run `git log -S 'admin123'` or use `git-secrets`).
- [ ] Sessions invalidated after secret rotation.
- [ ] QA completes manual test cases and records results.
