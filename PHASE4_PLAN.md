# PHASE 4 — Dokumentasi & Harden (Documentation & Hardening)

**Start:** 15 Desember 2025
**Target Complete:** 22 Desember 2025

## Tujuan
- Lengkapi dokumentasi keamanan, setup, dan prosedur operasional agar codebase siap untuk staging/production.
- Pastikan semua rekomendasi audit terdokumentasi dan dapat diikuti (Phase 1–3 remediasi tercatat).

## Ruang Lingkup
- Update `SETUP_GUIDE.md` untuk mencantumkan semua env vars (SESSION_SECRET, FRONTEND_URL, PASSWORD, dll).
- Tambah `SECURITY.md` berisi kebijakan, langkah hardening, dan prosedur reset password.
- Perbarui dokumentasi developer: cara menjalankan lokal, environment variables, cara men-deploy (docker-compose).
- Checklist verifikasi pasca-perbaikan (Phase 1–3) untuk QA.

## Kriteria Keberhasilan
- `SECURITY.md` dan `SETUP_GUIDE.md` ditambahkan/diupdate dan di-merge ke main.
- Semua referensi ke kredensial default dihapus atau diganti dengan env var notes.
- Terdapat checklist verifikasi yang dapat dijalankan oleh QA (manual steps + automated tests).

## Deliverables
- `SECURITY.md` — kebijakan dan panduan hardening.
- `PHASE4_PLAN.md` (this file).
- Update `SETUP_GUIDE.md` dengan env var dan contoh `.env.example`.
- `SECURITY_CHECKLIST.md` — langkah-langkah verifikasi pasca-remediasi.

## Tugas & Estimasi
- Update docs & create `.env.example` — 2h — Owner: Dev
- Create `SECURITY.md` — 1.5h — Owner: Dev
- Add `SECURITY_CHECKLIST.md` — 1h — Owner: QA
- Review & merge PRs — 1h — Owner: Maintainer

## Timeline
- Day 0 (15 Des): Draft docs, create `.env.example` and `SECURITY.md`.
- Day 1 (16 Des): Peer review and update per feedback.
- Day 2 (17 Des): QA runs `SECURITY_CHECKLIST.md` and reports findings.
- Day 3 (18–22 Des): Address QA notes, finalize merge to `main`.

## Acceptance
- PRs merged and checklist passing manual verification steps.

---
_Jika Anda ingin, saya bisa langsung membuat `SECURITY.md`, `SECURITY_CHECKLIST.md`, dan `.env.example` selanjutnya._
