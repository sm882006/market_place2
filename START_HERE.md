# Start your updated marketplace

1. Extract the complete ZIP to a new folder.
2. Use Node.js 22.12 or newer.
3. In the main project folder, run `npm install`.
4. Run `npm run server`.
5. In a second terminal in the same folder, run `npm run dev`.
6. Open the address printed by Vite. Log out and log back in once.

Your frontend source and saved JSON records are preserved. The backend now lives in `backend/`, with its own dependencies, `.env`, configuration, routes, controllers, services, repositories, middleware, and tests.

Read [backend/README.md](backend/README.md) for the folder guide, chat explanation, configuration, tests and future MongoDB migration notes.

Use the whole updated project because the root package configuration and lockfile also changed. Do not copy only the backend folder into the old project without also updating those files. Keep the original ZIP as your backup.
