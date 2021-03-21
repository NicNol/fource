const express = require('express')
const app = express();
const path = require('path');
const httpServer = require("http").createServer(app);
const serveStatic = require('serve-static')
const options = {
    cors: {
        //origin: "http://localhost:5000",
    }
};
const io = require('socket.io')(httpServer, options);
const PORT = process.env.PORT || 5000

var games = {}

const gameObject = {
    white: null,
    black: null,
    moveSet: []
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
    games[gameID] = JSON.parse(JSON.stringify(gameObject));
    app.get('/' + gameID, (req, res) => {
        res.sendFile(path.join(__dirname + '/public/game.html'));
    })
    res.redirect('/' + gameID);
})

io.on('connection', socket => {
    //Use this code to connect sockets to each user?
    //const userId = await fetchUserId(socket);
    //socket.join(userId);
    let gameID;

    socket.on('user-connected', ID => {
        gameID = ID
        console.log(socket.id, " connected to Game ", gameID)
        socket.join(gameID);

        if (games[gameID] == undefined) {return}
        if (games[gameID].white == undefined) {
            games[gameID].white = socket.id
            io.to(socket.id).emit('assign-color', "white")
        }
        else if (games[gameID].black == undefined) {
            games[gameID].black = socket.id
            io.to(socket.id).emit('assign-color', "black")
            io.to(gameID).emit('both-players-connected');
        }
        
        const WhoIsInGame = io.in(gameID).allSockets()
        WhoIsInGame.then( connectedSockets => {
            if (connectedSockets.has(games[gameID].white)) {
                io.to(gameID).emit('update-online-status', "white", "online")
            }
            if (connectedSockets.has(games[gameID].black)) {
                io.to(gameID).emit('update-online-status', "black", "online")
            }
        })
        
        io.to(socket.id).emit('moves-played', games[gameID].moveSet);
    })

    socket.on('color-is-online', color => {
        io.to(gameID).emit('update-online-status', color, "online");
    })

    socket.on('user-piece-drop', (gameID, targetSquare) => {
        socket.to(gameID).broadcast.emit('piece-drop', targetSquare);
        games[gameID].moveSet.push(targetSquare);
    })

    socket.on('chat-message', (socketID, messageBody) => {
        let username = getUserRole(gameID, socketID)
        let messageHTML = formatChatMessage(username, messageBody);
        io.to(gameID).emit('receive-chat-message', messageHTML);
    })

    socket.on("disconnect", (reason) => {
        let playerColor;
        if (games[gameID] == undefined) {return};
        if (games[gameID].white == socket.id) {playerColor = "white"}
        else if (games[gameID].black == socket.id) {playerColor = "black"}
        else {return}
        io.to(gameID).emit('update-online-status', playerColor, "offline");
      });
});

function getUserRole (gameID, socketID) {
    if (games[gameID] == undefined) {return "error"}
    if (games[gameID].white != undefined) {
        if (games[gameID].white == socketID) {
            return "white";
        }
    }
    if (games[gameID].black != undefined) {
        if (games[gameID].black == socketID) {
            return "black";
        }
    }
    return "spectator";
}

function formatChatMessage (username, message) {
    username = username.charAt(0).toUpperCase() + username.slice(1);
    return "<em>" + username + ":</em> " + message
}

httpServer.listen(PORT)