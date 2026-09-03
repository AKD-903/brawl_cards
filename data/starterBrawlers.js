import { BrawlerTemplate, BrawlerClass } from "../src/BrawlerTemplate.js";

/**
 * 15 placeholder starter brawlers. Swap in real names/art/abilities later —
 * everything downstream (Deck, Player, GameEngine) only cares about the
 * shape of a BrawlerTemplate, not these specific values.
 *
 * Class split: 5 tank / 5 support / 5 damage, matching your HP rule
 * (130 / 70 / 100).
 */

const ABILITY_ID_BY_CLASS = {
  [BrawlerClass.TANK]: {
    basic: "basic_attack_tank_class",
    super: "super_tank_class",
  },
  [BrawlerClass.SUPPORT]: {
    basic: "basic_attack_support_class",
    super: "super_support_class",
  },
  [BrawlerClass.DAMAGE]: {
    basic: "basic_attack_damage_class",
    super: "super_damage_class",
  },
};

function makeTemplate(id, name, brawlerClass) {
  const abilities = ABILITY_ID_BY_CLASS[brawlerClass];
  return new BrawlerTemplate({
    id,
    name,
    brawlerClass,
    basicAttackId: abilities.basic,
    superAbilityId: abilities.super,
  });
}

export const starterBrawlers = [
  makeTemplate("brawler_01", "Placeholder Tank 1", BrawlerClass.TANK),
  makeTemplate("brawler_02", "Placeholder Tank 2", BrawlerClass.TANK),
  makeTemplate("brawler_03", "Placeholder Tank 3", BrawlerClass.TANK),
  makeTemplate("brawler_04", "Placeholder Tank 4", BrawlerClass.TANK),
  makeTemplate("brawler_05", "Placeholder Tank 5", BrawlerClass.TANK),

  makeTemplate("brawler_06", "Placeholder Support 1", BrawlerClass.SUPPORT),
  makeTemplate("brawler_07", "Placeholder Support 2", BrawlerClass.SUPPORT),
  makeTemplate("brawler_08", "Placeholder Support 3", BrawlerClass.SUPPORT),
  makeTemplate("brawler_09", "Placeholder Support 4", BrawlerClass.SUPPORT),
  makeTemplate("brawler_10", "Placeholder Support 5", BrawlerClass.SUPPORT),

  makeTemplate("brawler_11", "Placeholder Damage 1", BrawlerClass.DAMAGE),
  makeTemplate("brawler_12", "Placeholder Damage 2", BrawlerClass.DAMAGE),
  makeTemplate("brawler_13", "Placeholder Damage 3", BrawlerClass.DAMAGE),
  makeTemplate("brawler_14", "Placeholder Damage 4", BrawlerClass.DAMAGE),
  makeTemplate("brawler_15", "Placeholder Damage 5", BrawlerClass.DAMAGE),
];

export function getBrawlerById(id) {
  const found = starterBrawlers.find((b) => b.id === id);
  if (!found) throw new Error(`Unknown starter brawler id "${id}"`);
  return found;
}
