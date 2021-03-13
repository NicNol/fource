const express = require('express')
const app = express();
const path = require('path');
const httpServer = require("http").createServer(app);
const serveStatic = require('serve-static')
const options = {
    cors: {
        origin: "http://localhost:5000",
    }
};
const io = require('socket.io')(httpServer, options);
const PORT = process.env.PORT || 5000

var createGameID = function (req, res, next) {
    let gameIDLength = 11;
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (var i = 0; i < gameIDLength; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    req.createGameID = result;
    next();
}

app.use(createGameID);

app.use(serveStatic(path.join(__dirname, '/public'), { 'extensions': ['html'] }))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
})

app.get('/newgame', (req, res) => {
    let gameID = req.createGameID
    app.get('/' + gameID, (req, res) => {
        res.sendFile(path.join(__dirname + '/public/game.html'));
    })
    res.redirect('/' + gameID);
})

io.on('connection', socket => {
    let gameID;

    socket.on('player connect', ID => {
        gameID = ID
        console.log(socket.id, " connected to Game ", gameID)
        socket.join(gameID);
    })

    socket.on('user-piece-drop', (gameID, targetSquare) => {
        socket.to(gameID).broadcast.emit('piece-drop', targetSquare);
    })

});

httpServer.listen(PORT)