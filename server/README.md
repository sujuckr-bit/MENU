# BAZAR HmI - Minimal Server

This is a minimal Node/Express server to provide simple APIs for authentication, menus, and orders.

Install dependencies and start:

```bash
cd server
npm install
npm start
```

Endpoints (default host http://localhost:3000):
- `POST /api/login` { password }
- `POST /api/logout`
- `GET /api/menus`
- `POST /api/menus` (admin only)
- `GET /api/orders` (admin only)
- `POST /api/orders`
- `POST /api/change-password` (admin only)

Data files are stored in `server/data/` as JSON.
