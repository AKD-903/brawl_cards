// ============================================================
// BRAWL CARDS — GITHUB PAGES VERSION
// ============================================================

let game = null;

let selectedAttacker = null;
let selectedTarget = null;
let selectedReserve = null;


// ============================================================
// BRAWLER DATA
// ============================================================

const BRAWLERS = [
    {
        id: 1,
        name: "Shelly",
        class: "Damage Dealer",
        maxHp: 130,
        basicAttackName: "Buckshot",
        basicDamage: 50,
        superName: "Super Shell",
        superDamage: 100
    },

    { id: 2, name: "Colt", class: "Damage Dealer", maxHp: 130 },
    { id: 3, name: "Spike", class: "Damage Dealer", maxHp: 130 },
    { id: 4, name: "Nita", class: "Damage Dealer", maxHp: 130 },
    { id: 5, name: "Rico", class: "Damage Dealer", maxHp: 130 },

    { id: 6, name: "Poco", class: "Support", maxHp: 100 },

    { id: 7, name: "Crow", class: "Assassin", maxHp: 110 },
    { id: 8, name: "Mortis", class: "Assassin", maxHp: 110 },

    { id: 9, name: "Jessie", class: "Controller", maxHp: 120 },
    { id: 10, name: "Bo", class: "Controller", maxHp: 120 },

    { id: 11, name: "Brock", class: "Marksman", maxHp: 110 },

    { id: 12, name: "Bull", class: "Tank", maxHp: 150 },
    { id: 13, name: "El Primo", class: "Tank", maxHp: 150 },

    { id: 14, name: "Barley", class: "Artillery", maxHp: 90 },
    { id: 15, name: "Dynamike", class: "Artillery", maxHp: 90 }
];


// ============================================================
// DOM
// ============================================================

const board =
    document.getElementById("game-board");

const turnDisplay =
    document.getElementById("turn-display");

const statusDisplay =
    document.getElementById("status-display");

const battleLog =
    document.getElementById("battle-log");

const newGameButton =
    document.getElementById("new-game-button");


// ============================================================
// CREATE CARD
// ============================================================

function createCard(brawler, owner) {
    return {
        id: brawler.id,
        name: brawler.name,
        class: brawler.class,

        maxHp: brawler.maxHp,
        currentHP: brawler.maxHp,

        basicAttackName: brawler.basicAttackName || "Basic Attack",
        basicDamage: brawler.basicDamage || 1,

        superName: brawler.superName || "Super",
        superDamage: brawler.superDamage || 1,

        owner: owner,
        revealed: false,
        hasActedOnce: false,
        superUnlocked: false,
        defeated: false
    };
}


// ============================================================
// NEW GAME
// ============================================================

function newGame() {

    const playerCards =
        BRAWLERS.slice(0, 7);

    const botCards =
        BRAWLERS.slice(7, 14);


    game = {

        turnNumber: 1,

        activePlayer: "playerA",

        isOver: false,

        winner: null,

        player: {

            name: "Alice",

            active: playerCards
                .slice(0, 5)
                .map(b => createCard(b, "playerA")),

            reserve: playerCards
                .slice(5, 7)
                .map(b => createCard(b, "playerA")),

            graveyard: []
        },

        opponent: {

            name: "Bob",

            active: botCards
                .slice(0, 5)
                .map(b => createCard(b, "playerB")),

            reserve: botCards
                .slice(5, 7)
                .map(b => createCard(b, "playerB")),

            graveyard: []
        },

        log: [
            {
                type: "GAME_START",
                firstPlayerId: "playerA"
            }
        ]
    };


    clearSelection();

    render();

    renderLog();
}


// ============================================================
// ATTACK
// ============================================================

