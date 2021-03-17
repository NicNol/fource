const socket = io(null, { autoConnect: true });
const gameID = window.location.pathname.slice(1, 12)

var turn = "white"
var userColor = "spectator";
var cells, cellsClone;
var targetSquare;
const whiteToken = "<div class='wp' id='wp-drag' draggable='true' ondragstart='drag(event)'></div>"
const blackToken = "<div class='bp' id='wp-drag' draggable='true' ondragstart='drag(event)'></div>"
var safeDropArray = [];
var whiteScore, blackScore;
var winner;
var lastTurn = false;

socket.emit('player connect', gameID)

socket.on('assign-color', color => {
    userColor = color;
})

socket.on('piece-drop', passedTargetSquare => {
    targetSquare = passedTargetSquare;
    dropPieceIn(targetSquare);
    forcePiecesFrom(targetSquare);
    removeTargetDropClasses();
    nextTurn();
    clearUnsafeDrop();
    setSafeDropArray();
    setScores();
    checkGameOver();
})

function scoreCheck(pieceClass) {
    let clusters = []
    let points = 0;

    for (let i = 0; i < 64; i++) {
        if (cells[i].innerHTML == "") { continue }
        if (clusters.flat().includes(i)) { continue }
        if (cells[i].childNodes[0].classList.contains(pieceClass)) {

            clusters[i] = [];
            clusters[i][0] = i;
            let j = 0;

            while (j < clusters[i].length) {
                if (clusters[i][j] != undefined) {
                    getCluster(clusters[i][j], pieceClass).forEach(eachI => {
                        if (!clusters[i].includes(eachI)) {
                            clusters[i].push(eachI);
                        }
                    })
                }

                j++;
            }
        }
    }
    for (let i = 0; i < clusters.length; i++) {
        if (clusters[i] == undefined) { continue }

        clusters[i] = clusters[i].filter(value => {
            return value != undefined;
        });

        if (clusters[i].length >= 4) {
            points += clusters[i].length;
        }
    }

    return points;
}

function getCluster(cellNumber, pieceClass) {
    if (cells[cellNumber].innerHTML == "") { return [] }
    if (cells[cellNumber].childNodes[0].classList.contains(pieceClass)) {
        return [getClusterUp(cellNumber, pieceClass), getClusterRight(cellNumber, pieceClass),
        getClusterDown(cellNumber, pieceClass),
        getClusterLeft(cellNumber, pieceClass)]
    }

    return []
}

function getClusterUp(cellNumber, pieceClass) {
    if (cellNumber < 8) { return }
    if (cells[cellNumber - 8].innerHTML != "") {
        if (cells[cellNumber - 8].childNodes[0].classList.contains(pieceClass)) {
            return cellNumber - 8;
        }
    }
    return
}

function getClusterRight(cellNumber, pieceClass) {
    if (cellNumber % 8 == 7) { return }
    if (cells[cellNumber + 1].innerHTML != "") {
        if (cells[cellNumber + 1].childNodes[0].classList.contains(pieceClass)) {
            return cellNumber + 1;
        }
    }
    return
}

function getClusterDown(cellNumber, pieceClass) {
    if (cellNumber > 55) { return }
    if (cells[cellNumber + 8].innerHTML != "") {
        if (cells[cellNumber + 8].childNodes[0].classList.contains(pieceClass)) {
            return cellNumber + 8;
        }
    }
    return
}

function getClusterLeft(cellNumber, pieceClass) {
    if (cellNumber % 8 == 0) { return }
    if (cells[cellNumber - 1].innerHTML != "") {
        if (cells[cellNumber - 1].childNodes[0].classList.contains(pieceClass)) {
            return cellNumber - 1;
        }
    }
    return
}

function setScores() {
    whiteScore = scoreCheck("wp");
    blackScore = scoreCheck("bp");
    document.getElementById("white-score").innerHTML = whiteScore;
    document.getElementById("black-score").innerHTML = blackScore;
}

function sendGameMessage(color, message) {
    if (color == "white") {
        document.getElementById("white-message-box").innerHTML = message;
    } else if (color == "black") {
        document.getElementById("black-message-box").innerHTML = message;
    } else if (color == "both") {
        document.getElementById("white-message-box").innerHTML = message;
        document.getElementById("black-message-box").innerHTML = message;
    }
}

