const express = require('express')
const app = express();
const path = require('path');
const httpServer = require("http").createServer(app);
const options = {cors: {
    origin: "http://localhost:5000",
  }};
const io = require('socket.io')(httpServer, options);
const PORT = process.env.PORT || 5000

//app.set('view engine', 'ejs');

app.use('/public', express.static(path.join(__dirname, '/public')));

app.get('/',  (req, res) => {
    //File paths are relative to the view folder. IE: 'index' points to 'views/index.ejs'
    res.sendFile(path.join(__dirname + '/public/index.html'));
    //res.send("Hello World!")


})

io.on('connection', socket => {
    socket.on('user-piece-drop', targetSquare => {
        socket.broadcast.emit('piece-drop', targetSquare);
    }
    
)});

httpServer.listen(PORT)