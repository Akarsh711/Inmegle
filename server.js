const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let queue = [];
let pairs = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add to queue and try to match
  queue.push(socket);

  matchUsers();

  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      partner.emit('message', msg);
    }
  });

  socket.on('next', () => {
    disconnectPair(socket);
    queue.push(socket);
    matchUsers();
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    disconnectPair(socket);
    queue = queue.filter(s => s !== socket);
  });
});

function matchUsers() {
  while (queue.length >= 2) {
    const user1 = queue.shift();
    const user2 = queue.shift();

    pairs.set(user1.id, user2);
    pairs.set(user2.id, user1);

    user1.emit('matched');
    user2.emit('matched');
  }
}

function disconnectPair(socket) {
  const partner = pairs.get(socket.id);
  if (partner) {
    partner.emit('partner-left');
    pairs.delete(partner.id);
  }
  pairs.delete(socket.id);
}

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

