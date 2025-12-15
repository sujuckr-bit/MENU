# PHASE 5 — Performance, Monitoring & Reliability

**Start:** 15 Desember 2025
**Target Complete:** 29 Desember 2025

## Tujuan
- Tambahkan observability (metrics, logs, alerts) untuk memantau kesehatan layanan.
- Pastikan aplikasi mampu menangani beban yang diharapkan melalui pengujian performa dan optimasi.
- Siapkan prosedur backup, pemulihan, dan runbooks untuk menjaga keterandalan.

## Ruang Lingkup
- Instrumentasi backend untuk metrik dasar (request rate, latency, error rate).
- Centralized logging (file + optional lightweight aggregator) and retention policy.
- Alerts for high error rates, high latency, and low disk/DB space.
- Load testing (k6 or artillery) and basic perf tuning (caching, DB access patterns).
- Automated backup script for data/`data/` folder and restore verification.
- Health endpoints and simple uptime checks.

## Kriteria Keberhasilan
- Metrics and logs available in a lightweight dashboard or log files with retention notes.
- Alerts configured and tested (can be as simple as scripts sending emails/console logs for now).
- Load test shows acceptable p95 latency under target concurrent users (documented target).
- Backup and restore procedure documented and tested in `SECURITY_CHECKLIST.md` or a new `RELIABILITY.md`.

## Deliverables
- `PHASE5_PLAN.md` (this file).
- `monitoring/` directory with sample config or scripts (Prometheus targets, Grafana dashboard JSON, or guidance for hosted tools).
- `load-tests/` directory with k6 or artillery scripts and a short runbook to execute them.
- `backup/` scripts for automated data backups and a `RELIABILITY.md` runbook for restore.
- Add health-check endpoints to `server/index.js` (if missing) and document them.

## Tugas & Estimasi
- Add health endpoints + simple metrics (express middleware) — 2h — Owner: Backend
- Add basic logging + rotate/retention guidance — 1.5h — Owner: Backend
- Create `load-tests/` and run initial tests — 3h — Owner: QA/Dev
- Implement backup scripts and restore test — 2h — Owner: Ops/Dev
- Create monitoring README and example configs — 2h — Owner: Dev

## Timeline (suggested)
- Day 0: Instrumentation and health endpoints.
- Day 1: Logging and basic monitoring scripts; create initial dashboards.
- Day 2: Run load tests; identify and fix top 1–2 bottlenecks.
- Day 3: Implement backup scripts and test restores.
- Day 4: Finalize runbooks and handover to maintainers.

## Acceptance
- All deliverables added to repo and smoke-tested; simple dashboard/logs accessible to maintainers.

---
_I can start by adding `monitoring/` and `load-tests/` skeletons, or implement health endpoints in `server/index.js` — which should I do next?_ 
