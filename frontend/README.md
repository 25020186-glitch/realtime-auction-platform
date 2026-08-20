# Bidora Frontend

Animated React 19 frontend for the real-time auction platform.

## Local development

```powershell
npm install
npm run dev
```

The UI runs at `http://localhost:3000` and expects the Spring Boot API at `http://localhost:8080`.

## Routes

- `/` — animated discovery landing and active auctions
- `/auth` — JWT login and Buyer/Seller registration
- `/auctions/{id}` — realtime auction room and bidding history
- `/dashboard` — watchlist, notifications and Seller workspace
- `/admin` — approval queue and account status management

## Quality checks

```powershell
npm test
npm run lint
npm run test:realtime
```

`test:realtime` requires the backend and seeded demo auction to be running.
