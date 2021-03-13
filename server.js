const express = require('express')
const app = express();
const path = require('path');
const httpServer = require("http").createServer(app);
const options = {cors: {
    origin: "http://localhost:5000",
  }};
const io = require('socket.io')(httpServer, options);
const PORT = process.env.PORT || 5000

var routes = {};

//app.set('view engine', 'ejs');

var createGameID = function (req, res, next) {
    let gameIDLength = 11;
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( var i = 0; i < gameIDLength; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    req.createGameID = result;
    next();
}

app.use(createGameID);

app.use('/public', express.static(path.join(__dirname, '/public')));

app.get('/',  (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
})

app.get('/newgame',  (req, res) => {
    let gameID = req.createGameID
    app.get('/' + gameID,  (req, res) => {
        res.sendFile(path.join(__dirname + '/public/index.html'));
    })
    res.redirect('/' + gameID);
})

io.on('connection', socket => {

    socket.on('user-piece-drop', targetSquare => {
        socket.broadcast.emit('piece-drop', targetSquare);
    })
    
    socket.on('player connect', () => {

    })

});

httpServer.listen(PORT)