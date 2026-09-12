const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let db;

// Initialize Database
initDb().then(database => {
  db = database;
  console.log('Connected to SQLite database');
}).catch(err => {
  console.error('Failed to initialize database', err);
});

// Helper to generate Ticket ID
const generateTicketId = async () => {
  const row = await db.get(`SELECT COUNT(*) as count FROM tickets`);
  const count = row.count + 1;
  return `TKT-${String(count).padStart(3, '0')}`;
};

// API Endpoints

// POST /api/tickets - Create a new ticket
app.post('/api/tickets', async (req, res) => {
  const { customer_name, customer_email, subject, description, priority = 'Medium' } = req.body;
  
  if (!customer_name || !customer_email || !subject || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const ticket_id = await generateTicketId();
    const result = await db.run(
      `INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticket_id, customer_name, customer_email, subject, description, priority]
    );

    const newTicket = await db.get(`SELECT ticket_id, created_at FROM tickets WHERE id = ?`, result.lastID);
    res.status(201).json(newTicket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tickets - List tickets with optional status and search filters
app.get('/api/tickets', async (req, res) => {
  const { status, search } = req.query;
  
  let query = `SELECT ticket_id, customer_name, subject, status, priority, created_at FROM tickets WHERE 1=1`;
  const params = [];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (customer_name LIKE ? OR ticket_id LIKE ? OR customer_email LIKE ? OR description LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY created_at DESC`;

  try {
    const tickets = await db.all(query, params);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tickets/:ticket_id - Get ticket details including notes
app.get('/api/tickets/:ticket_id', async (req, res) => {
  const { ticket_id } = req.params;

  try {
    const ticket = await db.get(`SELECT * FROM tickets WHERE ticket_id = ?`, [ticket_id]);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const notes = await db.all(`SELECT note_text, created_at FROM notes WHERE ticket_id = ? ORDER BY created_at ASC`, [ticket_id]);
    ticket.notes = notes;

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tickets/:ticket_id - Update ticket status and optionally add a note
app.put('/api/tickets/:ticket_id', async (req, res) => {
  const { ticket_id } = req.params;
  const { status, notes } = req.body;

  try {
    const ticket = await db.get(`SELECT * FROM tickets WHERE ticket_id = ?`, [ticket_id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (status) {
      await db.run(
        `UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
        [status, ticket_id]
      );
    }

    if (notes) {
      await db.run(
        `INSERT INTO notes (ticket_id, note_text) VALUES (?, ?)`,
        [ticket_id, notes]
      );
    }

    const updated = await db.get(`SELECT updated_at FROM tickets WHERE ticket_id = ?`, [ticket_id]);
    res.json({ success: true, updated_at: updated.updated_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats endpoint (Stand out feature)
app.get('/api/stats', async (req, res) => {
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
});

// Serve frontend in production
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
