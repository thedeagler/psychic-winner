cards = {
    "copper": {
        expansion: "Core",
        id: "copper",
        name: "Copper",
        type: "treasure",
        cost: 0,
        image: "http://i.imgur.com/8jlCjyp.png",
        value: 10,
        victory: 0,
        action: function(player) {
            player.coins += this.value;
            io.sockets.emit("log", " ... and gets 1 coin");
            gameState.phase = "buy";
        }
    },
    "silver": {
        expansion: "Core",
        id: "silver",
        name: "Silver",
        type: "treasure",
        cost: 3,
        value: 2,
        victory: 0,
        action: function(player) {
            player.coins += this.value;
            io.sockets.emit("log", " ... and gets 2 coins");
            gameState.phase = "buy";
        }
    },
    "gold": {
        expansion: "Core",
        id: "gold",
        name: "Gold",
        type: "treasure",
        cost: 6,
        value: 3,
        victory: 0,
        action: function(player) {
            player.coins += this.value;
            io.sockets.emit("log", " ... and gets 3 coins");
            gameState.phase = "buy";
        }
    },
    "estate": {
        expansion: "Core",
        id: "estate",
        name: "Estate",
        type: "victory",
        cost: 2,
        value: 0,
        victory: 1
    },
    "duchy": {
        expansion: "Core",
        id: "duchy",
        name: "Duchy",
        type: "victory",
        cost: 5,
        value: 0,
        victory: 3
    },
    "province": {
        expansion: "Core",
        id: "province",
        name: "Province",
        type: "victory",
        cost: 8,
        value: 0,
        victory: 6
    },
    "curse": {
        expansion: "Core",
        id: "curse",
        name: "Curse",
        type: "curse",
        cost: 0,
        value: 0,
        victory: -1
    },
    "mine": {
        expansion: "Base",
        description: "Trash a Treasure card from your hand. Gain a Treasure card costing up to 3 Coins more; put it into your hand.",
        id: "mine",
        name: "Mine",
        type: "action",
        cost: 5,
        value: 0,
        victory: 0,
        action: function(player) {
            gameState.phase = "select";
            gameState.queryData = {
                eligible: ".your.player .hand .card.treasure",
                number: 1,
                unique: true,
                exact: false,
                selected: [],
                callback: function(data) {
                    for (var i in data) {
                        var cardIndex = data[0].index;
                        var cost = cards[player.hand[cardIndex].id].cost;
                        var query = ".buyable .card.treasure.COST0";
                        for (var j = 1; j <= cost + 3; j++) {
                            query += ", .buyable .card.treasure.COST" + j;
                        }
                        gameState.trash.push(player.hand[cardIndex]);
                        player.hand.splice(cardIndex, 1);
                        gameState.phase = "select";
                        gameState.queryData = {
                            eligible: query,
                            number: 1,
                            unique: true,
                            exact: false,
                            selected: [],
                            callback: function(data) {
                                player.hand.push(data[0].card);
                                gameState.phase = "action";
                                io.sockets.emit("gameState", gameState);
                            }
                        };
                        io.sockets.emit("gameState", gameState);
                    }
                    if (data.length === 0) {
                        gameState.phase = "action";
                        io.sockets.emit("gameState", gameState);
                    }
                }
            };
        }
    },
    "village": {
        expansion: "Base",
        id: "village",
        name: "Village",
        description: "+1 Card; +2 Actions.",
        type: "action",
        cost: 3,
        value: 0,
        victory: 0,
        action: function(player) {
            draw(player, 1);
            player.actions += 2;
        }
    },
    "workshop": {
        expansion: "Base",
        description: "Gain a card costing up to 4 Coins.",
        id: "workshop",
        name: "Workshop",
        type: "action",
        cost: 3,
        image: "http://i.imgur.com/GvrGyRa.jpg",
        value: 0,
        victory: 0,
        action: function(player) {
            gameState.phase = "select";
            gameState.queryData = {
                eligible: ".buyable .card.COST4, .buyable .card.COST3, .buyable .card.COST2, .buyable .card.COST1, .buyable .card.COST0",
                number: 1,
                unique: true,
                exact: true,
                selected: [],
                callback: function(data) {
                    io.sockets.emit("log", " ... and gets " + data[0].card.name);
                    player.discard.push(data[0].card);
                    gameState.phase = "action";
                    io.sockets.emit("gameState", gameState);
                }
            };
        }
    },
    "chapel": {
        expansion: "Base",
        description: "Trash up to 4 Cards from your hand.",
        id: "chapel",
        name: "Chapel",
        type: "action",
        cost: 2,
        value: 0,
        victory: 0,
        action: function(player) {
            gameState.phase = "select";
            gameState.queryData = {
                eligible: ".your.player .hand .card",
                number: 4,
                unique: true,
                exact: false,
                selected: [],
                callback: function(data) {
                    var targetCardIndices = [];
                    for (var i in data) {
                        targetCardIndices.push(data[i].index);
                    }
                    targetCardIndices.sort(function(a, b) {
                        return b - a;
                    });
                    for (var i = 0; i < targetCardIndices.length; i++) {
                        var cardIndex = targetCardIndices[i];
                        io.sockets.emit("log", " ... and trashes " + cards[player.hand[cardIndex].id].name);
                        gameState.trash.push(player.hand[cardIndex]);
                        player.hand.splice(cardIndex, 1);
                    }
                    gameState.phase = "action";
                    io.sockets.emit("gameState", gameState);
                }
            };
        }
    },
    "moneylender": {
        expansion: "Base",
        description: "Trash a Copper from your hand. If you do, +3 Coins.",
        id: "moneylender",
        name: "Moneylender",
        type: "action",
        cost: 4,
        value: 0,
        victory: 0,
        action: function(player) {
            gameState.phase = "select";
            gameState.queryData = {
                eligible: ".your.player .hand .card.ID1",
                number: 1,
                unique: true,
                exact: false,
                selected: [],
                callback: function(data) {
                    for (var i in data) {
                        io.sockets.emit("log", " ... and trashes a copper for 3 treasure ");
                        var cardIndex = data[0].index;
                        gameState.trash.push(player.hand[cardIndex]);
                        player.hand.splice(cardIndex, 1);
                        player.coins += 3;
                    }
                    gameState.phase = "action";
                    io.sockets.emit("gameState", gameState);
                }
            };
        }
    },
    "smithy": {
        expansion: "Base",
        id: "smithy",
        description: "Draw 3 cards.",
        name: "Smithy",
        type: "action",
        cost: 4,
        value: 0,
        victory: 0,
        action: function(player) {
            draw(player, 3);
        }
    },
    "woodcutter": {
        expansion: "Base",
        id: "woodcutter",
        description: "+1 Buy, +2 Coins.",
        name: "Woodcutter",
        type: "action",
        cost: 3,
        value: 0,
        victory: 0,
        action: function(player) {
            player.buys += 1;
            player.coins += 2;
        }
    },
    "festival": {
        expansion: "Base",
        id: "festival",
        description: "+2 Actions, +1 Buy, +2 Coins.",
        name: "Festival",
        type: "action",
        cost: 5,
        value: 0,
        victory: 0,
        action: function(player) {
            player.buys += 1;
            player.actions += 2;
            player.coins += 2;
        }
    },
    "laboratory": {
        expansion: "Base",
        id: "laboratory",
        description: "+2 Cards, +1 Action.",
        name: "Laboratory",
        type: "action",
        cost: 5,
        value: 0,
        victory: 0,
        action: function(player) {
            draw(player, 2);
            player.actions += 1;
        }
    },
    "market": {
        expansion: "Base",
        id: "market",
        description: "+1 Card, +1 Action, +1 Buy, +1 Coin.",
        name: "Market",
        type: "action",
        cost: 5,
        value: 0,
        victory: 0,
        action: function(player) {
            draw(player, 1);
            player.buys += 1;
            player.actions += 1;
            player.coins += 1;
        }
    },
    "great hall": {
        expansion: "Intrigue",
        id: "great hall",
        description: "1 Victory, +1 Card, +1 Action.",
        name: "Great Hall",
        type: "action victory",
        cost: 3,
        value: 0,
        victory: 1,
        action: function(player) {
            draw(player, 1);
            player.actions += 1;
        }
    },
    "shanty town": {
        expansion: "Intrigue",
        id: "shanty town",
        description: "+2 Actions, Reveal your hand. If you have no Action cards in hand, +2 Cards.",
        name: "Shanty Town",
        type: "action",
        cost: 3,
        value: 0,
        victory: 0,
        action: function(player) {
            player.actions += 2;
            //Still needs reveal function
            var hasNoActions = true;
            for (var cardRef in player.hand) {
                if (cards[player.hand[cardRef].id].type.indexOf("action") >= 0) hasNoActions = false;
            }
            if (hasNoActions) draw(player, 2);
        }
    },
    "ironworks": {
        expansion: "Intrigue",
        id: "ironworks",
        description: "Gain a card costing up to 4 Coins. If it is an... Action card, +1 Action. Treasure card, +1 Coin. Victory card, +1 Card.",
        name: "Ironworks",
        type: "action",
        cost: 4,
        value: 0,
        victory: 0,
        action: function(player) {
            gameState.phase = "select";
            gameState.queryData = {
                eligible: ".buyable .card.COST4, .buyable .card.COST3, .buyable .card.COST2, .buyable .card.COST1, .buyable .card.COST0",
                number: 1,
                unique: true,
                exact: true,
                selected: [],
                callback: function(data) {
                    io.sockets.emit("log", " ... and gets " + data[0].card.name);
                    player.discard.push(data[0].card);
                    gameState.phase = "action";
                    if (data[0].card.type.indexOf("action") >= 0) {
                        player.actions += 1;
                        io.sockets.emit("log", " ... and gets +1 Action");
                    }
                    if (data[0].card.type.indexOf("treasure") >= 0) {
                        player.coins = +1;
                        io.sockets.emit("log", " ... and gets +1 Coin");
                    }
                    if (data[0].card.type.indexOf("victory") >= 0) {
                        draw(player, 1);
                        io.sockets.emit("log", " ... and gets +1 Card");
                    }
                    io.sockets.emit("gameState", gameState);
                }
            };
        }
    },
    "chancellor": {
        id: "chancellor",
        expansion: "Intrigue",
        description: "+2 Coins, You may immediately put your deck into your discard pile.",
        name: "Chancellor",
        type: "action",
        cost: 3,
        value: 0,
        victory: 0,
        action: function(player) {
            player.coins += 2;
            gameState.phase = "choose";
            gameState.queryData = {
                number: 1,
                exact: true,
                message: "Put your deck into your discard pile?",
                choices: ["Yes", "No"],
                selected: [],
                callback: function(choiceIndexArray) {
                    if (choiceIndexArray[0] === 0) {
                        while (player.deck.length > 0) {
                            player.discard.push(player.deck.pop());
                        }
                    };
                    gameState.phase = "action";
                    io.sockets.emit("gameState", gameState);
                }
            };
        }
    },
    "pawn": {
        id: "pawn",
        expansion: "Intrigue",
        description: "Choose two: +1 Card, +1 Action, +1 Buy, +1 Coin. (The choices must be different).",
        name: "Pawn",
        type: "action",
        cost: 2,
        value: 0,
        victory: 0,
        action: function(player) {
            gameState.phase = "choose";
            gameState.queryData = {
                number: 2,
                exact: true,
                message: "Choose two (the choices must be different).",
                choices: ["+1 Card", "+1 Action", "+1 Buy", "+1 Coin"],
                selected: [],
                callback: function(choiceIndexArray) {
                    for (var i = 0; i < choiceIndexArray.length; i++) {
                        if (choiceIndexArray[i] === 0) draw(player, 1);
                        if (choiceIndexArray[i] === 1) {
                            player.actions += 1;
                            io.sockets.emit("log", " gains +1 Action.");
                        }
                        if (choiceIndexArray[i] === 2) {
                            player.buys += 1;
                            io.sockets.emit("log", " gains +1 Buy.");
                        }
                        if (choiceIndexArray[i] === 3) {
                            player.coins +=1;
                            io.sockets.emit("log", " gains +1 Coin.");
                        }
                        gameState.phase = "action";
                        io.sockets.emit("gameState", gameState);
                    }
                }
            };
        }
    },
    "steward": {
        id: "steward",
        expansion: "Intrigue",
        description: "Choose one: +2 Cards; or +2 Coins; or trash 2 cards from your hand.",
        name: "Steward",
        type: "action",
        cost: 3,
        value: 0,
        victory: 0,
        action: function(player) {
            gameState.phase = "choose";
            gameState.queryData = {
                number: 1,
                exact: true,
                message: "Choose one.",
                choices: ["+2 Cards", "+2 Coins", "Trash 2 cards from your hand"],
                selected: [],
                callback: function(choiceIndexArray) {
                    for (var i = 0; i < choiceIndexArray.length; i++) {
                        if (choiceIndexArray[i] === 0) {
                            draw(player, 2);
                            gameState.phase = "action";
                        }
                        else if (choiceIndexArray[i] === 1) {
                            player.coins += 2;
                            io.sockets.emit("log", " gains +2 Coins.");
                            gameState.phase = "action";
                        }
                        else if (choiceIndexArray[i] === 2) {
                            gameState.phase = "select";
                            gameState.queryData = {
                                eligible: ".your.player .hand .card",
                                number: 2,
                                unique: true,
                                exact: true,
                                selected: [],
                                callback: function(data) {
                                    var targetCardIndices = [];
                                    for (var i in data) {
                                        targetCardIndices.push(data[i].index);
                                    }
                                    targetCardIndices.sort(function(a, b) {
                                        return b - a;
                                    });
                                    for (var i = 0; i < targetCardIndices.length; i++) {
                                        var cardIndex = targetCardIndices[i];
                                        io.sockets.emit("log", " ... and trashes " + cards[player.hand[cardIndex].id].name);
                                        gameState.trash.push(player.hand[cardIndex]);
                                        player.hand.splice(cardIndex, 1);
                                    }
                                    gameState.phase = "action";
                                    io.sockets.emit("gameState", gameState);
                                }
                            }
                        }
                        io.sockets.emit("gameState", gameState);
                    }
                }
            };
        }
    },
    "remodel": {
        expansion: "Intrigue",
        id: "remodel",
        description: "Trash a card from your hand. Gain a card costing up to 2 Coins more than the trashed card.",
        name: "Remodel",
        type: "action",
        cost: 4,
        value: 0,
        victory: 0,
        action: function(player) {
        gameState.phase = "select";
        gameState.queryData = {
                eligible: ".your.player .hand .card",
                number: 1,
                unique: true,
                exact: false,
                selected: [],
                callback: function(data) {
                    for (var i in data) {
                        var cardIndex = data[0].index;
                        var cost = cards[player.hand[cardIndex].id].cost;
                        var query = ".buyable .card.COST0";
                        for (var j = 1; j <= cost + 2; j++) {
                            query += ", .buyable .card.COST" + j;
                        }
                        io.sockets.emit("log", cards[player.hand[cardIndex].id].name + " was trashed.");
                        gameState.trash.push(player.hand[cardIndex]);
                        player.hand.splice(cardIndex, 1);
                        gameState.phase = "select";
                        gameState.queryData = {
                            eligible: query,
                            number: 1,
                            unique: true,
                            exact: false,
                            selected: [],
                            callback: function(data) {
                                io.sockets.emit("log", " ... and gets " + data[0].card.name);
                                player.discard.push(data[0].card);
                                gameState.phase = "action";
                                io.sockets.emit("gameState", gameState);
                            }
                        };
                        io.sockets.emit("gameState", gameState);
                    }
                    if (data.length === 0) {
                        gameState.phase = "action";
                        io.sockets.emit("gameState", gameState);
                    }
                }
            };
        }
    },
    "mining village": {
        expansion: "Intrigue",
        description: "+1 Card, +2 Actions. You may trash this card immediately. If you do, +2 Coins.",
        id: "mining village",
        name: "Mining Village",
        type: "action",
        cost: 4,
        value: 0,
        victory: 0,
        action: function(player) {
            draw(player, 1);
            player.actions += 2;
            gameState.phase = "choose";
            gameState.queryData = {
                number: 1,
                exact: true,
                message: "Would you like to trash Mining Village for +2 Coins?",
                choices: ["Yes", "No"],
                selected: [],
                callback: function(choiceIndexArray) {
                    if (choiceIndexArray[0] === 0) {
                        gameState.trash.push(player.play.pop());
                        player.coins += 2;
                    };
                    gameState.phase = "action";
                    io.sockets.emit("gameState", gameState);
                }
            };
        }
    },
    "upgrade": {
        expansion: "Intrigue",
        description: "+1 Card, +1 Action, Trash a card from your hand. Gain a card costing exactly 1 Coin more than it.",
        id: "upgrade",
        name: "Upgrade",
        type: "action",
        cost: 4,
        value: 0,
        victory: 0,
        action: function(player) {
            draw(player, 1);
            player.actions += 1;
            gameState.phase = "select";
            gameState.queryData = {
                eligible: ".your.player .hand .card",
                number: 1,
                unique: true,
                exact: false,
                selected: [],
                callback: function(data) {
                    for (var i in data) {
                        var cardIndex = data[0].index;
                        var cost = cards[player.hand[cardIndex].id].cost;
                        var query = ".buyable .card.COST0";
                        for (var j = 1; j <= cost + 1; j++) {
                            query += ", .buyable .card.COST" + j;
                        }
                        io.sockets.emit("log", cards[player.hand[cardIndex].id].name + " was trashed.");
                        gameState.trash.push(player.hand[cardIndex]);
                        player.hand.splice(cardIndex, 1);
                        gameState.phase = "select";
                        gameState.queryData = {
                            eligible: query,
                            number: 1,
                            unique: true,
                            exact: false,
                            selected: [],
                            callback: function(data) {
                                io.sockets.emit("log", " ... and gets " + data[0].card.name);
                                player.discard.push(data[0].card);
                                gameState.phase = "action";
                                io.sockets.emit("gameState", gameState);
                            }
                        };
                        io.sockets.emit("gameState", gameState);
                    }
                    if (data.length === 0) {
                        gameState.phase = "action";
                        io.sockets.emit("gameState", gameState);
                    }
                }
            };
        }
    },
    "nobles": {
        id: "nobles",
        expansion: "Intrigue",
        description: "+2 Victory, Choose one: +3 Cards, or +2 Actions.",
        name: "Nobles",
        type: "action victory",
        cost: 6,
        value: 0,
        victory: 2,
        action: function(player) {
            gameState.phase = "choose";
            gameState.queryData = {
                number: 1,
                exact: true,
                message: "Choose one.",
                choices: ["+3 Cards", "+2 Actions"],
                selected: [],
                callback: function(choiceIndexArray) {
                    for (var i = 0; i < choiceIndexArray.length; i++) {
                        if (choiceIndexArray[i] === 0) draw(player, 3);
                        if (choiceIndexArray[i] === 1) {
                            player.actions += 2;
                            io.sockets.emit("log", " gains +2 Actions.");
                        }
                        gameState.phase = "action";
                        io.sockets.emit("gameState", gameState);
                    }
                }
            };
        }
    },
    "harem": {
        expansion: "Intrigue",
        id: "harem",
        description: "+2 Coins, +2 Victory.",
        name: "Harem",
        type: "treasure victory",
        cost: 6,
        value: 2,
        victory: 2,
        action: function(player) {
            player.coins += this.value;
            io.sockets.emit("log", " ... and gets 2 coins");
            gameState.phase = "buy";
        }
    },
    "council room": {
        expansion: "Base",
        id: "council room",
        description: "+4 Cards, +1 Buy, Each other player draws a card.",
        name: "Council Room",
        type: "action",
        cost: 5,
        value: 0,
        victory: 0,
        action: function(player) {
            draw(player, 4);
            player.buys += 1;
            for (var pid in gameState.players) {
                var aPlayer = gameState.players[pid];
                if (aPlayer.id != player.id) draw(aPlayer, 1);
                io.sockets.emit("log", " Each other player drew 1 Card.")
            }
        }
    },
    "conspirator": {
            expansion: "Intrigue",
            id: "conspirator",
            description: "+2 Coins. If you've played 3 or more Actions this turn (including this); +1 Card, +1 Action.",
            name: "Conspirator",
            type: "action",
            cost: 4,
            value: 0,
            victory: 0,
            action: function(player) {
                player.coins += 2;
                io.sockets.emit("log", " ... and gets 2 coins");
                var counter = 0;
                for (var i = 0; i < player.play.length; i++) {
                    if (cards[player.play[i].id].type.indexOf("action") >= 0) counter++;
                }
                if (counter >= 3) {
                    draw(player, 1);
                    player.actions += 1;
                    io.sockets.emit("log", " gains +1 Action.");
                }
            }
        },
};