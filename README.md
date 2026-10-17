# CampusCart PICT

A React student marketplace backed by one Express API and MongoDB.

## Project layout

```text
src/                 React pages, components, contexts, services
server/config/       MongoDB connection
server/models/       Mongoose schemas and indexes
server/routes/       HTTP API endpoints
server/middleware/   Authentication and authorization
server/sockets/      Socket.IO chat handlers
server/server.js     API and production frontend entry point
test/                Integration script
```

The former `backend/` directory was a second JSON-store implementation. The application now uses only `server/`. No JSON files are used for application storage. Records in the original branch's JSON files are **not** automatically imported; keep the original copy if you need that data.

## Connect MongoDB Atlas

1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) project and cluster.
2. In **Database Access**, add a **database user** with a strong password and read/write access to the app database. This is different from your Atlas website login. Save the password when creating the user.
3. In **Network Access**, add the IP address of the computer or deployment that runs the API. Update the entry if your address changes.
4. On the cluster, select **Connect → Drivers → Node.js** and copy the `mongodb+srv://` connection string.
5. Copy `.env.example` to `.env` in this folder. Replace `<db_username>`, `<url_encoded_password>`, and `<cluster_host>` in `MONGODB_URI`. Keep `/campus_marketplace` before the query string. If your password includes a reserved URI character, encode it (for example, `@` becomes `%40`).
6. Set `JWT_SECRET` to a unique random value of at least 32 characters. Keep `.env` private; Git ignores it. The MongoDB URI belongs on the server, never in a `VITE_` variable or browser code.

## Email verification for signup

Signup sends a six-digit code to the email entered in the form. The account is created and a login token is issued only after the code is verified. Codes expire after 10 minutes, allow five attempts, and can be resent after one minute.

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in `.env` before starting the API. For Gmail, set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, use the Gmail address as `SMTP_USER`, and create a Google App Password for `SMTP_PASS`. Set `SMTP_FROM` to the same address or an address your SMTP provider permits. Your regular Gmail password will not work. The SMTP values stay on the server; never put them in `VITE_` variables. If email delivery fails, signup returns an error and no account is created.

The email address entered by the user can be a Gmail address or another valid inbox. `SMTP_USER` is the sending account; it does not limit recipients to Gmail.

The first successful write creates the `campus_marketplace` database and its collection. Mongoose models define `users`, `products`, `rentals`, `orders`, `chats`, `notifications`, `lostfounds`, `wishlists`, `reviews`, and `reports`. You do not need to create tables or fields manually in Atlas. Empty collections may not appear until the app writes records.

## Run locally

Requires Node.js 22 or newer.

```powershell
npm ci
Copy-Item .env.example .env
# Edit .env with your own URI and JWT secret.
npm run server
```

In another terminal:

```powershell
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Vite proxies `/api` and `/socket.io` to port 5001. Check `http://localhost:5001/api/health` for `"database":"connected"`. The API exits on a failed MongoDB connection instead of silently using files.

For a production bundle, run `npm run build`, then `npm run server` and open `http://localhost:5001`. Run `npm run lint` to check code quality. The older `test/integration.test.js` script assumes signup immediately creates an account and needs updating for email OTP before it can be run; it also changes database records, so use a separate test database.

## Data and admin notes

The original branch includes legacy JSON data. Removing it from this working tree does not remove it from Git history or GitHub. Some records contain account information, so treat exports as private. A direct `mongoimport` does not remap the old IDs to MongoDB references; migrate those records separately if you need them.

Public signups always receive the `student` role. To assign an admin, update a trusted user's `role` to `admin` in Atlas after confirming their identity.