function endGame() {
    document.getElementById("white-play").innerHTML = "";
    document.getElementById("black-play").innerHTML = "";
}

function countEmptyCells() {
    let emptyCells = 0;
    for (let i = 0; i < 64; i++) {
        if (cells[i].innerHTML == "") { emptyCells++ }
    }
    return emptyCells;
}

function checkGameOver() {
    checkForWin();
    if (winner == "wp") {
        sendGameMessage("both", "White Wins!");
        endGame();
    }
    if (winner == "bp") {
        sendGameMessage("both", "Black Wins!");
        endGame();
    }

    if (countEmptyCells() == 0) { lastTurn = true; }

    if (lastTurn) {
        if (whiteScore > blackScore) {
            sendGameMessage("both", "White Wins!");
        } else if (blackScore > whiteScore) {
            sendGameMessage("both", "Black Wins");
        } else {
            sendGameMessage("both", "Its a tie!");
        }
        endGame();
    } else if (!safeDropArray.includes(true)) {
        lastTurn = true;
        turn == "white" ? sendGameMessage("white", "No legal moves. Black's turn.") : sendGameMessage("black", "No legal moves. White's turn.")
        nextTurn();
        clearUnsafeDrop();
        setSafeDropArray();
    }
}

async function newGame() {
    getCells();
    for (let i = 0; i < cells.length; i++) {
        if (i == 21 || i == 42) { cells[i].innerHTML = "<div class='wp'></div>" }
        else if (i == 18 || i == 45) { cells[i].innerHTML = "<div class='bp'></div>" }
        else { cells[i].innerHTML = "" }
    }
    turn = "white"
    

    let connectResponse = await didBothUsersConnect;

    nextTurn();
    setSafeDropArray();
    setScores();

    let movesResponse = await getPlayedMoves;
}

var didBothUsersConnect = new Promise((resolve, reject) => {
    socket.on('both-players-connected', () => {
        resolve(true);
    })
})

var getPlayedMoves = new Promise((resolve, reject) => {
    socket.on('moves-played', moveSet => {
        let moveSetLength = moveSet.length;
        //switchTurn();
        for (let i = 0; i < moveSetLength; i++) {
            targetSquare = moveSet[i];
            dropPieceIn(targetSquare);
            forcePiecesFrom(targetSquare);
            nextTurn();
        }
        //switchTurn();
        if (moveSetLength > 0) {
            removeTargetDropClasses();
            clearUnsafeDrop();
            setSafeDropArray();
            setScores();
            checkGameOver();
        }
    })
    resolve();
})

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("piece", ev.target.id);
    renderBoardHTML();
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("piece");
    ev.target.appendChild(document.getElementById(data));
    setTargetSquare(ev.target)
    forcePiecesFrom(targetSquare);
    removeTargetDropClasses();
    nextTurn();
    clearUnsafeDrop();
    setSafeDropArray();
    setScores();
    checkGameOver();
    socket.emit('user-piece-drop', gameID, targetSquare)
}

function setTargetSquare(eventTarget) {
    getCells()
    for (let i = 0; i < cells.length; i++) {
        if (cells[i] === eventTarget) { targetSquare = i; }
    }
}

function createClone() {
    getCells();
    let docFragment = document.createDocumentFragment();
    let basicCell = document.createElement("div");
    let white = document.createElement("div");
    let black = document.createElement("div");
    white.classList.add("wp");
    black.classList.add("bp");
    for (let i = 0; i < 64; i++) {
        docFragment.appendChild(basicCell.cloneNode(true))

        if (cells[i].innerHTML != "") {
            if (cells[i].childNodes[0].classList.contains("wp")) {
                docFragment.childNodes[i].appendChild(white.cloneNode(true));
            } else {
                docFragment.childNodes[i].appendChild(black.cloneNode(true));
            }
        }
    }

    cellsClone = docFragment.children;
}

function setSafeDropArray() {
    safeDropArray = [];
    for (let i = 0; i < 64; i++) {
        createClone();
        if (cells[i].innerHTML != "") {
            safeDropArray.push(false);
        } else {
            dropPieceIn(i, cellsClone);
            forcePiecesFrom(i, cellsClone);
            safeDropArray.push(!checkForConsecutive(3, true, cellsClone));
        }
    }
}

