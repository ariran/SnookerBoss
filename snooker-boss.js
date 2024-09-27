"use strict";

var fileHandle = null;

const MAX_TOTAL = 147;

const RED = 1;
const YELLOW = 2;
const GREEN = 3;
const BROWN = 4;
const BLUE = 5;
const PINK = 6;
const BLACK = 7;
const GRAY = 0;

// TODO
//var colorsLeft = [0, 15, 1, 1, 1, 1, 1, 1];
var colorsLeft = [0, 4, 1, 1, 1, 1, 1, 1];

var player1name = "";
var player2name = "";
var player1total = 0;
var player2total = 0;

var currentPlayer = 1;
var potHistory = [];
var canUndo = false;
var lastRedPotted = false;

class Pot {
    constructor(player, color, extra, elem) {
        this.player = player;
        this.color = color;
        this.extra = extra;
        this.elem = elem;
    }
}

function savePlayers() {
    player1name = document.forms["playersform"]["player1name"].value;
    player2name = document.forms["playersform"]["player2name"].value;

    document.getElementById("player1").innerHTML = player1name;
    document.getElementById("player2").innerHTML = player2name;
    
    document.getElementById("players").style.display = "none";
    document.getElementById("game").style.display = "block";
}

function addPoints(color, elem, extra = 0) {
    if (color !== GRAY && colorsLeft[color] <= 0) {
        return;
    }

    if (color !== GRAY) {
        elem.classList.remove("runanimation");
    }
    setTimeout(() => {
        let amount = 0;
        if (color !== GRAY) {
            elem.classList.add("runanimation");
        }
        if (color === GRAY) {
            amount = extra;
        } else {
            amount = color;
            if (color === RED) {
                --colorsLeft[RED];
                lastRedPotted = colorsLeft[RED] === 0;
            } else if (colorsLeft[RED] === 0) {
                if (lastRedPotted) {
                    lastRedPotted = false;
                } else {
                    colorsLeft[color] = 0;
                }
            }
        }
        
        if (currentPlayer === 1) {
            player1total += amount;
        } else {
            player2total += amount;
        }
    
        if (color !== GRAY && colorsLeft[color] <= 0) {
            elem.style.visibility = "hidden";
        }

        updateUIFields(color);
        
        potHistory.push(new Pot(currentPlayer, color, extra, elem));
        canUndo = true;
        saveFile(false);
    }, 0);
}

function addExtra() {
    const text = document.getElementById("extra").value;
    let e = +text;
    if (!Number.isInteger(e)) {
        showNotification("not a number");
    } else {
        addPoints(GRAY, null, e);
    }
    document.getElementById("extra").value = ""
}

function selectPlayer(player) {
    currentPlayer = player;
    if (player === 1) {
        document.getElementById("player1").classList.add("selected");
        document.getElementById("player2").classList.remove("selected");
    } else {
        document.getElementById("player1").classList.remove("selected");
        document.getElementById("player2").classList.add("selected");
    }
}

function calculatePointsLeft(color) {
    const oneBlack = color === RED ? BLACK : 0;
    let sum = colorsLeft[RED] * (RED + BLACK) + oneBlack;
    for (let i = 2; i < colorsLeft.length; i++) {
        sum += (i * colorsLeft[i]);
    }
    return sum;
}

function calculateNeededSnookers(playerPoints, leadingPlayerPoints, pointsLeft) {
    let neededPoints = leadingPlayerPoints - pointsLeft - playerPoints;
    let neededSnookers = Math.floor(neededPoints / 4);
    let mod = neededPoints % 4;
    neededSnookers += mod > 0 ? 1 : 0;
    return neededSnookers;
}

function undoLast() {
    if (canUndo && potHistory.length > 0) {
        let {player, color, extra, elem} = potHistory.pop();
        canUndo = false;
        console.log(player, color, extra, elem);

        if (color === RED) {
            ++colorsLeft[RED];
        } else if (color !== GRAY && colorsLeft[RED] === 0) {
            colorsLeft[color] = 1;
        }
        
        if (player === 1) {
            player1total -= color === GRAY ? extra : color;
        } else {
            player2total -= color === GRAY ? extra : color;
        }
    
        if (color !== GRAY && colorsLeft[color] > 0) {
            elem.style.visibility = "visible";
        }

        updateUIFields(color);
    }
}

