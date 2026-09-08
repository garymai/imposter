const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { registerSocketHandlers } = require('./socketHandlers');

const app = express();
const server = http.createServer(app);

// Enable CORS for local development and mobile network access
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Register WebSocket handlers
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve frontend in production if built
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Imposter Game Server is running. Start the client dev server via "npm run dev:client" or build client.');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Imposter Game Server listening on http://0.0.0.0:${PORT}`);
});