function dropPieceIn(cellNumber, cellSet = cells) {
    let white = document.createElement("div");
    let black = document.createElement("div");
    white.classList.add("wp");
    black.classList.add("bp");

    turn == "white" ? cellSet[cellNumber].appendChild(black) : cellSet[cellNumber].appendChild(white);
}

function clearUnsafeDrop() {
    getCells();
    for (let i = 0; i < cells.length; i++) {
        if (cells[i].classList.contains("unsafeDrop")) { cells[i].classList.remove("unsafeDrop") }
    }
}

function removeTargetDropClasses() {
    cells[targetSquare].childNodes[0].removeAttribute("id");
    cells[targetSquare].childNodes[0].removeAttribute("draggable");
    cells[targetSquare].childNodes[0].removeAttribute("ondragstart");
    cells[targetSquare].removeAttribute("ondrop");
    cells[targetSquare].removeAttribute("ondragover");
}

function renderBoardHTML() {
    getCells();
    for (let i = 0; i < cells.length; i++) {
        if (safeDropArray[i]) {
            cells[i].setAttribute("ondrop", "drop(event)");
            cells[i].setAttribute("ondragover", "allowDrop(event)");
        } else {
            if (cells[i].innerHTML == "") { cells[i].classList.add("unsafeDrop"); }
            if (cells[i].hasAttribute("ondrop")) { cells[i].removeAttribute("ondrop"); }
            if (cells[i].hasAttribute("ondragover")) { cells[i].removeAttribute("ondragover"); }
        }
    }
}

function getCells() {
    cells = document.getElementsByClassName("cell");
}

function switchTurn() {
    turn == "white" ? turn = "black" : turn = "white";
}

function nextTurn() {
    if (turn !== userColor) {
        switchTurn();
        return;
    }

    if (turn == "white") {
        document.getElementById("white-play").innerHTML = whiteToken;
    } else {
        document.getElementById("black-play").innerHTML = blackToken;
    }

    switchTurn();
}

function forcePiecesFrom(cellNumber, cellSet = cells) {
    pushPiecesFrom(cellNumber, cellSet);
    pullPiecesFrom(cellNumber, cellSet);
}

function pushPiecesFrom(cellNumber, cellSet = cells) {
    //always push pieces opposite color of variable "turn"
    getCells();

    let pushClass;
    turn == "white" ? pushClass = "wp" : pushClass = "bp"

    pushPiecesLeftFrom(cellNumber, pushClass, cellSet);
    pushPiecesRightFrom(cellNumber, pushClass, cellSet);
    pushPiecesUpFrom(cellNumber, pushClass, cellSet);
    pushPiecesDownFrom(cellNumber, pushClass, cellSet);

}

function pushPiecesLeftFrom(cellNumber, pushClass, cellSet = cells) {

    let pushedPiece;

    for (let i = 0; i < cellNumber % 8; i++) {
        if (cellSet[cellNumber - 1 - i].innerHTML != "") {
            if (pushedPiece == undefined) {
                if (cellSet[cellNumber - 1 - i].childNodes[0].classList.contains(pushClass)) {
                    pushedPiece = cellSet[cellNumber - 1 - i].childNodes[0];
                    continue;
                } else {
                    break;
                }
            } else {
                // Piece can't be pushed further in this direction
                break;
            }
        } else {
            if (pushedPiece != undefined) {
                cellSet[cellNumber - i].innerHTML = ""
                cellSet[cellNumber - 1 - i].appendChild(pushedPiece)
            }
        }
    }
}

function pushPiecesRightFrom(cellNumber, pushClass, cellSet = cells) {

    let pushedPiece;

    for (let i = cellNumber + 1; i < Math.floor((cellNumber + 8) / 8) * 8; i++) {
        if (cellSet[i].innerHTML != "") {
            if (pushedPiece == undefined) {
                if (cellSet[i].childNodes[0].classList.contains(pushClass)) {
                    pushedPiece = cellSet[i].childNodes[0];
                    continue;
                } else {
                    break;
                }
            } else {
                // Piece can't be pushed further in this direction
                break;
            }
        } else {
            if (pushedPiece != undefined) {
                cellSet[i - 1].innerHTML = ""
                cellSet[i].appendChild(pushedPiece);
            }
        }
    }
}

