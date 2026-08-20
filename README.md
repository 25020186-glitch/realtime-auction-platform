# Real-time Online Auction Platform

A portfolio-ready full-stack auction platform built with React 19, Java 21, Spring Boot 4.1, PostgreSQL, JWT, STOMP/WebSocket and transaction-safe bidding.

## Highlights

- Buyer/seller registration and stateless JWT authentication.
- Product, auction, bid history, watchlist and notification APIs.
- Admin approval/rejection and account suspension workflows.
- Real-time bid and auction-status updates over STOMP/WebSocket.
- `SELECT ... FOR UPDATE` pessimistic locking for race-free price decisions.
- Idempotent bid requests through a client-generated UUID.
- Observer Pattern through transactional domain events and listeners.
- Factory Pattern for pluggable WebSocket/email notification senders.
- Flyway migrations, scheduler-driven auction lifecycle and structured API errors.
- H2 integration tests, including two genuinely concurrent bidders.
- Colorful responsive React UI with animated landing, auction room, seller workspace and admin control room.
- Production frontend container, social-preview artwork and end-to-end WebSocket smoke testing.

## Architecture

```text
Client
  ├── React/Vinext UI ── REST/JSON ──> Controller ──> Service (@Transactional) ──> Repository ──> PostgreSQL
  └── React auction room <── STOMP/WS <── SimpMessagingTemplate <── AFTER_COMMIT event listeners
```

The bid path is deliberately serialized only per auction:

```text
POST bid
  -> authenticate active user
  -> begin transaction
  -> SELECT auction ... FOR UPDATE
  -> check idempotency key
  -> validate state, time, seller and minimum amount
  -> insert bid + update current price/winner
  -> commit
  -> publish WebSocket/notification/audit events
```

The database lock is the source of truth. WebSocket is only the delivery mechanism, so a rolled-back bid is never broadcast.

## Technology

| Area | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vinext/Vite, Lucide icons |
| Language | Java 21 |
| Framework | Spring Boot 4.1 |
| Persistence | Spring Data JPA / Hibernate 7 |
| Database | PostgreSQL 17; H2 for tests |
| Migration | Flyway |
| Security | Spring Security, HS256 JWT, BCrypt |
| Real time | WebSocket + STOMP |
| Testing | JUnit 5, AssertJ, MockMvc, Node test runner, realtime STOMP smoke test |

## Run with Docker

Docker Compose starts PostgreSQL, the API and the frontend:

```bash
docker compose up --build
```

The local Docker profile creates this development-only admin:

```text
email:    admin@auction.local
password: Admin123!
```

Override both values before sharing or deploying:

```bash
APP_ADMIN_EMAIL=your@email.com APP_ADMIN_PASSWORD='a-strong-password' docker compose up --build
```

Open the website at `http://localhost:3000`.

The API is available at `http://localhost:8080`; health check: `GET /actuator/health`.

To add a complete local demo auction and two test users:

```powershell
.\scripts\seed-demo.ps1
```

Demo accounts:

```text
Seller: seller.demo@bidora.local / Seller123!
Buyer:  buyer.demo@bidora.local  / Buyer123!
Admin:  admin@auction.local      / Admin123!
```

## Public demo deployment

The repository includes a Render Blueprint (`render.yaml`) that provisions the
Spring Boot API, React frontend, and PostgreSQL database in Singapore. Open the
following link, choose **Apply**, and provide a strong value for
`APP_ADMIN_PASSWORD` when prompted:

https://render.com/deploy?repo=https://github.com/25020186-glitch/realtime-auction-platform

The public services are configured as:

- Frontend: `https://bidora-web-25020186.onrender.com`
- API: `https://bidora-api-25020186.onrender.com`

Free Render web services can sleep when idle, and the free PostgreSQL database
is intended for a short-lived portfolio demo. Use a paid database before
treating the deployment as permanent.

## Run without Docker

Requirements: Java 21+, Maven 3.9+ and a running PostgreSQL instance.

Create the database, copy `.env.example` values into your environment, then run:

```bash
mvn spring-boot:run
```

Flyway creates and validates the schema automatically. To create the first admin outside Docker, set `APP_ADMIN_EMAIL` and `APP_ADMIN_PASSWORD` before the first start.

Run the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend checks:

```powershell
npm test
npm run lint
npm run test:realtime
```

