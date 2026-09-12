# Support CRM System

A production-oriented full-stack customer support CRM for managing support tickets, ticket status, priorities, customer details, and internal notes.

## Stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** SQLite
- **Deployment model:** Single Node.js service serving the built React application and `/api/*` endpoints

## Features

- Create support tickets with auto-generated ticket IDs
- Dashboard statistics for total, open, in-progress, and closed tickets
- Search tickets by customer, ticket ID, email, or description
- Filter tickets by status
- View complete ticket details and notes
- Update ticket status and add notes
- Priority levels: High, Medium, Low
- Production fallback routing for React SPA pages

## Project Structure

```text
crm-system/
├── backend/
│   ├── db.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── .node-version
├── package.json
└── README.md
```

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Install

From the repository root:

```bash
npm install
```

The root install script installs both backend and frontend dependencies.

### Run backend

```bash
npm start
```

The production-style backend serves the API and, after a frontend build, the React application from the same Node process.

### Run frontend development server

In a second terminal:

```bash
cd frontend
npm run dev
```

The Vite development server runs on its usual local port. API requests are expected to be served by the backend at `http://localhost:3000`.

### Production build

From the repository root:

```bash
npm run build
npm start
```

The frontend build is generated at `frontend/dist`, which the Express server serves in production.

## Environment Variables

Copy `.env.example` to `.env` for local development when needed.

```env
PORT=3000
```

`PORT` is optional; the server defaults to `3000` locally and uses the hosting provider's assigned port in deployment environments.

## API

### Health check

`GET /api/health`

Returns a small JSON response confirming that the service is running.

### Tickets

- `POST /api/tickets` — create a ticket
- `GET /api/tickets` — list tickets with optional `status` and `search` filters
- `GET /api/tickets/:ticket_id` — fetch ticket details and notes
- `PUT /api/tickets/:ticket_id` — update status and/or add a note

### Dashboard

`GET /api/stats` — return ticket counts by status.

## Deployment

This repository is intentionally structured so the frontend and backend can be deployed as one Node.js service:

1. Install dependencies with `npm install`.
2. Build the React frontend with `npm run build`.
3. Start the service with `npm start`.
4. Configure `PORT` only when the hosting platform requires an explicit value.

### Important SQLite note

SQLite stores data in `backend/crm.db`. This is convenient for local development and demos. On hosting platforms with ephemeral filesystems, the database file may not persist across restarts or new deployments. For a production CRM with durable data, replace the SQLite layer with a managed persistent database such as PostgreSQL.

## Security / Repository Hygiene

Do not commit `.env` files containing secrets or credentials. Use `.env.example` for documentation and configure real environment variables in the hosting provider.
