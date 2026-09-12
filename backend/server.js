const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const ALLOWED_STATUSES = new Set(['Open', 'In Progress', 'Closed']);
const ALLOWED_PRIORITIES = new Set(['High', 'Medium', 'Low']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

let db;
let dbReady;

dbReady = initDb()
  .then((database) => {
    db = database;
    console.log('Connected to SQLite database');
    return database;
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    throw err;
  });

const withDb = (handler) => async (req, res, next) => {
  try {
    await dbReady;
    await handler(req, res, next);
  } catch (err) {
    next(err);
  }
};

app.get('/api/health', withDb(async (req, res) => {
  await db.get('SELECT 1');
  res.json({ status: 'ok' });
}));

const generateTicketId = async () => {
  const row = await db.get(`SELECT MAX(id) AS maxId FROM tickets`);
  const nextId = (row?.maxId || 0) + 1;
  return `TKT-${String(nextId).padStart(3, '0')}`;
};

app.post('/api/tickets', withDb(async (req, res) => {
  const { customer_name, customer_email, subject, description, priority = 'Medium' } = req.body;

  const customerName = customer_name?.trim();
  const customerEmail = customer_email?.trim();
  const ticketSubject = subject?.trim();
  const ticketDescription = description?.trim();

  if (!customerName || !customerEmail || !ticketSubject || !ticketDescription) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!EMAIL_PATTERN.test(customerEmail)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (customerName.length > 120 || customerEmail.length > 254 || ticketSubject.length > 200 || ticketDescription.length > 10000) {
    return res.status(400).json({ error: 'One or more fields are too long' });
  }

  if (!ALLOWED_PRIORITIES.has(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  try {
    // Use the database row id as the source of truth for ticket numbering.
    // The transaction prevents two concurrent requests from generating the same ticket ID.
    await db.exec('BEGIN IMMEDIATE');

    const temporaryId = `TEMP-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await db.run(
      `INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [temporaryId, customerName, customerEmail, ticketSubject, ticketDescription, priority]
    );

    const ticket_id = `TKT-${String(result.lastID).padStart(3, '0')}`;
    await db.run(
      `UPDATE tickets SET ticket_id = ? WHERE id = ?`,
      [ticket_id, result.lastID]
    );

    const newTicket = await db.get(
      `SELECT ticket_id, created_at FROM tickets WHERE id = ?`,
      [result.lastID]
    );

    await db.exec('COMMIT');
    res.status(201).json(newTicket);
  } catch (err) {
    try {
      await db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to roll back ticket creation', rollbackError);
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

app.get('/api/tickets', withDb(async (req, res) => {
  const { status, search } = req.query;

  let query = `SELECT ticket_id, customer_name, customer_email, subject, description, status, priority, created_at
               FROM tickets WHERE 1=1`;
  const params = [];

  if (status) {
    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    query += ` AND status = ?`;
    params.push(status);
  }

  if (search?.trim()) {
    query += ` AND (customer_name LIKE ? OR ticket_id LIKE ? OR customer_email LIKE ? OR subject LIKE ? OR description LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY created_at DESC`;

  try {
    const tickets = await db.all(query, params);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

app.get('/api/tickets/:ticket_id', withDb(async (req, res) => {
  const { ticket_id } = req.params;

  try {
    const ticket = await db.get(`SELECT * FROM tickets WHERE ticket_id = ?`, [ticket_id]);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const notes = await db.all(
      `SELECT note_text, created_at FROM notes WHERE ticket_id = ? ORDER BY created_at ASC`,
      [ticket_id]
    );
    ticket.notes = notes;

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

app.put('/api/tickets/:ticket_id', withDb(async (req, res) => {
  const { ticket_id } = req.params;
  const { status, notes } = req.body;

  try {
    const ticket = await db.get(`SELECT * FROM tickets WHERE ticket_id = ?`, [ticket_id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const note = notes === undefined ? '' : String(notes).trim();
    if (note.length > 10000) {
      return res.status(400).json({ error: 'Note is too long' });
    }

    if (status !== undefined) {
      await db.run(
        `UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
        [status, ticket_id]
      );
    }

    if (note) {
      await db.run(
        `INSERT INTO notes (ticket_id, note_text) VALUES (?, ?)`,
        [ticket_id, note]
      );
      if (status === undefined) {
        await db.run(
          `UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
          [ticket_id]
        );
      }
    }

    const updated = await db.get(
      `SELECT updated_at FROM tickets WHERE ticket_id = ?`,
      [ticket_id]
    );
    res.json({ success: true, updated_at: updated.updated_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

app.get('/api/stats', withDb(async (req, res) => {
  try {
    const openCount = await db.get(`SELECT COUNT(*) as count FROM tickets WHERE status = 'Open'`);
    const inProgressCount = await db.get(`SELECT COUNT(*) as count FROM tickets WHERE status = 'In Progress'`);
    const closedCount = await db.get(`SELECT COUNT(*) as count FROM tickets WHERE status = 'Closed'`);
    const totalCount = await db.get(`SELECT COUNT(*) as count FROM tickets`);

    res.json({
      open: openCount.count,
      inProgress: inProgressCount.count,
      closed: closedCount.count,
      total: totalCount.count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Express 5 no longer accepts '*' as a standalone route pattern.
// This regex excludes /api routes and serves the React entry point for client-side routes.
app.get(/^(?!\/api(?:\/|$)).*$/, (req, res, next) => {
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

const start = async () => {
  await dbReady;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