function attack(useSuper = false) {

    if (game.isOver) {
        return;
    }


    if (game.activePlayer !== "playerA") {
        return;
    }


    if (
        selectedAttacker === null ||
        selectedTarget === null
    ) {

        statusDisplay.textContent =
            "Select an attacker and target first.";

        return;
    }


    const attacker =
        game.player.active[selectedAttacker];

    const target =
        game.opponent.active[selectedTarget];


    if (!attacker || attacker.defeated) {
        return;
    }


    if (!target || target.defeated) {
        return;
    }


    if (
        useSuper &&
        !attacker.superUnlocked
    ) {

        statusDisplay.textContent =
            "That brawler's Super isn't unlocked.";

        return;
    }


    // Combat reveals both cards.

    attacker.revealed = true;
    target.revealed = true;


    // Basic attacks and Supers currently
    // both deal 1 damage.

    const damage = useSuper
    ? attacker.superDamage
    : attacker.basicDamage;

    target.currentHP =
        Math.max(
            0,
            target.currentHP - damage
        );


    // First attack unlocks Super.

    if (!attacker.hasActedOnce) {

        attacker.hasActedOnce = true;

        attacker.superUnlocked = true;
    }


    game.log.push({

        type:
            useSuper
                ? "SUPER_ATTACK"
                : "BASIC_ATTACK",

        playerId: "playerA",

        attackerName:
            attacker.name,

        targetName:
            target.name,

        damage: damage
    });


    if (target.currentHP === 0) {

        target.defeated = true;

        game.opponent.graveyard.push(target);

        game.log.push({

            type: "DEFEATED",

            playerId: "playerB",

            cardName: target.name
        });
    }


    checkWin();


    if (game.isOver) {

        clearSelection();

        render();

        renderLog();

        return;
    }


    // Bob's turn.

    clearSelection();

    game.activePlayer = "playerB";

    game.turnNumber++;

    render();


    setTimeout(() => {

        botTurn();

    }, 500);
}


// ============================================================
// BOT
// ============================================================

function botTurn() {

    if (game.isOver) {
        return;
    }


    if (game.activePlayer !== "playerB") {
        return;
    }


    // Find a living attacker.

    let attackerIndex = -1;


    for (
        let i = 0;
        i < game.opponent.active.length;
        i++
    ) {

        const card =
            game.opponent.active[i];

        if (
            card &&
            !card.defeated
        ) {

            attackerIndex = i;

            break;
        }
    }


    // If all active brawlers are gone,
    // field a reserve.

    if (attackerIndex === -1) {

        botSwap();

        return;
    }


    // Find a living player target.

    let targetIndex = -1;


    for (
        let i = 0;
        i < game.player.active.length;
        i++
    ) {

        const card =
            game.player.active[i];

        if (
            card &&
            !card.defeated
        ) {

            targetIndex = i;

            break;
        }
    }


    if (targetIndex === -1) {

        checkWin();

        return;
    }


    const attacker =
        game.opponent.active[
            attackerIndex
        ];

    const target =
        game.player.active[
            targetIndex
        ];


    attacker.revealed = true;
    target.revealed = true;


    const useSuper =
        attacker.superUnlocked &&
        Math.random() < 0.30;


    const damage = useSuper
    ? attacker.superDamage
    : attacker.basicDamage;


    target.currentHP =
        Math.max(
            0,
            target.currentHP - damage
        );


    if (!attacker.hasActedOnce) {

        attacker.hasActedOnce = true;

        attacker.superUnlocked = true;
    }


    game.log.push({

        type:
            useSuper
                ? "SUPER_ATTACK"
                : "BASIC_ATTACK",

        playerId: "playerB",

        attackerName:
            attacker.name,

        targetName:
            target.name,

        damage: damage
    });


    if (target.currentHP === 0) {

        target.defeated = true;

        game.player.graveyard.push(target);

        game.log.push({

            type: "DEFEATED",

            playerId: "playerA",

            cardName: target.name
        });
    }


    checkWin();


    if (game.isOver) {

        render();

        renderLog();

        return;
    }


    game.activePlayer = "playerA";

    game.turnNumber++;


    render();

    renderLog();
}


// ============================================================
// BOT SWAP
// ============================================================

function botSwap() {

    let reserveIndex = -1;

    for (
        let i = 0;
        i < game.opponent.reserve.length;
        i++
    ) {

        if (
            !game.opponent.reserve[i].defeated
        ) {

            reserveIndex = i;

            break;
        }
    }


    if (reserveIndex === -1) {

        checkWin();

        return;
    }


    let emptySlot = -1;


    for (
        let i = 0;
        i < game.opponent.active.length;
        i++
    ) {

        if (
            !game.opponent.active[i]
        ) {

            emptySlot = i;

            break;
        }
    }


    if (emptySlot === -1) {
        return;
    }


    const card =
        game.opponent.reserve.splice(
            reserveIndex,
            1
        )[0];


    card.revealed = false;


    game.opponent.active[
        emptySlot
    ] = card;


    game.log.push({

        type: "SWAP",

        playerId: "playerB",

        cardName: card.name
    });


    game.activePlayer = "playerA";

    game.turnNumber++;


    render();

    renderLog();
}


// ============================================================
// PLAYER SWAP
// ============================================================

