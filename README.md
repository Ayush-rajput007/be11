# BE11 — Premium Cricket Ground Booking Platform

This project is structured as an npm workspaces monorepo containing the React + Vite frontend, Express backend, and shared packages. It is fully configured for seamless local development and production-ready serverless deployment on Vercel under a single domain.

---

## Project Structure

```text
be11/
├── frontend/         # React + Vite client application
├── backend/          # Express API server (Node.js)
├── shared/           # Common schemas, types, and constants shared between frontend and backend
├── vercel.json       # Root Vercel routing and build configuration
├── package.json      # Monorepo workspaces and script coordination
├── .env.example      # Example environment variables template
└── README.md         # Project documentation
```

---

## Local Development

### 1. Installation
Install all dependencies for the entire monorepo from the root directory:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file inside the `backend/` directory (or set them in your system environment) following the `.env.example` at the root of the project:
```bash
cp .env.example backend/.env
```

### 3. Run Development Servers
Start both the Vite frontend dev server and backend Express server concurrently from the root directory:
```bash
npm run dev
```

* **Frontend client:** running at [http://localhost:5173](http://localhost:5173) (automatically proxies `/api` calls to port 5000)
* **Backend API:** running at [http://localhost:5000](http://localhost:5000)

---

## Environment Variables

Make sure the following environment variables are configured in your development `.env` or production deployment:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Prisma SQLite database connection string. | `file:./backend/prisma/dev.db` |
| `JWT_SECRET` | Secret key used for signing JWT tokens. | *Set a secure random string in production* |
| `FRONTEND_URL` | Allowed origin for CORS (Optional on Vercel). | `http://localhost:5173` |
| `PORT` | Port for Express server (Optional). | `5000` |
| `NODE_ENV` | Application environment. | `development` / `production` |

---

## Production Deployment on Vercel

The monorepo is pre-configured to build and serve both the React client and Express API on the same domain using Vercel's modern **Services** architecture.

### Deployment Steps:
1. **Push the repository** to GitHub (`origin/main`).
2. **Import the repository** `ayushrajcodes0407/be11` into Vercel.
3. **Keep the Root Directory** as the repository root (`.` or `be11/`). Do **NOT** set it to `backend/`.
4. If Vercel asks for a framework preset, select **Services** (or let Vercel auto-detect it from the root-level `vercel.json` file).
5. Vercel will automatically detect `frontend` (Vite) and `backend` (Express) services from `vercel.json`.
6. **Add the required environment variables** in the Vercel project settings (see below).
7. Click **Deploy**.

### Expected Production Routes:
* **Frontend Application:** `https://<your-project>.vercel.app/`
* **API Health Endpoint:** `https://<your-project>.vercel.app/api/health`
* **API Endpoints:** `https://<your-project>.vercel.app/api/v1/...`

---

## Architectural & Deployment Limitations

### 1. Database (SQLite) Limitations
* **Limitation**: The default database configured in `backend/prisma/schema.prisma` is SQLite (`file:./backend/prisma/dev.db`). Vercel serverless containers run on an ephemeral and read-only filesystem. Any writes made to the SQLite database file will be lost whenever the container is recycled or scaled.
* **Recommendation**: For production persistence, switch the Prisma datasource provider to a hosted relational database (such as PostgreSQL, MySQL, or Neon) and supply the correct connection string via the `DATABASE_URL` environment variable.

### 2. Socket.IO Real-time Limitations
* **Limitation**: The backend utilizes Socket.IO for real-time notifications/updates. Because Vercel deploys Express routes as stateless Serverless Functions (ephemeral containers with strict timeout limits), persistent WebSocket connections are not supported natively. WebSockets will fail to maintain open connections, falling back to HTTP long polling or failing entirely.
* **Recommendation**: If persistent bidirectional real-time features (like continuous updates) are required:
  - Migrate real-time communication to an external WebSocket service (e.g., Pusher, Ably, or AWS API Gateway WebSockets).
  - Alternatively, deploy the `backend/` service on a traditional persistent container hosting platform (such as Render, Railway, or AWS ECS/App Runner) while hosting the static `frontend/` on Vercel.
