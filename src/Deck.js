import { Card } from "./Card.js";

export const DECK_ACTIVE_SIZE = 5;
export const DECK_RESERVE_SIZE = 2;

/**
 * Builds and validates a player's deck: 5 chosen for the active lineup,
 * 2 for reserves, drawn from their unlocked brawler pool (15 to start,
 * growing to 65, then 115 in later updates — the pool size itself lives
 * outside this class, this just enforces deck-building rules).
 *
 * @param {import("./BrawlerTemplate.js").BrawlerTemplate[]} activeTemplates
 * @param {import("./BrawlerTemplate.js").BrawlerTemplate[]} reserveTemplates
 * @param {string} ownerId
 * @returns {{ active: Card[], reserve: Card[] }}
 */
export function buildDeck(activeTemplates, reserveTemplates, ownerId) {
  if (activeTemplates.length !== DECK_ACTIVE_SIZE) {
    throw new Error(
      `Active lineup must have exactly ${DECK_ACTIVE_SIZE} brawlers (got ${activeTemplates.length})`
    );
  }
  if (reserveTemplates.length !== DECK_RESERVE_SIZE) {
    throw new Error(
      `Reserves must have exactly ${DECK_RESERVE_SIZE} brawlers (got ${reserveTemplates.length})`
    );
  }

  const allIds = [...activeTemplates, ...reserveTemplates].map((t) => t.id);
  const uniqueIds = new Set(allIds);
  if (uniqueIds.size !== allIds.length) {
    throw new Error("Deck contains duplicate brawlers — no duplicates allowed (adjust here if that changes).");
  }

  const active = activeTemplates.map((t) => {
    const card = new Card(t, ownerId);
    card.zone = "active";
    return card;
  });
  const reserve = reserveTemplates.map((t) => {
    const card = new Card(t, ownerId);
    card.zone = "reserve";
    return card;
  });

  return { active, reserve };
}
