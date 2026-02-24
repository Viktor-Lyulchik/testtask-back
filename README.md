# InvestEstate — Backend API

NestJS REST API for the InvestEstate real estate investment platform.

## Stack

- **NestJS** — framework
- **Prisma** — ORM
- **PostgreSQL** — database
- **JWT** — access tokens (15m) via `@nestjs/jwt` + `passport-jwt`
- **Refresh tokens** — opaque tokens (30d), stored hashed in DB, single-use
  rotation
- **bcrypt** — password hashing
- **Cloudinary** — property image uploads
- **Swagger** — API docs at `/docs`
- **@nestjs/throttler** — rate limiting

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Run DB migrations

```bash
npx prisma migrate dev
```

### 4. Start the server

```bash
npm run dev          # development with watch
npm run start:prod   # production (after npm run build)
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/docs`

---

## Auth Flow

```
POST /auth/login
  → { accessToken (15m), refreshToken (30d), user }

# When accessToken expires (401):
POST /auth/refresh  { refreshToken }
  → { accessToken (new), refreshToken (new, old is deleted), user }

POST /auth/logout   { refreshToken }      # invalidate one device
POST /auth/logout-all  (Bearer token)     # invalidate all devices
```

**Refresh token security:**

- Stored as SHA-256 hash in DB — plain text never persisted
- **Single-use rotation** — each `POST /auth/refresh` invalidates the used token
  and issues a fresh pair
- `onDelete: Cascade` — all tokens deleted when user is deleted
- Expired tokens are cleaned up automatically on each login/refresh

---

## API Endpoints

### Auth

| Method | Path               | Auth | Rate limit | Description                   |
| ------ | ------------------ | ---- | ---------- | ----------------------------- |
| `POST` | `/auth/register`   | —    | 5/min      | Register, returns token pair  |
| `POST` | `/auth/login`      | —    | 10/min     | Login, returns token pair     |
| `POST` | `/auth/refresh`    | —    | 20/min     | Rotate refresh token          |
| `POST` | `/auth/logout`     | —    | —          | Invalidate refresh token      |
| `POST` | `/auth/logout-all` | JWT  | —          | Invalidate all refresh tokens |
| `GET`  | `/auth/me`         | JWT  | —          | Get current user from DB      |

### Properties

| Method | Path          | Auth        | Description              |
| ------ | ------------- | ----------- | ------------------------ |
| `GET`  | `/properties` | —           | List all (public)        |
| `POST` | `/properties` | JWT + ADMIN | Create with image upload |

### Applications

| Method   | Path                | Auth | Description           |
| -------- | ------------------- | ---- | --------------------- |
| `POST`   | `/applications`     | JWT  | Submit application    |
| `GET`    | `/applications`     | JWT  | My applications       |
| `DELETE` | `/applications/:id` | JWT  | Cancel my application |

---

## Business Rules

- Application `amount` ≥ property `ticket`
- Application `amount` must be a multiple of `ticket`
- Users can only delete their own applications (403 otherwise)
- Only ADMIN role can create properties

## Generate a secure JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