function updateUIFields(color) {
    document.getElementById("total1").innerHTML = player1total;
    document.getElementById("total2").innerHTML = player2total;

    let pointsLeft = calculatePointsLeft(color);
    document.getElementById("points-left").innerHTML = `Points left on table: ${pointsLeft}`;

    if (player1total > player2total + pointsLeft) {
        document.getElementById("total2").classList.add("minlimitreached");
        let snookers = calculateNeededSnookers(player2total, player1total, pointsLeft);
        if (snookers > 0) {
            document.getElementById("snookers2").innerHTML = snookers;
            document.getElementById("snookers2").style.visibility = "visible";
        }
        document.getElementById("points-left").style.visibility = "visible";
    }
    else if (player2total > player1total + pointsLeft) {
        document.getElementById("total1").classList.add("minlimitreached");
        let snookers = calculateNeededSnookers(player1total, player2total, pointsLeft);
        if (snookers > 0) {
            document.getElementById("snookers1").innerHTML = snookers;
            document.getElementById("snookers1").style.visibility = "visible";
        }
        document.getElementById("points-left").style.visibility = "visible";
    }
    else {
        document.getElementById("snookers1").innerHTML = 0;
        document.getElementById("snookers2").innerHTML = 0;
        document.getElementById("snookers1").style.visibility = "hidden";
        document.getElementById("snookers2").style.visibility = "hidden";
        
        document.getElementById("total1").classList.remove("minlimitreached");
        document.getElementById("total2").classList.remove("minlimitreached");
        document.getElementById("points-left").style.visibility = "hidden";
    }
    if (pointsLeft === 0) {
        document.getElementById("extra").disabled = true;
        document.getElementById("extraButton").disabled = true;
    } else {
        document.getElementById("extra").disabled = false;
        document.getElementById("extraButton").disabled = false;
    }
}

function resetAll(skipConfirmation = false) {
    if (skipConfirmation || confirm("Are you sure?")) {
        colorsLeft = [0, 15, 1, 1, 1, 1, 1, 1];
        player1total = 0;
        player2total = 0;
    
        potHistory = [];
        canUndo = false;

        let dots = document.getElementsByClassName("dot");
        for (let d of dots) {
            d.style.visibility = "visible";
        }

        selectPlayer(1);
        updateUIFields(BLACK);
    }
}

function startNew() {
    if (confirm("Are you sure?")) {
        resetAll(true);
        
        player1name = "";
        player2name = "";
        document.forms["playersform"]["player1name"].value = "";
        document.forms["playersform"]["player2name"].value = "";
    
        document.getElementById("player1").innerHTML = player1name;
        document.getElementById("player2").innerHTML = player2name;
        document.getElementById("players").style.display = "block";
        document.getElementById("game").style.display = "none";
    }
}

async function saveFile(prompt = true) {
    if (fileHandle == null && !prompt) {
        showNotification("NOT SAVED", true);
        return;
    }
    let data = createPersistData();
    //console.log(`data = ${data}`);
    if (fileHandle == null) {
        const filePickerOpts = {
            id: "snooker-boss",
            startIn: "documents",
            suggestedName: "game-status-1.json"
        };
        fileHandle = await window.showSaveFilePicker(filePickerOpts);
    }
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(JSON.stringify(data));
    await writableStream.close();
    showNotification("saved");
}

function createPersistData() {
    return {
        colorsLeft: colorsLeft,
        player1name: player1name,
        player2name: player2name,
        player1total: player1total,
        player2total: player2total,
        currentPlayer: currentPlayer,
        potHistory: potHistory
    };
}

async function loadPersistData() {
    const [handle] = await window.showOpenFilePicker();
    fileHandle = handle;
    const fileData = await fileHandle.getFile();
    
    let reader = new FileReader();
    reader.onload = function() {
        let text = reader.result;
        console.log(text);
        let persistData = JSON.parse(text);
        colorsLeft = persistData.colorsLeft;
        player1name = persistData.player1name;
        player2name = persistData.player2name;
        player1total = persistData.player1total;
        player2total = persistData.player2total;
        currentPlayer = persistData.currentPlayer;
        potHistory = persistData.potHistory;
        canUndo = false;
     
        document.getElementById("player1").innerHTML = player1name;
        document.getElementById("player2").innerHTML = player2name;
        document.getElementById("players").style.display = "none";
        document.getElementById("game").style.display = "block";
        selectPlayer(currentPlayer);
        updateUIFields(BLACK);
    };
    reader.readAsText(fileData);
}

function showNotification(text, keep = false) {
    const notification = document.getElementById("notification");
    notification.innerHTML = text;
    notification.classList.remove("hidden");
    if (!keep) {
        setTimeout(() => {
            notification.classList.add("hidden");
        }, 2500);
    }
}