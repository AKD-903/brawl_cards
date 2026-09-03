/**
 * BrawlerTemplate
 * ----------------
 * A static definition of a brawler "type" — think of this as the printed
 * card, before any copy of it exists in a game. Individual games use
 * `Card` instances (see Card.js) that reference a template by id.
 *
 * HP is derived from class per your rule:
 *   tank -> 130, support -> 70, everything else -> 100
 * You can still override maxHP explicitly per-brawler later if a design
 * needs an exception.
 */

export const BrawlerClass = Object.freeze({
  TANK: "tank",
  SUPPORT: "support",
  DAMAGE: "damage", // catch-all for "anything else"
});

const HP_BY_CLASS = {
  [BrawlerClass.TANK]: 130,
  [BrawlerClass.SUPPORT]: 70,
  [BrawlerClass.DAMAGE]: 100,
};

export class BrawlerTemplate {
  /**
   * @param {Object} opts
   * @param {string} opts.id - unique template id, e.g. "brawler_001"
   * @param {string} opts.name
   * @param {string} opts.brawlerClass - one of BrawlerClass
   * @param {number} [opts.maxHP] - overrides the class default if provided
   * @param {string} opts.basicAttackId - key into the AbilitySystem registry
   * @param {string} opts.superAbilityId - key into the AbilitySystem registry
   * @param {string} [opts.artPlaceholderColor] - just for the placeholder-rectangle era
   */
  constructor({
    id,
    name,
    brawlerClass,
    maxHP,
    basicAttackId,
    superAbilityId,
    artPlaceholderColor = "#888888",
  }) {
    if (!Object.values(BrawlerClass).includes(brawlerClass)) {
      throw new Error(`Unknown brawler class "${brawlerClass}" for ${id}`);
    }
    this.id = id;
    this.name = name;
    this.brawlerClass = brawlerClass;
    this.maxHP = maxHP ?? HP_BY_CLASS[brawlerClass];
    this.basicAttackId = basicAttackId;
    this.superAbilityId = superAbilityId;
    this.artPlaceholderColor = artPlaceholderColor;
  }
}
