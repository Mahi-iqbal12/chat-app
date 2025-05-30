const express = require('express');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');
const { Pool } = require('pg');

const app = express();

// Serve static files from the 'Public' directory
app.use(express.static(path.join(__dirname, 'Public')));

const server = http.createServer(app);
const io = new Server(server);

const pool = new Pool({
  host: 'db-container',
  user: 'postgres',
  password: 'secret',
  database: 'chatdb',
  port: 5432,
});

// Optional: health check route
app.get('/status', (req, res) => {
  res.send("Chat server is running");
});

const logWithTime = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};


// Socket.IO connection handler
io.on('connection', async (socket) => {
  logWithTime('A user connected');

  try {
    // Retrieve existing messages from the database
    const result = await pool.query('SELECT content FROM messages ORDER BY created_at ASC');
    const messages = result.rows.map(row => row.content);

    // Send existing messages to the newly connected client
    socket.emit('chat history', messages);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error retrieving chat history:`, err);
  }

  socket.on('chat message', async (msg) => {
    logWithTime(`Message received: ${msg}`);
    try {
      await pool.query('INSERT INTO messages (content) VALUES ($1)', [msg]);
      io.emit('chat message', msg);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error inserting message:`, err);
    }
  });

  socket.on('disconnect', () => {
    logWithTime('A user disconnected');
  });
});

server.listen(3000, () => {
  logWithTime('Server listening on port 3000');
});
