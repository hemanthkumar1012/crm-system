# Support CRM System

A full-stack Support CRM for creating, searching, filtering, and managing customer support tickets.

## Stack

- Frontend: React 19, Vite 8, React Router, Tailwind CSS
- Backend: Node.js, Express 5
- Database: SQLite
- Deployment: Render single Node.js web service

## Core Features

- Create support tickets with generated ticket IDs and timestamps
- Dashboard counts for total, open, in-progress, and closed tickets
- Search by ticket ID, customer name, email, subject, or description
- Filter by Open, In Progress, and Closed
- Ticket detail page with customer information and full description
- Update ticket status
- Add and view internal notes/history
- Priority levels: High, Medium, Low
- React SPA routing served by the Express production server
- Health endpoint for deployment checks

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
├── render.yaml
└── README.md
```

## Run Locally

Prerequisite: Node.js 22.13.1 or another Node 22 release supported by Vite 8.

```bash
npm install
npm run build
npm start
```

The production server runs on `http://localhost:3000` by default. Set `PORT` to override the port.

For frontend development, use a second terminal:

```bash
cd frontend
npm run dev
```

## API

- `GET /api/health` - service and database health check
- `POST /api/tickets` - create a ticket
- `GET /api/tickets?status=&search=` - list/search/filter tickets
- `GET /api/tickets/:ticket_id` - ticket details plus notes
- `PUT /api/tickets/:ticket_id` - update status and/or add a note
- `GET /api/stats` - dashboard ticket counts

## Render Deployment

The repository contains `render.yaml` and pins Node.js to `22.13.1` because the frontend build uses Vite 8.

Render commands:

```text
Build:  npm install && npm run build
Start:  npm start
Health: /api/health
```

The service serves both the API and the compiled React frontend from one web service.

### SQLite deployment note

The assignment is designed around a simple SQLite database, so SQLite is intentionally retained for the submitted MVP. SQLite data is stored in `backend/crm.db`; hosting storage persistence can vary by platform. For a future production version, the database layer can be moved to PostgreSQL without changing the frontend contract.

## Submission Checklist

- Public deployed URL
- Public GitHub repository
- README with setup and deployment instructions
- `.env.example`
- `.gitignore`
- Short demo video showing ticket creation, search/filter, details, status update, and notes