function swap(
    reserveIndex,
    activeSlot
) {

    if (game.isOver) {
        return;
    }


    if (game.activePlayer !== "playerA") {
        return;
    }


    const card =
        game.player.reserve[
            reserveIndex
        ];


    if (!card || card.defeated) {
        return;
    }


    if (
        game.player.active[activeSlot]
    ) {

        statusDisplay.textContent =
            "That active slot isn't empty.";

        return;
    }


    game.player.reserve.splice(
        reserveIndex,
        1
    );


    card.revealed = true;


    game.player.active[
        activeSlot
    ] = card;


    game.log.push({

        type: "SWAP",

        playerId: "playerA",

        cardName: card.name
    });


    clearSelection();


    game.activePlayer = "playerB";

    game.turnNumber++;


    render();

    renderLog();


    setTimeout(() => {

        botTurn();

    }, 500);
}


// ============================================================
// WIN CONDITION
// ============================================================

function checkWin() {

    const playerHasCards =
        game.player.active.some(
            card =>
                card &&
                !card.defeated
        )
        ||
        game.player.reserve.some(
            card =>
                card &&
                !card.defeated
        );


    const botHasCards =
        game.opponent.active.some(
            card =>
                card &&
                !card.defeated
        )
        ||
        game.opponent.reserve.some(
            card =>
                card &&
                !card.defeated
        );


    if (!playerHasCards) {

        game.isOver = true;

        game.winner = "playerB";

        game.log.push({

            type: "GAME_OVER",

            winnerId: "playerB"
        });

        return;
    }


    if (!botHasCards) {

        game.isOver = true;

        game.winner = "playerA";

        game.log.push({

            type: "GAME_OVER",

            winnerId: "playerA"
        });
    }
}


// ============================================================
// CLEAR SELECTION
// ============================================================

function clearSelection() {

    selectedAttacker = null;

    selectedTarget = null;

    selectedReserve = null;
}


// ============================================================
// RENDER
// ============================================================

function render() {

    if (!game) {
        return;
    }


    renderTurn();


    board.innerHTML = "";


    renderOpponent();

    renderCenter();

    renderPlayer();
}


// ============================================================
// TURN DISPLAY
// ============================================================

function renderTurn() {

    if (game.isOver) {

        if (game.winner === "playerA") {

            turnDisplay.textContent =
                "YOU WIN!";

            turnDisplay.className =
                "turn-display game-over";

        } else {

            turnDisplay.textContent =
                "BOB WINS!";

            turnDisplay.className =
                "turn-display game-over";
        }

        return;
    }


    if (game.activePlayer === "playerA") {

        turnDisplay.textContent =
            "YOUR TURN";

        turnDisplay.className =
            "turn-display your-turn";

        statusDisplay.textContent =
            "Choose a brawler to attack.";

    } else {

        turnDisplay.textContent =
            "BOB'S TURN";

        turnDisplay.className =
            "turn-display opponent-turn";

        statusDisplay.textContent =
            "Bob is thinking...";
    }
}


// ============================================================
// OPPONENT
// ============================================================

function renderOpponent() {

    const section =
        document.createElement("section");

    section.className =
        "player-section opponent-section";


    section.innerHTML = `

        <div class="player-header">

            <div>

                <h2>
                    Bob
                </h2>

                <span class="player-subtitle">
                    Opponent
                </span>

            </div>

            <div class="reserve-counter">

                Reserve:
                ${game.opponent.reserve.length}

            </div>

        </div>

        <h3>Active Brawlers</h3>
    `;


    const row =
        document.createElement("div");

    row.className =
        "card-row";


    game.opponent.active.forEach(
        (card, index) => {

            row.appendChild(
                createOpponentCard(
                    card,
                    index
                )
            );
        }
    );


    section.appendChild(row);

    board.appendChild(section);
}


// ============================================================
// PLAYER
// ============================================================

function renderPlayer() {

    const section =
        document.createElement("section");

    section.className =
        "player-section player-section-bottom";


    section.innerHTML = `

        <div class="player-header">

            <div>

                <h2>
                    Alice
                </h2>

                <span class="player-subtitle">
                    You
                </span>

            </div>

            <div class="reserve-counter">

                Reserve:
                ${game.player.reserve.length}

            </div>

        </div>

        <h3>Active Brawlers</h3>
    `;


    const activeRow =
        document.createElement("div");

    activeRow.className =
        "card-row";


    game.player.active.forEach(
        (card, index) => {

            activeRow.appendChild(
                createPlayerCard(
                    card,
                    index
                )
            );
        }
    );


    section.appendChild(activeRow);


    const reserveTitle =
        document.createElement("h3");

    reserveTitle.textContent =
        "Reserve";

    section.appendChild(
        reserveTitle
    );


    const reserveRow =
        document.createElement("div");

    reserveRow.className =
        "card-row reserve-row";


    game.player.reserve.forEach(
        (card, index) => {

            reserveRow.appendChild(
                createReserveCard(
                    card,
                    index
                )
            );
        }
    );


    section.appendChild(reserveRow);


    board.appendChild(section);
}


