/**
 * Card
 * ----
 * A single in-game instance of a BrawlerTemplate. This is what actually
 * lives in a deck/hand/active slot and carries mutable state: current HP,
 * whether it's been revealed, whether its super is unlocked/used, etc.
 */

let instanceCounter = 0;

export class Card {
  /**
   * @param {import("./BrawlerTemplate.js").BrawlerTemplate} template
   * @param {string} ownerId
   */
  constructor(template, ownerId) {
    this.instanceId = `card_${++instanceCounter}`;
    this.template = template;
    this.ownerId = ownerId;

    this.currentHP = template.maxHP;
    this.isRevealed = false;
    this.hasActedOnce = false; // first attack unlocks the super
    this.superUnlocked = false;
    this.isDefeated = false;

    // "reserve" | "active" | "graveyard" — tracked by Deck/Player, mirrored
    // here for convenience when inspecting a single card.
    this.zone = "reserve";
  }

  get isAlive() {
    return !this.isDefeated;
  }

  reveal() {
    this.isRevealed = true;
  }

  /** Call once, right after this card lands its first attack. */
  markActed() {
    if (!this.hasActedOnce) {
      this.hasActedOnce = true;
      this.superUnlocked = true;
    }
  }

  applyDamage(amount) {
    this.currentHP = Math.max(0, this.currentHP - amount);
    if (this.currentHP === 0) {
      this.isDefeated = true;
    }
    return this.currentHP;
  }

  applyHealing(amount) {
    this.currentHP = Math.min(this.template.maxHP, this.currentHP + amount);
    return this.currentHP;
  }

  /**
   * Returns a version of this card's data safe to show to an opponent.
   * Unrevealed cards show only the face-down back; revealed cards show
   * full info.
   */
  toPublicView() {
    if (!this.isRevealed) {
      return {
        instanceId: this.instanceId,
        ownerId: this.ownerId,
        revealed: false,
        zone: this.zone,
        alive: this.isAlive,
        // no name/class/HP leaked — this is the face-down "star design" back
      };
    }
    return {
      instanceId: this.instanceId,
      ownerId: this.ownerId,
      revealed: true,
      zone: this.zone,
      alive: this.isAlive,
      name: this.template.name,
      brawlerClass: this.template.brawlerClass,
      currentHP: this.currentHP,
      maxHP: this.template.maxHP,
      superUnlocked: this.superUnlocked,
    };
  }

  /** Full data, for the owning player's own view or server-side logic. */
  toOwnerView() {
    return {
      ...this.toPublicView(),
      revealed: this.isRevealed, // keep actual reveal flag
      name: this.template.name,
      brawlerClass: this.template.brawlerClass,
      currentHP: this.currentHP,
      maxHP: this.template.maxHP,
      superUnlocked: this.superUnlocked,
      hasActedOnce: this.hasActedOnce,
    };
  }
}