function pushPiecesUpFrom(cellNumber, pushClass, cellSet = cells) {

    let pushedPiece;
    let y = Math.floor(cellNumber / 8)
    let x = cellNumber % 8

    for (let i = 0; i < y; i++) {
        if (cellSet[(y - 1 - i) * 8 + x].innerHTML != "") {
            if (pushedPiece == undefined) {
                if (cellSet[(y - 1 - i) * 8 + x].childNodes[0].classList.contains(pushClass)) {
                    pushedPiece = cellSet[(y - 1 - i) * 8 + x].childNodes[0];
                    continue;
                } else break;
            } else break;
        } else {
            if (pushedPiece != undefined) {
                cellSet[(y - i) * 8 + x].innerHTML = ""
                cellSet[(y - 1 - i) * 8 + x].appendChild(pushedPiece);
            }
        }
    }
}

function pushPiecesDownFrom(cellNumber, pushClass, cellSet = cells) {

    let pushedPiece;
    let y = Math.floor(cellNumber / 8)
    let x = cellNumber % 8

    for (let i = y; i < 7; i++) {
        if (cellSet[(i + 1) * 8 + x].innerHTML != "") {
            if (pushedPiece == undefined) {
                if (cellSet[(i + 1) * 8 + x].childNodes[0].classList.contains(pushClass)) {
                    pushedPiece = cellSet[(i + 1) * 8 + x].childNodes[0];
                    continue;
                } else break;
            } else break;
        } else {
            if (pushedPiece != undefined) {
                cellSet[i * 8 + x].innerHTML = ""
                cellSet[(i + 1) * 8 + x].appendChild(pushedPiece);
            }
        }
    }
}

function pullPiecesFrom(cellNumber, cellSet = cells) {
    getCells();

    let pullClass;
    turn == "white" ? pullClass = "bp" : pullClass = "wp"

    pullPiecesLeftFrom(cellNumber, pullClass, cellSet);
    pullPiecesRightFrom(cellNumber, pullClass, cellSet);
    pullPiecesUpFrom(cellNumber, pullClass, cellSet);
    pullPiecesDownFrom(cellNumber, pullClass, cellSet);
}

function pullPiecesLeftFrom(cellNumber, pullClass, cellSet = cells) {
    for (let i = 0; i < cellNumber % 8; i++) {
        if (cellSet[cellNumber - 1 - i].innerHTML != "") {
            if (cellSet[cellNumber - 1 - i].childNodes[0].classList.contains(pullClass)) {
                cellSet[cellNumber - 1].appendChild(cellSet[cellNumber - 1 - i].childNodes[0])
                break;
            } else break;
        }
    }
}

function pullPiecesRightFrom(cellNumber, pullClass, cellSet = cells) {
    for (let i = cellNumber + 1; i < Math.floor(cellNumber / 8) * 8 + 8; i++) {
        if (cellSet[i].innerHTML != "") {
            if (cellSet[i].childNodes[0].classList.contains(pullClass)) {
                cellSet[cellNumber + 1].appendChild(cellSet[i].childNodes[0])
                break;
            } else break;
        }
    }
}

function pullPiecesDownFrom(cellNumber, pullClass, cellSet = cells) {
    let x = cellNumber % 8
    let y = Math.floor(cellNumber / 8)

    for (let i = 0; i < y; i++) {
        if (cellSet[(y - i - 1) * 8 + x].innerHTML != "") {
            if (cellSet[(y - i - 1) * 8 + x].childNodes[0].classList.contains(pullClass)) {
                cellSet[(y - 1) * 8 + x].appendChild(cellSet[(y - i - 1) * 8 + x].childNodes[0])
                break;
            } else break;
        }
    }
}

function pullPiecesUpFrom(cellNumber, pullClass, cellSet = cells) {
    let x = cellNumber % 8
    let y = Math.floor(cellNumber / 8)

    for (let i = y; i < 7; i++) {
        if (cellSet[(i + 1) * 8 + x].innerHTML != "") {
            if (cellSet[(i + 1) * 8 + x].childNodes[0].classList.contains(pullClass)) {
                cellSet[(y + 1) * 8 + x].appendChild(cellSet[(i + 1) * 8 + x].childNodes[0])
                break;
            } else break;
        }
    }
}

