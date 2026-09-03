# brawl_cards
Passion project, you know the drill. 

`demo.js` simulates a full match between two bots making random legal
moves, printing every attack/swap/defeat, and dumping the final state.
Run it a few times — outcomes vary because of the coin flip and random
targeting.

## How the rules map to code

| Your rule | Where it lives |
|---|---|
| 15 starter brawlers (→50 →100 later) | `data/starterBrawlers.js` — just add more `BrawlerTemplate`s, nothing else changes |
| 5 active + 2 reserve deck | `Deck.js` (`buildDeck`, enforces the 5/2 split) |
| HP by class (130/70/100) | `BrawlerTemplate.js` (`HP_BY_CLASS`) |
| Coin flip decides first turn | `GameEngine.startGame()` |
| Cards face-down until combat | `Card.isRevealed`, flipped by `GameEngine.performAttack` |
| First attack unlocks super | `Card.markActed()` |
| Win/lose condition | `Player.hasLost`, checked in `GameEngine._checkWinCondition()` |

## Architecture

```
BrawlerTemplate   — static definition of a brawler "type" (the printed card)
Card              — one in-game instance of a template (mutable: HP, revealed, etc.)
Deck              — builds/validates a 5-active + 2-reserve lineup
Player            — a player's active slots / reserve / graveyard
AbilitySystem     — registry of pluggable ability functions (basic attacks, supers)
GameEngine        — turn loop, combat resolution, reveal rules, win checking
```

The important design decision: **abilities are data, not code paths.**
`GameEngine` never has an `if (brawler === "Fireball Guy")` anywhere. It
just calls `abilities.resolve(someId, context)`. That means once you're
ready to design real brawlers, you:

1. Write a function for the ability and `abilities.register("fireball", fn)`.
2. Point a `BrawlerTemplate`'s `basicAttackId`/`superAbilityId` at it.

...and the engine, turn loop, and win logic don't change at all. This is
what'll save you from a rewrite when you go from 15 placeholder brawlers
to 100 real ones with unique kits.

## What's stubbed / needs your input next

- **Ability effects** are all placeholders (flat damage, one heal-support
  variant). Send me real stats/kits per brawler and I'll wire them in.
- **Action economy** — right now one action (attack OR swap) = one turn.
  Confirm that's what you want, or if e.g. swapping should be free.
- **Super usage limits** — currently a super is usable any time after
  unlocking, repeatedly. Let me know if it should be once-per-game,
  once-per-turn-cooldown, or consumed on use.
- **Targeting** — attacker picks any living enemy active slot (informed
  only by position, not identity, since it's still face-down). Confirm
  this matches your "you don't know which cards" intent — e.g. should
  players see *class icons* even before reveal, or truly nothing?
- **No UI yet** — this is pure logic. Once rules are locked, I can wire
  up a placeholder-rectangle web UI (React) that talks to this engine.

## File map

```
├brawl-cards/
├── data/
│   └── starter_brawlers.py
│
├── game/
│   ├── ability_system.py
│   ├── brawler_template.py
│   ├── card.py
│   ├── deck.py
│   ├── game_engine.py
│   └── player.py
│
├── app.py
│
├── templates/
│   └── index.html
│
└── static/
    ├── app.js   
    └── styles.css
```
