import { AbilitySystem } from "./AbilitySystem.js";

/**
 * GameEngine
 * ----------
 * Owns the authoritative game state and rules. Nothing here knows about
 * rendering — feed it player actions, read back state/events, and hook a
 * UI (or CLI, or a bot) up to it however you like.
 *
 * Core rules encoded here (from your description):
 *  - 5 active slots + 2 reserve per player.
 *  - Coin flip decides who goes first.
 *  - Cards are face-down (unrevealed) until they attack or are attacked;
 *    both attacker and target get revealed the moment combat happens.
 *  - A card's super unlocks the first time it successfully attacks; it's
 *    usable (not forced) any time after that, including the same turn
 *    it unlocks — up to you to change if you want a one-turn delay.
 *  - A player loses when they have no living cards in active or reserve.
 *
 * Anything ability-specific is delegated to AbilitySystem so you can
 * redesign brawler kits without touching this file.
 */

export const ActionType = Object.freeze({
  BASIC_ATTACK: "BASIC_ATTACK",
  SUPER_ATTACK: "SUPER_ATTACK",
  SWAP: "SWAP",
});

export class GameEngine {
  /**
   * @param {import("./Player.js").Player} playerA
   * @param {import("./Player.js").Player} playerB
   * @param {AbilitySystem} [abilitySystem]
   */
  constructor(playerA, playerB, abilitySystem = new AbilitySystem()) {
    this.players = { [playerA.id]: playerA, [playerB.id]: playerB };
    this.playerOrder = [playerA.id, playerB.id];
    this.abilities = abilitySystem;

    this.turnNumber = 0;
    this.activePlayerId = null;
    this.winnerId = null;
    this.isOver = false;
    this.log = []; // append-only event log, useful for UI/replay/debugging
  }

  _emit(event) {
    this.log.push({ turn: this.turnNumber, ...event });
  }

  getOpponentId(playerId) {
    return this.playerOrder.find((id) => id !== playerId);
  }

  /** Flip a coin to decide who goes first, then start turn 1. */
  startGame() {
    const first = Math.random() < 0.5 ? this.playerOrder[0] : this.playerOrder[1];
    this.activePlayerId = first;
    this.turnNumber = 1;
    this._emit({ type: "GAME_START", firstPlayerId: first });
    return first;
  }

  _requireActivePlayer(playerId) {
    if (this.isOver) throw new Error("Game is already over.");
    if (playerId !== this.activePlayerId) {
      throw new Error(`It's not ${playerId}'s turn.`);
    }
  }

  /**
   * @param {string} playerId
   * @param {number} attackerSlotIndex - index into the attacker's activeSlots
   * @param {number} targetSlotIndex - index into the opponent's activeSlots
   * @param {boolean} [useSuper=false]
   */
  performAttack(playerId, attackerSlotIndex, targetSlotIndex, useSuper = false) {
    this._requireActivePlayer(playerId);

    const attackerPlayer = this.players[playerId];
    const defenderId = this.getOpponentId(playerId);
    const defenderPlayer = this.players[defenderId];

    const attacker = attackerPlayer.activeSlots[attackerSlotIndex];
    const target = defenderPlayer.activeSlots[targetSlotIndex];

    if (!attacker || !attacker.isAlive) {
      throw new Error("No living attacker in that slot.");
    }
    if (!target || !target.isAlive) {
      throw new Error("No living target in that slot.");
    }
    if (useSuper && !attacker.superUnlocked) {
      throw new Error("That card's super isn't unlocked yet.");
    }

    // Reveal rule: both cards involved in combat are revealed, win or lose.
    attacker.reveal();
    target.reveal();

    const abilityId = useSuper ? attacker.template.superAbilityId : attacker.template.basicAttackId;
    const result = this.abilities.resolve(abilityId, {
      engine: this,
      source: attacker,
      target,
      allAllies: attackerPlayer.activeSlots.filter(Boolean),
      allEnemies: defenderPlayer.activeSlots.filter(Boolean),
    });

    attacker.markActed();

    this._emit({
      type: useSuper ? "SUPER_ATTACK" : "BASIC_ATTACK",
      playerId,
      attackerId: attacker.instanceId,
      targetId: target?.instanceId,
      result,
    });

    // Sweep for defeats caused by this action (covers heals-only abilities
    // doing nothing here, and damage abilities knocking out a card).
    this._checkForDefeats(attackerPlayer);
    this._checkForDefeats(defenderPlayer);

    this._checkWinCondition();
    if (!this.isOver) this._advanceTurn();

    return result;
  }

  /**
   * Bring a reserve card into an empty active slot. Costs the turn, same
   * as an attack — change `_advanceTurn` call below if you'd rather let
   * swaps be free/instant.
   */
  performSwap(playerId, reserveIndex, activeSlotIndex) {
    this._requireActivePlayer(playerId);
    const player = this.players[playerId];
    const card = player.swapIntoActive(reserveIndex, activeSlotIndex);

    this._emit({
      type: "SWAP",
      playerId,
      cardId: card.instanceId,
      activeSlotIndex,
    });

    this._advanceTurn();
  }

  _checkForDefeats(player) {
    for (const card of [...player.activeSlots, ...player.reserve]) {
      if (card && card.isDefeated && card.zone !== "graveyard") {
        player.handleDefeat(card);
        this._emit({ type: "DEFEATED", playerId: player.id, cardId: card.instanceId });
      }
    }
  }

  _checkWinCondition() {
    for (const id of this.playerOrder) {
      if (this.players[id].hasLost) {
        this.isOver = true;
        this.winnerId = this.getOpponentId(id);
        this._emit({ type: "GAME_OVER", winnerId: this.winnerId, loserId: id });
        return;
      }
    }
  }

  _advanceTurn() {
    this.activePlayerId = this.getOpponentId(this.activePlayerId);
    this.turnNumber += 1;
  }

  /**
   * Returns game state from one player's point of view: their own cards
   * fully visible, the opponent's unrevealed cards masked as face-down.
   */
  getStateFor(playerId) {
    const opponentId = this.getOpponentId(playerId);
    const me = this.players[playerId];
    const opp = this.players[opponentId];

    return {
      turnNumber: this.turnNumber,
      activePlayerId: this.activePlayerId,
      isOver: this.isOver,
      winnerId: this.winnerId,
      you: {
        id: me.id,
        name: me.name,
        active: me.activeSlots.map((c) => (c ? c.toOwnerView() : null)),
        reserve: me.reserve.map((c) => c.toOwnerView()),
      },
      opponent: {
        id: opp.id,
        name: opp.name,
        active: opp.activeSlots.map((c) => (c ? c.toPublicView() : null)),
        reserveCount: opp.reserve.length,
      },
    };
  }
}
