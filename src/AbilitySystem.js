/**
 * AbilitySystem
 * -------------
 * This is the extension point for real brawler design work. Right now
 * every ability is a placeholder stub keyed by id. When you're ready to
 * design real brawlers, you register a function under a new id and point
 * a BrawlerTemplate's basicAttackId/superAbilityId at it — nothing in
 * GameEngine has to change.
 *
 * An ability function receives a `context` object and returns a `result`
 * describing what happened, which the engine logs and broadcasts.
 *
 * context = {
 *   engine,        // the GameEngine instance (for advanced effects)
 *   source,        // Card performing the action
 *   target,        // Card being targeted (may be undefined for self/AoE effects)
 *   allAllies,     // Card[] - source owner's active cards
 *   allEnemies,    // Card[] - target owner's active cards
 * }
 */

export class AbilitySystem {
  constructor() {
    this.registry = new Map();
    this._registerDefaults();
  }

  register(id, fn) {
    this.registry.set(id, fn);
  }

  resolve(id, context) {
    const fn = this.registry.get(id);
    if (!fn) {
      throw new Error(`No ability registered under id "${id}"`);
    }
    return fn(context);
  }

  _registerDefaults() {
    // --- Placeholder basic attacks, roughly scaled by class ---------------
    this.register("basic_attack_damage_class", ({ source, target }) => {
      const amount = 20;
      target.applyDamage(amount);
      return { type: "damage", amount, targetId: target.instanceId };
    });

    this.register("basic_attack_tank_class", ({ source, target }) => {
      const amount = 15;
      target.applyDamage(amount);
      return { type: "damage", amount, targetId: target.instanceId };
    });

    this.register("basic_attack_support_class", ({ source, target }) => {
      const amount = 10;
      target.applyDamage(amount);
      return { type: "damage", amount, targetId: target.instanceId };
    });

    // --- Placeholder supers -------------------------------------------
    this.register("super_damage_class", ({ source, target }) => {
      const amount = 35;
      target.applyDamage(amount);
      return { type: "damage", amount, targetId: target.instanceId, super: true };
    });

    this.register("super_tank_class", ({ source, target }) => {
      const amount = 25;
      target.applyDamage(amount);
      return { type: "damage", amount, targetId: target.instanceId, super: true };
    });

    // Support supers default to healing the lowest-HP living ally instead
    // of attacking — swap this out per-brawler once you design real kits.
    this.register("super_support_class", ({ source, allAllies }) => {
      const livingAllies = allAllies.filter((c) => c.isAlive);
      if (livingAllies.length === 0) {
        return { type: "noop" };
      }
      const lowestHP = livingAllies.reduce((a, b) =>
        a.currentHP < b.currentHP ? a : b
      );
      const amount = 25;
      lowestHP.applyHealing(amount);
      return {
        type: "heal",
        amount,
        targetId: lowestHP.instanceId,
        super: true,
      };
    });
  }
}
