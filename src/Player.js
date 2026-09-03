export class Player {
  /**
   * @param {string} id
   * @param {string} name
   * @param {{active: import("./Card.js").Card[], reserve: import("./Card.js").Card[]}} deck
   */
  constructor(id, name, deck) {
    this.id = id;
    this.name = name;

    // Active slots are a fixed-size array; a defeated card leaves an
    // `null` hole until the player swaps a reserve into it.
    this.activeSlots = [...deck.active];
    this.reserve = [...deck.reserve];
    this.graveyard = [];
  }

  get allCards() {
    return [...this.activeSlots.filter(Boolean), ...this.reserve, ...this.graveyard];
  }

  get livingActiveCards() {
    return this.activeSlots.filter((c) => c && c.isAlive);
  }

  get livingReserveCards() {
    return this.reserve.filter((c) => c.isAlive);
  }

  /** True once every card the player owns (active + reserve) is defeated. */
  get hasLost() {
    const activeAlive = this.activeSlots.some((c) => c && c.isAlive);
    const reserveAlive = this.reserve.some((c) => c.isAlive);
    return !activeAlive && !reserveAlive;
  }

  /** Move a card from reserve into an empty active slot. */
  swapIntoActive(reserveIndex, activeSlotIndex) {
    const reserveCard = this.reserve[reserveIndex];
    if (!reserveCard) throw new Error("No card at that reserve index.");
    if (!reserveCard.isAlive) throw new Error("Can't field a defeated card.");
    if (this.activeSlots[activeSlotIndex]) {
      throw new Error("That active slot isn't empty.");
    }

    this.reserve.splice(reserveIndex, 1);
    reserveCard.zone = "active";
    this.activeSlots[activeSlotIndex] = reserveCard;
    return reserveCard;
  }

  /** Called after a card's HP hits 0: clears its slot, moves it to the graveyard. */
  handleDefeat(card) {
    const activeIdx = this.activeSlots.indexOf(card);
    if (activeIdx !== -1) {
      this.activeSlots[activeIdx] = null;
    }
    const reserveIdx = this.reserve.indexOf(card);
    if (reserveIdx !== -1) {
      this.reserve.splice(reserveIdx, 1);
    }
    card.zone = "graveyard";
    this.graveyard.push(card);
  }

  hasEmptyActiveSlot() {
    return this.activeSlots.some((c) => c === null);
  }
}
