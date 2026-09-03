import { starterBrawlers } from "./data/starterBrawlers.js";
import { buildDeck } from "./src/Deck.js";
import { Player } from "./src/Player.js";
import { GameEngine } from "./src/GameEngine.js";

// --- Build two decks from the starter pool (5 active + 2 reserve each) ---
const pool = starterBrawlers;
const deckA = buildDeck(pool.slice(0, 5), pool.slice(5, 7), "playerA");
const deckB = buildDeck(pool.slice(7, 12), pool.slice(12, 14), "playerB");

const playerA = new Player("playerA", "Alice", deckA);
const playerB = new Player("playerB", "Bob", deckB);

const engine = new GameEngine(playerA, playerB);
const firstPlayer = engine.startGame();
console.log(`Coin flip: ${firstPlayer} goes first.\n`);

// --- Very dumb bot: attacks a random living slot with a random living attacker ---
function randomLegalAttack(playerId) {
  const me = engine.players[playerId];
  const oppId = engine.getOpponentId(playerId);
  const opp = engine.players[oppId];

  const attackerIdx = me.activeSlots.findIndex((c) => c && c.isAlive);
  const targetIdx = opp.activeSlots.findIndex((c) => c && c.isAlive);

  if (attackerIdx === -1) return null; // player has no active attacker -> must swap
  if (targetIdx === -1) return null; // shouldn't happen if win-check runs correctly

  const attacker = me.activeSlots[attackerIdx];
  const useSuper = attacker.superUnlocked && Math.random() < 0.5;
  return { attackerIdx, targetIdx, useSuper };
}

function trySwap(playerId) {
  const me = engine.players[playerId];
  if (!me.hasEmptyActiveSlot()) return false;
  const reserveIdx = me.reserve.findIndex((c) => c.isAlive);
  if (reserveIdx === -1) return false;
  const activeSlotIdx = me.activeSlots.findIndex((c) => c === null);
  engine.performSwap(playerId, reserveIdx, activeSlotIdx);
  return true;
}

let safetyCounter = 0;
while (!engine.isOver && safetyCounter < 200) {
  safetyCounter += 1;
  const currentId = engine.activePlayerId;
  const move = randomLegalAttack(currentId);

  if (move) {
    const before = engine.log.length;
    engine.performAttack(currentId, move.attackerIdx, move.targetIdx, move.useSuper);
    const events = engine.log.slice(before);
    for (const e of events) {
      if (e.type === "BASIC_ATTACK" || e.type === "SUPER_ATTACK") {
        console.log(
          `Turn ${e.turn}: ${e.playerId} ${e.type === "SUPER_ATTACK" ? "SUPER" : "attacks"} -> ${JSON.stringify(e.result)}`
        );
      }
      if (e.type === "DEFEATED") {
        console.log(`Turn ${e.turn}: ${e.cardId} (${e.playerId}) was defeated!`);
      }
      if (e.type === "GAME_OVER") {
        console.log(`\nGame over! Winner: ${e.winnerId}`);
      }
    }
  } else {
    const swapped = trySwap(currentId);
    if (!swapped) {
      console.log(`${currentId} has no legal move (no active attacker, no reserve to swap in).`);
      break;
    }
    console.log(`Turn ${engine.turnNumber - 1}: ${currentId} swaps in a reserve card.`);
  }
}

console.log("\n--- Final state (from Alice's point of view) ---");
console.log(JSON.stringify(engine.getStateFor("playerA"), null, 2));