// ============================================================
// CENTER
// ============================================================

function renderCenter() {

    const center =
        document.createElement("div");

    center.className =
        "battle-center";


    const attackerName =
        selectedAttacker !== null
            ? game.player.active[
                selectedAttacker
              ]?.name
            : "Attacker: None";


    let targetName =
        "Target: None";


    if (selectedTarget !== null) {

        const target =
            game.opponent.active[
                selectedTarget
            ];


        if (target) {

            targetName =
                target.revealed
                    ? target.name
                    : "Hidden Brawler";
        }
    }


    // Get the currently selected attacker.

    const attacker =
        selectedAttacker !== null
            ? game.player.active[
                selectedAttacker
              ]
            : null;


    center.innerHTML = `

        <div class="vs">
            VS
        </div>

        <div class="selection-panel">

            <div class="selection-item">
                ${attackerName}
            </div>

            <div class="selection-arrow">
                →
            </div>

            <div class="selection-item">
                ${targetName}
            </div>

        </div>

        <div class="action-buttons">

            <button
                id="attack-button"
                class="action-button attack">

                ${attacker
                    ? attacker.basicAttackName
                    : "Basic Attack"}

            </button>

            <button
                id="super-button"
                class="action-button super">

                ${attacker
                    ? attacker.superName
                    : "Super"}

            </button>

            <button
                id="clear-button"
                class="action-button cancel">

                Clear

            </button>

        </div>
    `;


    board.appendChild(center);


    const attackButton =
        document.getElementById(
            "attack-button"
        );


    const superButton =
        document.getElementById(
            "super-button"
        );


    const clearButton =
        document.getElementById(
            "clear-button"
        );


    attackButton.disabled =
        selectedAttacker === null ||
        selectedTarget === null ||
        game.activePlayer !== "playerA" ||
        game.isOver;


    superButton.disabled =
        selectedAttacker === null ||
        selectedTarget === null ||
        !attacker?.superUnlocked ||
        game.activePlayer !== "playerA" ||
        game.isOver;


    attackButton.onclick =
        () => attack(false);


    superButton.onclick =
        () => attack(true);


    clearButton.onclick =
        () => {

            clearSelection();

            render();
        };
}

// ============================================================
// PLAYER CARD
// ============================================================

function createPlayerCard(
    card,
    index
) {

    const element =
        document.createElement("div");


    if (!card) {

        element.className =
            "card empty-slot";


        element.innerHTML = `

            <div class="empty-icon">
                +
            </div>

            <div>
                Empty Slot
            </div>
        `;


        if (
            selectedReserve !== null &&
            game.activePlayer === "playerA"
        ) {

            element.classList.add(
                "swap-target"
            );


            element.onclick =
                () => swap(
                    selectedReserve,
                    index
                );
        }


        return element;
    }


    element.className =
        "card player-card";


    if (
        selectedAttacker === index
    ) {

        element.classList.add(
            "selected-attacker"
        );
    }


    element.innerHTML =
        cardHTML(card);


    element.onclick = () => {

        if (
            game.activePlayer !== "playerA" ||
            game.isOver
        ) {

            return;
        }


        if (
            selectedReserve !== null
        ) {

            clearSelection();
        }


        selectedAttacker =
            index;


        selectedTarget =
            null;


        statusDisplay.textContent =
            `${card.name} selected. Select an opponent.`;


        render();
    };


    return element;
}


// ============================================================
// OPPONENT CARD
// ============================================================

function createOpponentCard(
    card,
    index
) {

    const element =
        document.createElement("div");


    if (!card) {

        element.className =
            "card empty-slot";


        element.innerHTML = `

            <div class="empty-icon">
                ×
            </div>

            <div>
                Defeated
            </div>
        `;


        return element;
    }


    element.className =
        "card opponent-card";


    if (
        selectedTarget === index
    ) {

        element.classList.add(
            "selected-target"
        );
    }


    if (!card.revealed) {

        element.classList.add(
            "face-down"
        );


        element.innerHTML = `

            <div class="card-back">

                <div class="star">
                    ★
                </div>

                <div>
                    HIDDEN
                </div>

            </div>
        `;

    } else {

        element.innerHTML =
            cardHTML(card);
    }


    element.onclick = () => {

        if (
            game.activePlayer !== "playerA" ||
            game.isOver
        ) {

            return;
        }


        if (
            selectedAttacker === null
        ) {

            statusDisplay.textContent =
                "Select one of your brawlers first.";

            return;
        }


        selectedTarget =
            index;


        render();
    };


    return element;
}


