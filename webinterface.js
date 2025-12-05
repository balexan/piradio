import express from "express"
import { piradio, state } from "./piradio.js"
import { createServer } from 'http';
import { Server } from 'socket.io';
export const app = express();
import { URL } from 'url';
const __dirname = new URL('.', import.meta.url).pathname;

const server = createServer(app);
const io = new Server(server);

app.use(express.static(__dirname +"/public"));

app.get("/", function(request, response) {
    response.sendFile(__dirname + "/views/index.html");
  });
  
app.get("/0", function(req,res) { piradio.emit('play', {type: 'radio', station: 0}); res.send("ok"); });
app.get("/1", function(req,res) { piradio.emit('play',  {type: 'radio', station: 1}); res.send("ok"); });
app.get("/2", function(req,res) { piradio.emit('play',  {type: 'radio', station: 2}); res.send("ok"); });
app.get("/vol/:vol", function(req,res) { piradio.emit('volume', parseInt(req.params.vol)); res.send("ok"); });
app.get("/pause", function(req,res) { piradio.emit('playpause'); res.send("ok"); });
app.get("/on", function(req,res) { piradio.emit('on'); res.send("ok"); });
app.get("/off", function(req,res) { piradio.emit('off'); res.send("ok"); });
app.get("/status",function(req,res) {res.send(JSON.stringify(state))})

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current state to newly connected client
  socket.emit('status', state);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Listen for state changes and broadcast to all connected clients
piradio.on('statechange', (newState) => {
  io.emit('status', newState);
});

const listener = server.listen(80, function() { console.log("Web server running with WebSocket support"); });
