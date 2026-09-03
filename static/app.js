let state = null;

let selectedAttacker = null;
let selectedTarget = null;
let selectedReserve = null;


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
// SERVER
// ============================================================

async function getState() {

    const response =
        await fetch("/api/state");

    state =
        await response.json();

    render();

    renderLog();
}


// ============================================================
// ATTACK
// ============================================================

async function attack(useSuper) {

    if (
        selectedAttacker === null ||
        selectedTarget === null
    ) {
        statusDisplay.textContent =
            "Select an attacker and target first.";

        return;
    }

    const response =
        await fetch(
            "/api/attack",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    attackerSlot:
                        selectedAttacker,

                    targetSlot:
                        selectedTarget,

                    useSuper:
                        useSuper
                })
            }
        );

    const data =
        await response.json();

    if (!data.success) {

        statusDisplay.textContent =
            data.error;

        return;
    }

    state =
        data.state;

    clearSelection();

    render();

    renderLog();
}


// ============================================================
// SWAP
// ============================================================

async function swap(
    reserveIndex,
    activeSlot
) {

    const response =
        await fetch(
            "/api/swap",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    reserveIndex:
                        reserveIndex,

                    activeSlot:
                        activeSlot

                })
            }
        );

    const data =
        await response.json();

    if (!data.success) {

        statusDisplay.textContent =
            data.error;

        return;
    }

    state =
        data.state;

    clearSelection();

    render();

    renderLog();
}


// ============================================================
// NEW GAME
// ============================================================

async function newGame() {

    const response =
        await fetch(
            "/api/new-game",
            {
                method: "POST"
            }
        );

    const data =
        await response.json();

    if (!data.success) {

        statusDisplay.textContent =
            data.error;

        return;
    }

    state =
        data.state;

    clearSelection();

    render();

    renderLog();
}


// ============================================================
// SELECTION
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

    if (!state) {
        return;
    }

    renderTurn();

    board.innerHTML = "";

    renderOpponent();

    renderCenter();

    renderPlayer();

    if (state.isOver) {

        const winner =
            state.winnerId === "playerA"
                ? "Alice"
                : "Bob";

        turnDisplay.textContent =
            `${winner.toUpperCase()} WINS!`;

        turnDisplay.className =
            "turn-display game-over";
    }
}


// ============================================================
// TURN
// ============================================================

function renderTurn() {

    if (state.isOver) {
        return;
    }

    if (
        state.activePlayerId === "playerA"
    ) {

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
                    ${state.opponent.name}
                </h2>

                <span class="player-subtitle">
                    Opponent
                </span>

            </div>

            <div class="reserve-counter">

                Reserve:
                ${state.opponent.reserveCount}

            </div>

        </div>

        <h3>Active Brawlers</h3>
    `;

    const row =
        document.createElement("div");

    row.className =
        "card-row";

    state.opponent.active.forEach(
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
                    ${state.you.name}
                </h2>

                <span class="player-subtitle">
                    You
                </span>

            </div>

            <div class="reserve-counter">

                Reserve:
                ${state.you.reserve.length}

            </div>

        </div>

        <h3>Active Brawlers</h3>
    `;

    const activeRow =
        document.createElement("div");

    activeRow.className =
        "card-row";

    state.you.active.forEach(
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


    state.you.reserve.forEach(
        (card, index) => {

            reserveRow.appendChild(
                createReserveCard(
                    card,
                    index
                )
            );

        }
    );

    section.appendChild(
        reserveRow
    );

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

    center.innerHTML = `

        <div class="vs">
            VS
        </div>

        <div class="selection-panel">

            <div class="selection-item">

                ${
                    selectedAttacker !== null
                        ? state.you.active[
                            selectedAttacker
                          ]?.name
                        : "Attacker: None"
                }

            </div>

            <div class="selection-arrow">
                →
            </div>

            <div class="selection-item">

                ${
                    selectedTarget !== null
                        ? getTargetName()
                        : "Target: None"
                }

            </div>

        </div>

        <div class="action-buttons">

            <button
                id="attack-button"
                class="action-button attack">

                Basic Attack

            </button>

            <button
                id="super-button"
                class="action-button super">

                Super

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
        state.activePlayerId !== "playerA" ||
        state.isOver;


    const attacker =
        selectedAttacker !== null
            ? state.you.active[
                selectedAttacker
              ]
            : null;


    superButton.disabled =
        selectedAttacker === null ||
        selectedTarget === null ||
        !attacker?.superUnlocked ||
        state.activePlayerId !== "playerA" ||
        state.isOver;


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
            state.activePlayerId === "playerA"
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
            state.activePlayerId !== "playerA"
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
            state.activePlayerId !== "playerA"
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
                class="class-badge ${card.brawlerClass}">

                ${card.brawlerClass}

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
            state.activePlayerId !== "playerA"
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
            (card.currentHP / card.maxHP) * 100
        );


    return `

        <div class="card-top">

            <span
                class="class-badge ${card.brawlerClass}">

                ${card.brawlerClass}

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
                ${card.maxHP}

            </span>

        </div>
    `;
}


// ============================================================
// LOG
// ============================================================

function renderLog() {

    if (!state || !state.log) {
        return;
    }

    battleLog.innerHTML = "";

    const events =
        [...state.log].reverse();

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

        const name =
            event.firstPlayerId === "playerA"
                ? "Alice"
                : "Bob";

        return `${name} goes first.`;
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
            + `attacked ${event.targetName} `
            + `for 1 damage.`
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
            + `used SUPER on `
            + `${event.targetName} `
            + `for 1 damage.`
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
            + `was defeated.`
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
            + `${event.cardName}.`
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

function getTargetName() {

    const target =
        state.opponent.active[
            selectedTarget
        ];

    if (!target) {
        return "Target: None";
    }

    return target.revealed
        ? target.name
        : "Hidden Brawler";
}


function getInitials(name) {

    const words =
        name
            .replace(
                "Placeholder",
                ""
            )
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

getState();