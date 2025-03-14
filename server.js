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

function getLastLines(filePath, n) {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.trim().split('\n');
    return lines.slice(-n);
}


io.on('connection', (socket) => {
    console.log('New client connected');
    socket.emit('init', getLastLines(logFile, 10));
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

let fileSize = fs.statSync(logFile).size;

fs.watch(logFile, (eventType) => {
    if (eventType === 'change') {
        const newSize = fs.statSync(logFile).size;

        if (newSize > fileSize) {
            const stream = fs.createReadStream(logFile, {
                start: fileSize,
                end: newSize,
                encoding: 'utf8'
            });
            let buffer = '';
            stream.on('data', (chunk) => {
                buffer += chunk;
            });
            stream.on('end', () => {
                fileSize = newSize;
                const newLines = buffer.trim();
                if (newLines) {
                    console.log('New log:', newLines);
                    io.emit('log', newLines);
                }
            });
        }
    }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
