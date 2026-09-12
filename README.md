# Support CRM System

A full-stack customer support CRM built to manage support tickets from creation through resolution. The application keeps the workflow intentionally simple: create a ticket, find it quickly, review the customer issue, update its status, and keep internal notes in one place.

## Project Overview

This project was built as an end-to-end support ticketing application with three clear layers:

```text
React + Tailwind CSS
        |
        | HTTP / JSON
        v
Node.js + Express REST API
        |
        | SQL
        v
SQLite database
```

The React application is compiled with Vite and served by the Express production server. This keeps the deployed version as a single Render web service instead of splitting the frontend and backend into separate deployments.

## Technology Stack

- **Frontend:** React 19, React Router, Tailwind CSS, Vite
- **Backend:** Node.js, Express 5
- **Database:** SQLite
- **Utilities:** date-fns, Lucide React
- **Deployment:** Render
- **Runtime:** Node.js 22.13.1

## Features

### Ticket management

- Create support tickets with customer name, email, subject, description, and priority
- Generate a unique ticket ID such as `TKT-001`
- Automatically store ticket creation and update timestamps
- Start every new ticket with `Open` status
- View the complete ticket and customer information
- Change ticket status between `Open`, `In Progress`, and `Closed`

### Search and filtering

- Search while typing without a separate search button
- Search across ticket ID, customer name, email, subject, and description
- Filter the ticket list by status
- Sort the newest tickets first
- Show useful dashboard counts for total, open, in-progress, and closed tickets

### Internal collaboration

- Add internal notes to a ticket
- Keep note timestamps in the database
- Display notes as a chronological history on the ticket detail page

### Small product improvement

I added **ticket priority** (`High`, `Medium`, `Low`) as a small CRM-focused enhancement. The idea is to give a support agent a quick way to identify urgent issues without introducing a larger workflow or additional database complexity.

## Database Design

The database deliberately stays small and uses two tables:

### `tickets`

| Column | Purpose |
|---|---|
| `id` | Internal SQLite primary key |
| `ticket_id` | Public ticket identifier such as `TKT-001` |
| `customer_name` | Customer name |
| `customer_email` | Customer email address |
| `subject` | Short issue title |
| `description` | Full customer issue description |
| `status` | `Open`, `In Progress`, or `Closed` |
| `priority` | `High`, `Medium`, or `Low` |
| `created_at` | Ticket creation timestamp |
| `updated_at` | Last ticket update timestamp |

### `notes`

| Column | Purpose |
|---|---|
| `id` | Note primary key |
| `ticket_id` | Ticket reference |
| `note_text` | Internal note content |
| `created_at` | Note creation timestamp |

The schema is intentionally limited to the ticket and notes workflow rather than introducing unnecessary tables for the assessment.

## REST API

### Health check

```http
GET /api/health
```

Returns:

```json
{
  "status": "ok"
}
```

### Create a ticket

```http
POST /api/tickets
Content-Type: application/json
```

Example body:

```json
{
  "customer_name": "Rahul Sharma",
  "customer_email": "rahul@example.com",
  "subject": "Order not delivered",
  "description": "My order was expected yesterday but has not arrived.",
  "priority": "High"
}
```

Example response:

```json
{
  "ticket_id": "TKT-001",
  "created_at": "2026-09-12 16:30:00"
}
```

### List, search, and filter tickets

```http
GET /api/tickets
GET /api/tickets?search=Rahul
GET /api/tickets?status=Open
GET /api/tickets?status=Open&search=Rahul
```

The endpoint returns the information needed by the dashboard while keeping the database query on the server.

### Get ticket details

```http
GET /api/tickets/TKT-001
```

The response includes the ticket, customer information, current status, priority, timestamps, and notes.

### Update a ticket

```http
PUT /api/tickets/TKT-001
Content-Type: application/json
```

Update status:

```json
{
  "status": "In Progress"
}
```

Add a note:

```json
{
  "notes": "Checked the order status and contacted the courier."
}
```

The endpoint returns the updated timestamp:

```json
{
  "success": true,
  "updated_at": "2026-09-12 16:35:00"
}
```

### Dashboard statistics

```http
GET /api/stats
```

Returns the ticket totals used by the dashboard cards.

## Project Structure

```text
crm-system/
├── backend/
│   ├── db.js              # SQLite connection and schema setup
│   ├── package.json       # Backend dependencies and scripts
│   └── server.js          # Express API and production server
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateTicket.jsx
│   │   │   └── TicketDetail.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── .gitignore
├── .node-version
├── package.json
├── render.yaml
└── README.md
```

## Running Locally

### Prerequisites

- Node.js 22.13.1 or another compatible Node 22 release
- npm

### Install dependencies

From the project root:

```bash
npm install
```

### Build the frontend

```bash
npm run build
```

### Start the production server

```bash
npm start
```

The server uses port `3000` locally by default. Set the `PORT` environment variable when a different port is required.

### Frontend development mode

For frontend development with Vite:

```bash
cd frontend
npm run dev
```

The production build is still served through Express so the deployed application uses the same API and frontend origin.

## Testing

The backend package includes a lightweight syntax check:

```bash
npm test
```

Before submission, the main manual acceptance flow is:

1. Open the dashboard.
2. Create a ticket.
3. Confirm the generated ticket ID and timestamp.
4. Search by customer name, email, ticket ID, subject, and description.
5. Filter by each supported status.
6. Open the ticket detail page.
7. Change the ticket status.
8. Add an internal note.
9. Refresh the page and verify the saved status and note.
10. Open the ticket URL directly to verify React routing in production.

## Deployment

The application is deployed as a single Node.js web service on Render.

Render uses:

```text
Build command:  npm install && npm run build
Start command:  npm start
Health check:  /api/health
Node version:   22.13.1
```

The repository includes `render.yaml` and `.node-version` so the runtime version is explicit and reproducible.

### Deployment issue solved

During deployment, the initial Node runtime was too old for the Vite version used by the frontend. The build failed before the application could start. I pinned the project to Node.js 22.13.1 and explicitly configured the Render service to use the same version.

After that change, the Vite production build completed successfully. A second issue appeared when Express 5 rejected the old `app.get('*', ...)` SPA fallback syntax. The route was changed to an Express 5-compatible regular-expression fallback while keeping API routes separate from frontend routes.

This leaves the deployed architecture simple while handling the actual production issues encountered during deployment.

### SQLite note

SQLite is intentionally retained for this assessment because the requested project scope is small and the specification allows SQLite. The database file is `backend/crm.db`. For a larger multi-user production system, I would move the persistence layer to PostgreSQL and add migrations, authentication, authorization, and durable managed storage.

## Future Improvements

If this were developed beyond the assessment, the next improvements would be:

- PostgreSQL with migrations for durable multi-user storage
- Authentication and role-based access for support agents
- Pagination for larger ticket volumes
- Ticket assignment to individual agents
- Customer/order history integration
- Automated tests for API and frontend workflows
- Audit logging for status changes
- Persistent production logging and monitoring

These are intentionally left out of the MVP so the core ticket workflow remains easy to understand and reliable.

## Submission Checklist

- [x] Public deployed application
- [x] Public GitHub repository
- [x] README with setup instructions
- [x] `.env.example`
- [x] `.gitignore`
- [x] Core ticket workflow
- [x] Search and status filtering
- [x] Ticket details, status updates, and notes
- [ ] 3–5 minute demo video
