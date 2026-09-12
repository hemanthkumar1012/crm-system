const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

let db;
let dbReady;

// Initialize the database before accepting API traffic.
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
  const row = await db.get(`SELECT COUNT(*) as count FROM tickets`);
  const count = row.count + 1;
  return `TKT-${String(count).padStart(3, '0')}`;
};

app.post('/api/tickets', withDb(async (req, res) => {
  const { customer_name, customer_email, subject, description, priority = 'Medium' } = req.body;

  if (!customer_name?.trim() || !customer_email?.trim() || !subject?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const allowedPriorities = new Set(['High', 'Medium', 'Low']);
  if (!allowedPriorities.has(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  try {
    const ticket_id = await generateTicketId();
    const result = await db.run(
      `INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_name.trim(), customer_email.trim(), subject.trim(), description.trim(), priority]
    );

    const newTicket = await db.get(
      `SELECT ticket_id, created_at FROM tickets WHERE id = ?`,
      result.lastID
    );
    res.status(201).json(newTicket);
  } catch (err) {
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
    const allowedStatuses = new Set(['Open', 'In Progress', 'Closed']);
    if (!allowedStatuses.has(status)) {
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

    if (status !== undefined) {
      const allowedStatuses = new Set(['Open', 'In Progress', 'Closed']);
      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      await db.run(
        `UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
        [status, ticket_id]
      );
    }

    if (notes && String(notes).trim()) {
      await db.run(
        `INSERT INTO notes (ticket_id, note_text) VALUES (?, ?)`,
        [ticket_id, String(notes).trim()]
      );
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

// Express 5/path-to-regexp does not accept app.get('*').
// A regex route provides the same SPA fallback without crashing at startup.
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