function checkForConsecutiveHorizontal(numberConsecutive, mustBeExact = false, cellSet = cells) {
    let consec = 0;
    let prevClass = "";

    //skip edge cells per rules
    for (let i = 8; i < 56; i++) {
        if (i % 8 == 0) {
            if (consec == numberConsecutive && mustBeExact) { return true }
            consec = 0;
            prevClass = "";
        }

        if (cellSet[i].innerHTML != "") {
            if (cellSet[i].childNodes[0].classList.contains("wp")) {
                if (prevClass != "wp") {
                    if (consec == numberConsecutive && mustBeExact) { return true }
                    consec = 0;
                    prevClass = "wp"
                }
                consec++;
            } else if (cellSet[i].childNodes[0].classList.contains("bp")) {
                if (prevClass != "bp") {
                    if (consec == numberConsecutive && mustBeExact) { return true }
                    consec = 0;
                    prevClass = "bp"
                }
                consec++;
            }
        } else {
            if (consec == numberConsecutive && mustBeExact) { return true }
            consec = 0;
            prevClass = "";
            continue;
        }

        if (consec == numberConsecutive && !mustBeExact) { return true; }
    }

    if (consec == numberConsecutive) { return true; }
    return false;
}

function checkForConsecutiveVertical(numberConsecutive, mustBeExact = false, cellSet = cells) {
    let consec = 0;
    let prevClass = "";

    //skip edge cells per rules
    for (let i = 8; i < 56; i++) {
        if (i % 8 == 0) {
            if (consec == numberConsecutive && mustBeExact) { return true }
            consec = 0;
            prevClass = "";
        }

        if (cellSet[(i % 8) * 8 + Math.floor(i / 8)].innerHTML != "") {
            if (cellSet[(i % 8) * 8 + Math.floor(i / 8)].childNodes[0].classList.contains("wp")) {
                if (prevClass != "wp") {
                    if (consec == numberConsecutive && mustBeExact) { return true }
                    consec = 0;
                    prevClass = "wp";
                }
                consec++;
            } else if (cellSet[(i % 8) * 8 + Math.floor(i / 8)].childNodes[0].classList.contains("bp")) {
                if (prevClass != "bp") {
                    if (consec == numberConsecutive && mustBeExact) { return true }
                    consec = 0;
                    prevClass = "bp"
                }
                consec++;
            }
        } else {
            if (consec == numberConsecutive && mustBeExact) { return true }
            consec = 0;
            prevClass = ""
            continue;
        }

        if (consec == numberConsecutive && !mustBeExact) { return true; }
    }

    if (consec == numberConsecutive) { return true; }
    return false
}

function checkForConsecutive(numberConsecutive, mustBeExact = false, cellSet = cells) {
    if (checkForConsecutiveHorizontal(numberConsecutive, mustBeExact, cellSet) || checkForConsecutiveVertical(numberConsecutive, mustBeExact, cellSet)) return true
    else return false;
}

function checkForWinVertical(pieceClass) {
    let consec = 0;
    let prevClass = "";
    let vCell;

    //skip edge cells per rules
    for (let i = 8; i < 56; i++) {
        vCell = (i % 8) * 8 + Math.floor(i / 8)

        if (i % 8 == 0) {
            consec = 0;
            prevClass = "";
        }

        if (cells[vCell].innerHTML != "") {
            if (cells[vCell].childNodes[0].classList.contains(pieceClass)) {
                prevClass = pieceClass;
                if (++consec == 4) { return true; }
                continue;
            }
        }
        consec = 0;
        prevClass = "";
    }
    return false;
}

function checkForWinHorizontal(pieceClass) {
    let consec = 0;
    let prevClass = "";

    //skip edge cells per rules
    for (let i = 8; i < 56; i++) {
        if (i % 8 == 0) {
            consec = 0;
            prevClass = "";
        }

        if (cells[i].innerHTML != "") {
            if (cells[i].childNodes[0].classList.contains(pieceClass)) {
                prevClass = pieceClass;
                if (++consec == 4) { return true; }
                continue;
            }
        }
        consec = 0;
        prevClass = "";
    }
    return false;
}

function checkForWin() {
    let pieceClass;
    let otherPieceClass;
    turn == "white" ? pieceClass = "wp" : pieceClass = "bp";
    turn == "white" ? otherPieceClass = "bp" : otherPieceClass = "wp";

    if (checkForWinHorizontal(pieceClass) || checkForWinVertical(pieceClass)) { winner = pieceClass }
    else if (checkForWinHorizontal(otherPieceClass) || checkForWinVertical(otherPieceClass)) { winner = otherPieceClass }
}