// ============================================================
// RESERVE CARD
// ============================================================

function createReserveCard(
    card,
    index
) {

    const element =
        document.createElement("div");


    element.className =
        "card reserve-card";


    if (
        selectedReserve === index
    ) {

        element.classList.add(
            "selected-reserve"
        );
    }


    element.innerHTML = `

        <div class="card-top">

            <span
                class="class-badge ${card.class}">

                ${card.class}

            </span>

        </div>

        <div class="card-art">
            ${getInitials(card.name)}
        </div>

        <div class="card-name">
            ${card.name}
        </div>

        <div class="reserve-hint">
            Click to select
        </div>
    `;


    element.onclick = () => {

        if (
            game.activePlayer !== "playerA" ||
            game.isOver
        ) {

            return;
        }


        clearSelection();


        selectedReserve =
            index;


        statusDisplay.textContent =
            "Now click an empty active slot.";


        render();
    };


    return element;
}


// ============================================================
// CARD HTML
// ============================================================

function cardHTML(card) {

    const hpPercent =
        Math.max(
            0,
            (card.currentHP / card.maxHp) * 100
        );


    return `

        <div class="card-top">

            <span
                class="class-badge ${card.class}">

                ${card.class}

            </span>

            ${
                card.superUnlocked
                    ? `
                        <span class="super-ready">
                            SUPER
                        </span>
                    `
                    : ""
            }

        </div>


        <div class="card-art">
            ${getInitials(card.name)}
        </div>


        <div class="card-name">
            ${card.name}
        </div>


        <div class="hp-container">

            <div class="hp-bar">

                <div
                    class="hp-fill"
                    style="width:${hpPercent}%">
                </div>

            </div>

            <span class="hp-text">

                ${card.currentHP}
                /
                ${card.maxHp}

            </span>

        </div>
    `;
}


// ============================================================
// LOG
// ============================================================

function renderLog() {

    if (!game) {
        return;
    }


    battleLog.innerHTML = "";


    const events =
        [...game.log].reverse();


    events.forEach(event => {

        const entry =
            document.createElement("div");


        entry.className =
            "log-entry";


        entry.textContent =
            formatEvent(event);


        battleLog.appendChild(entry);
    });
}


function formatEvent(event) {

    if (
        event.type === "GAME_START"
    ) {

        return "Alice goes first.";
    }


    if (
        event.type === "BASIC_ATTACK"
    ) {

        const player =
            event.playerId === "playerA"
                ? "Alice"
                : "Bob";


        return (
            `${player}'s ${event.attackerName} `
            +
            `attacked ${event.targetName} `
            +
            `for ${event.damage} damage.`
        );
    }


    if (
        event.type === "SUPER_ATTACK"
    ) {

        const player =
            event.playerId === "playerA"
                ? "Alice"
                : "Bob";


        return (
            `${player}'s ${event.attackerName} `
            +
            `used SUPER on ${event.targetName} `
            +
            `for ${event.damage} damage.`
        );
    }


    if (
        event.type === "DEFEATED"
    ) {

        const player =
            event.playerId === "playerA"
                ? "Alice"
                : "Bob";


        return (
            `${player}'s ${event.cardName} `
            +
            `was defeated.`
        );
    }


    if (
        event.type === "SWAP"
    ) {

        const player =
            event.playerId === "playerA"
                ? "Alice"
                : "Bob";


        return (
            `${player} fielded `
            +
            `${event.cardName}.`
        );
    }


    if (
        event.type === "GAME_OVER"
    ) {

        const winner =
            event.winnerId === "playerA"
                ? "Alice"
                : "Bob";


        return `${winner} wins the game!`;
    }


    return event.type;
}


// ============================================================
// HELPERS
// ============================================================

function getInitials(name) {

    const words =
        name
            .trim()
            .split(" ");


    if (words.length === 1) {

        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }


    return words
        .slice(0, 2)
        .map(
            word => word[0]
        )
        .join("")
        .toUpperCase();
}


// ============================================================
// START
// ============================================================

newGameButton.onclick =
    newGame;


newGame();