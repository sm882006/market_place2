# Marketplace backend

This is the reorganized backend for your existing React project. All 31 original API endpoints and their successful response formats are retained. The frontend source is unchanged. Your original seven JSON data files are now in `backend/data/`.

## Start the complete project

Install Node.js 22.12 or newer (tested with Node.js 24.20). Open a terminal in the main project folder, where the root `package.json` is located:

```sh
npm install
npm run server
```

Leave that terminal running. Open another terminal in the same folder:

```sh
npm run dev
```

Open the address Vite prints in the second terminal. Vite forwards `/api` requests to the backend at `http://localhost:5001`. Check the backend directly at `http://localhost:5001/api/health`.

The downloaded project includes a generated local `backend/.env`, so no configuration is needed for the default local setup. Log out and log back in once after switching: the new signing secret invalidates old login tokens, but existing accounts and passwords are retained.

For automatic backend restarts while editing, use `npm run server:dev` instead of `npm run server`. To run just the backend, you can also run `npm start` from the `backend` folder after the root installation.

## What goes where

```text
backend/
  .env                         Local settings and private signing secret
  .env.example                 Configuration template, safe to commit
  package.json                 Backend dependencies and commands
  README.md                    This guide
  API.md                       List of API endpoints
  data/                        Your existing JSON records
  src/
    server.js                  Starts the server and checks stored data
    app.js                     Connects middleware, routes and frontend build
    config/env.js              Loads and validates backend/.env
    routes/                    Maps URLs to controller functions
    controllers/               Request handling, grouped by feature
    services/chat.service.js   Shared purchase/rental chat creation
    services/notification.service.js
                               Shared notification creation
    middleware/                Login-token checks and error responses
    repositories/              Separate data access module per collection
    storage/jsonStore.js       Common JSON reading and writing
    utils/token.js             Creates login tokens
  tests/                       Automated API and startup checks
```

Routes and controllers are grouped into `auth`, `products`, `rents`, `lostfound`, `orders`, `notifications`, `chats`, `activity`, and `health`.

For example, a request goes through:

```text
Frontend -> app.js -> products.routes.js -> authentication middleware
         -> products.controller.js -> products.repository.js -> jsonStore.js
```

The controller calls the chat or notification service when those shared actions are needed. Controllers contain the existing feature workflows; repositories keep file access out of them.

## Chat

- `routes/chats.routes.js` declares the chat endpoints.
- `controllers/chats.controller.js` lists conversations, checks participant access, sends messages, saves them and notifies the other participant.
- `services/chat.service.js` creates or reuses a private conversation for purchase and rental requests and adds the opening message. Both listing controllers call this one service.
- `repositories/chats.repository.js` stores conversations through the common JSON storage module.

Chat keeps your existing HTTP/polling approach. No WebSocket server or additional frontend integration is required. Only the buyer/renter and seller/owner can read or send messages in their conversation. Repeating a request after rejection reuses the conversation.

## Configuration

`backend/.env` loads relative to the backend folder, regardless of where you run Node. Existing operating-system environment variables take precedence.

| Setting | Purpose |
| --- | --- |
| `PORT=5001` | Backend port. If changed, also change the proxy target in root `vite.config.js`. |
| `JWT_SECRET` | Private token-signing key, at least 32 characters. |
| `DATA_DIR=data` | Data folder, relative to `backend/`; absolute paths also work. |
| `CORS_ORIGIN` | Optional comma-separated frontend origins. Omit to preserve the original unrestricted CORS behavior. |

If `.env` is missing, copy `.env.example` to `.env`. Generate a secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Paste that value after `JWT_SECRET=`. Never commit `.env`; the existing `.gitignore` excludes it.

## Dependencies

Backend packages (`express`, `cors`, `bcryptjs`, `jsonwebtoken`) are declared in `backend/package.json`. React and frontend tooling remain in the root package. The project uses npm workspaces and one root `package-lock.json`, so one root `npm install` installs both sets consistently.

npm may physically place shared packages in the root `node_modules` folder. This is normal workspace behavior: backend dependency ownership is still defined by `backend/package.json`. Do not manually move installed packages.

The two old entry files (`server.js` and `server/server.js`) are tiny forwarding files for compatibility. They contain no duplicated backend logic. New commands start `backend/src/server.js`.

## Data and future MongoDB work

No MongoDB connection is added yet. The application still uses your existing JSON data and requires no database setup. A fake database connection or unused Mongoose models would not help the current application.

When you add MongoDB, put connection setup in `src/config/database.js`, add real schemas in `src/models/`, replace repository implementations, and make callers await database operations. Multi-record purchases/rentals should use database transactions. Update tests to use a separate test database. This is a future implementation task, not a switch already enabled in `.env`.

JSON storage is suitable for the current single-server setup. Run only one backend process per data directory. Writes replace one file atomically and report errors instead of silently claiming success. Changes across multiple files are not transactional; back up `backend/data/` before modifying or migrating records. Invalid existing JSON stops startup instead of being treated as empty data.

## Verification

From the main project folder:

```sh
npm test
npm run lint:backend
npm run build
```

Tests use temporary data directories and do not change your saved records. They cover all original endpoints, login, purchases, rentals, approvals/rejections, direct buy/rent, orders, lost-and-found, activity, notifications, private chat access, message validation, chat reuse, concurrent signups, persistence and startup compatibility. After a build, the startup test also checks that the backend serves the React app and returns JSON for unknown API routes.

The original root `test_direct_buy.js` and `test_multi_user.js` are retained as manual examples. They target port 5001 and create records in whichever server is running there. Prefer `npm test` for isolated verification.

## Run a built frontend through the backend

```sh
npm run build
npm start
```

Then open `http://localhost:5001`. The backend locates the root `dist` folder correctly even when started from inside `backend/`.

## Troubleshooting

- **Connection refused / API unavailable:** keep the backend terminal running and check `/api/health`.
- **Port already in use:** stop your old server before starting the new one.
- **Invalid or expired token:** log out and log back in, especially after changing `JWT_SECRET`.
- **Missing JWT_SECRET:** create `backend/.env` as described above.
- **Invalid JSON in stored data:** restore or repair the named file; the server deliberately does not erase it.
- **Module not found:** run `npm install` in the main project folder first.
