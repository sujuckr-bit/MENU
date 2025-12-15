# Monitoring (Phase 5)

This folder contains lightweight monitoring examples and guidance.

- `prometheus-example.yml` — small example scrape config (optional).
- `README.md` — this file with quick run instructions.

Quick notes:
- The server exposes `/health` and `/metrics` endpoints (JSON) for quick checks.
- For production, consider adding Prometheus + Grafana or a hosted monitoring solution.
- Metrics here are intentionally lightweight and in-memory; for persistent metrics use a proper exporter.
