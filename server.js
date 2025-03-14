const express = require('express');
const { Tail } = require('tail');
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const logFile = path.join(__dirname, 'local.log');
app.get('/log', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('New client connected');

  fs.readFile(logFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading log file:', err);
      return;
    }
    let lines = data.split('\n').filter((line) => line.trim() !== '');
    const lastTen = lines.slice(-10);
    socket.emit('init', lastTen);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const tail = new Tail(logFile);
tail.on('line', (line) => {
  io.emit('log', line);
});
tail.on('error', (error) => {
  console.error('Tail error:', error);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
