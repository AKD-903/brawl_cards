class Player:

    def __init__(self, id, name, deck):
        self.id = id
        self.name = name

        self.active_slots = list(deck["active"])
        self.reserve = list(deck["reserve"])
        self.graveyard = []

    @property
    def all_cards(self):
        return (
            [
                card
                for card in self.active_slots
                if card is not None
            ]
            + self.reserve
            + self.graveyard
        )

    @property
    def living_active_cards(self):
        return [
            card
            for card in self.active_slots
            if card is not None and card.is_alive
        ]

    @property
    def living_reserve_cards(self):
        return [
            card
            for card in self.reserve
            if card.is_alive
        ]

    @property
    def has_lost(self):
        active_alive = any(
            card is not None and card.is_alive
            for card in self.active_slots
        )

        reserve_alive = any(
            card.is_alive
            for card in self.reserve
        )

        return not active_alive and not reserve_alive

    def swap_into_active(
        self,
        reserve_index,
        active_slot_index
    ):
        if reserve_index < 0 or reserve_index >= len(self.reserve):
            raise ValueError(
                "Invalid reserve index."
            )

        if active_slot_index < 0 or active_slot_index >= len(
            self.active_slots
        ):
            raise ValueError(
                "Invalid active slot."
            )

        reserve_card = self.reserve[reserve_index]

        if not reserve_card.is_alive:
            raise ValueError(
                "Can't field a defeated card."
            )

        if self.active_slots[active_slot_index] is not None:
            raise ValueError(
                "That active slot isn't empty."
            )

        self.reserve.pop(reserve_index)

        reserve_card.zone = "active"

        self.active_slots[active_slot_index] = reserve_card

        return reserve_card

    def handle_defeat(self, card):
        active_index = -1

        try:
            active_index = self.active_slots.index(card)
        except ValueError:
            pass

        if active_index != -1:
            self.active_slots[active_index] = None

        reserve_index = -1

        try:
            reserve_index = self.reserve.index(card)
        except ValueError:
            pass

        if reserve_index != -1:
            self.reserve.pop(reserve_index)

        card.zone = "graveyard"

        if card not in self.graveyard:
            self.graveyard.append(card)

    def has_empty_active_slot(self):
        return any(
            card is None
            for card in self.active_slots
        )