# Tabletop Creator Starter

This project now ships with a tiny Express + SQLite backend to showcase email + password authentication alongside the existing React + Vite frontend. It is intended for local development and manual testing, with sensible defaults and thorough comments to make changes easy.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. Install dependencies (rerun this command after pulling updates that add new packages):
   ```bash
   npm install
   ```
2. Copy the example environment file and adjust values as needed:
   ```bash
   cp .env.example .env
   ```
   The defaults configure the API at <http://localhost:4000> and point the frontend to that URL via `VITE_API_URL`.

## Running the app

```bash
npm run dev
```

This command launches both the backend API and the Vite development server. You should see console output similar to:

```
📬 Using Ethereal test inbox...
🚀 API ready at http://localhost:4000
  vite v5.x  ready in ...
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:4000>

Every sign-up request triggers a verification email sent through an Ethereal test inbox. The server prints the Ethereal credentials on boot and logs a unique preview URL for each email so you can open it directly in your browser.

## Verifying the auth flow

1. Start the dev servers: `npm run dev`.
2. Visit <http://localhost:5173/signup> and create an account (password must be at least 8 characters).
3. Watch the server logs for the verification preview link and open it in a browser tab.
4. The `/verify` page will confirm the account—after that you can sign in.
5. Log in at <http://localhost:5173/signin> and you will be redirected to the protected `/profile` page.
6. Refresh the page to confirm the HTTP-only session cookie keeps you signed in until you explicitly log out from the header.

You can always check your current session by calling `GET /api/auth/me` from the browser devtools or a tool like `curl`. It returns 200 with `{ id, email }` when authenticated and 401 otherwise.

## Available scripts

- `npm run dev` – start both backend and frontend with live reload
- `npm run dev:server` – run only the Express API (useful for debugging)
- `npm run dev:client` – run only the Vite dev server
- `npm run build` – type-check the server and build the production frontend bundle
- `npm run preview` – preview the built frontend
- `npm run lint` – run ESLint on the codebase
- `npm run typecheck:server` – run a one-off server type check with `tsc`

## API overview

All routes are prefixed with `/api/auth` and expect/return JSON. Cookies are used for the session, so remember to send requests with `credentials: 'include'` from the browser.

| Method & Path        | Description |
| -------------------- | ----------- |
| `POST /register`     | Create a user, hash the password, send a verification email |
| `POST /verify`       | Accepts `{ token }` and marks the user as verified |
| `POST /login`        | Validates credentials, checks verification, and sets the session cookie |
| `POST /logout`       | Clears the session cookie |
| `GET /me`            | Returns `{ id, email }` for the authenticated user |

Passwords are hashed with `bcryptjs`, verification tokens are random UUIDs, and sessions are issued as signed JWTs stored in HTTP-only cookies that expire after seven days.

Feel free to extend the backend or plug in a real email service once you are ready to go beyond local development.