## API overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/categories` | Public |
| GET | `/api/v1/products` | Public |
| POST | `/api/v1/products` | Seller |
| GET | `/api/v1/products/mine` | Seller |
| GET | `/api/v1/auctions?status=ACTIVE` | Public |
| GET | `/api/v1/auctions/{id}` | Public |
| POST | `/api/v1/auctions` | Seller |
| GET | `/api/v1/auctions/{id}/bids` | Public |
| POST | `/api/v1/auctions/{id}/bids` | Authenticated |
| GET/POST/DELETE | `/api/v1/watchlist` | Authenticated |
| GET | `/api/v1/notifications` | Authenticated |
| PATCH | `/api/v1/notifications/{id}/read` | Owner |
| PATCH | `/api/v1/admin/auctions/{id}/approve` | Admin |
| PATCH | `/api/v1/admin/auctions/{id}/reject` | Admin |
| PATCH | `/api/v1/admin/users/{id}/suspend` | Admin |

All protected requests use:

```http
Authorization: Bearer <access-token>
```

## End-to-end cURL example

On Windows PowerShell, use `curl.exe` rather than the `curl` alias.

### 1. Register a seller

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"seller@example.com",
    "password":"StrongPass123!",
    "displayName":"Demo Seller",
    "registerAsSeller":true
  }'
```

Copy `accessToken` into `SELLER_TOKEN`.

### 2. Create a product

```bash
curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId":1,
    "name":"Custom Mechanical Keyboard",
    "description":"Hot-swappable switches, excellent condition",
    "condition":"LIKE_NEW"
  }'
```

### 3. Create and approve an auction

Use future ISO-8601 UTC timestamps:

```bash
curl -X POST http://localhost:8080/api/v1/auctions \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId":1,
    "startingPrice":100.00,
    "minimumIncrement":10.00,
    "startTime":"2026-08-20T05:00:00Z",
    "endTime":"2026-08-21T05:00:00Z"
  }'
```

Log in as admin, copy the token, then approve:

```bash
curl -X PATCH http://localhost:8080/api/v1/admin/auctions/1/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 4. Place a bid

Register a different user, then send a unique `clientRequestId` for every intended bid:

```bash
curl -X POST http://localhost:8080/api/v1/auctions/1/bids \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount":110.00,
    "clientRequestId":"9ba7341c-2e9e-4a1c-9f17-b5a95e20236f"
  }'
```

Repeating the same UUID returns the original bid and does not charge/create a second bid.

## WebSocket client

Connect with STOMP to either:

- Native WebSocket: `ws://localhost:8080/ws`
- SockJS: `http://localhost:8080/ws-sockjs`

Public auction stream:

```javascript
import { Client } from '@stomp/stompjs';

const client = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  connectHeaders: { Authorization: `Bearer ${accessToken}` }
});

client.onConnect = () => {
  client.subscribe('/topic/auctions/1', frame => {
    console.log('Auction update:', JSON.parse(frame.body));
  });

  client.subscribe('/user/queue/notifications', frame => {
    console.log('Private notification:', JSON.parse(frame.body));
  });
};

client.activate();
```

The public auction topic can be observed anonymously. A valid JWT in the STOMP `CONNECT` header is required for the private user destination to resolve to the current user.

## Tests

```bash
mvn test
```

Important scenarios covered:

- Registration returns a signed JWT.
- Validation errors use a stable JSON structure.
- Repeated idempotency keys create one bid only.
- Two threads place bids on the same auction concurrently.
- The highest valid bid becomes the persisted winner regardless of thread order.

## Design patterns

- **Observer:** `ApplicationEventPublisher` emits immutable events; `@TransactionalEventListener(AFTER_COMMIT)` observers update WebSocket clients, notifications and audit logs.
- **Factory:** `NotificationSenderFactory` selects the WebSocket or email adapter by `NotificationChannel`.
- **Singleton:** Spring services/repositories are singleton beans. They are stateless; request/user state is never stored in fields.
- **Repository:** Spring Data repositories isolate persistence from business logic.

## Production evolution

For a multi-instance deployment, replace the in-memory STOMP broker with RabbitMQ/Redis, add an outbox table for guaranteed event delivery, use asymmetric JWT keys or an external identity provider, add rate limiting, and run concurrency tests against PostgreSQL with Testcontainers.

## CV-ready description

- **Architected and implemented** a real-time online auction platform using Java 21, Spring Boot, PostgreSQL, JWT and STOMP/WebSocket.
- **Eliminated race conditions** in concurrent bidding through transactional pessimistic locking, idempotency keys and database constraints.
- **Applied Observer and Factory patterns** to decouple bid processing from real-time updates, notifications and audit logging.
- **Validated system correctness** with integration tests that simulate simultaneous bidders and verify deterministic price and winner state.
