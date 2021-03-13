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

var games = {}

const gameObject = {
    white: null,
    black: null
}


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
    let gameID = req.createGameID;
    games[gameID] = gameObject;
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
        if (games[gameID].white == undefined) {
            games[gameID].white = socket.id
            io.to(socket.id).emit('assign-color', "white")
        }
        else if (games[gameID].black == undefined) {
            games[gameID].black = socket.id
            io.to(socket.id).emit('assign-color', "black")
        }
        
    })

    

    socket.on('user-piece-drop', (gameID, targetSquare) => {
        socket.to(gameID).broadcast.emit('piece-drop', targetSquare);
    })

});

httpServer.listen(PORT)