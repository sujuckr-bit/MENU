# SECURITY

## Tujuan
Panduan singkat untuk hardening, mitigasi risiko, dan prosedur keamanan yang harus diikuti sebelum deployment ke staging/production.

## Ringkasan Rekomendasi (Dari Audit)
- Hapus fallback password client-side dan semua hardcoded credentials (see `assets/js/auth.js`, `tools/*`).
- Gunakan `SESSION_SECRET` dari environment variables; jangan hardcode secrets in `server/index.js`.
- Batasi CORS ke whitelist origin saja (`server/index.js`).
- Sanitasi semua `innerHTML` usage atau gunakan DOMPurify / `textContent` (`script.js`).
- Jangan generate default passwords in code; require env var or one-time setup.
- Tambah input validation (Joi/Zod/Yup) di server endpoints.

## Deployment Checklist (short)
1. Set `SESSION_SECRET` (32+ chars) in environment for all production hosts.
2. Set `FRONTEND_URL` to the canonical frontend origin.
3. Ensure `.env` not committed and `.env.example` provided.
4. Rotate any default/sample credentials present in CI/tools.
5. Run the `SECURITY_CHECKLIST.md` verification steps after patches.

## Secure Development Notes
- Never commit secrets or real credentials. Use env vars or secret managers.
- Prefer `textContent`/`createElement` to insert user data into DOM.
- Use CSP header if possible; consider adding helmet.js to the server.
- Use HTTPS in production; set `secure` flag on cookies when `NODE_ENV=production`.

## Incident Response (short)
- If secret is exposed: rotate secret, invalidate sessions, redeploy with new secret.
- Report incidents to repository maintainers and update `AUDIT_SECURITY_REPORT.md`.

## References
- `AUDIT_SECURITY_REPORT.md` — full audit findings.
