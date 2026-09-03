import random

from .ability_system import AbilitySystem


class GameEngine:

    def __init__(
        self,
        player_a,
        player_b,
        ability_system=None,
    ):
        self.players = {
            player_a.id: player_a,
            player_b.id: player_b,
        }

        self.player_order = [
            player_a.id,
            player_b.id,
        ]

        self.abilities = (
            ability_system
            if ability_system is not None
            else AbilitySystem()
        )

        self.turn_number = 0
        self.active_player_id = None
        self.winner_id = None
        self.is_over = False

        self.log = []

    def _emit(self, event):
        self.log.append({
            "turn": self.turn_number,
            **event,
        })

    def get_opponent_id(self, player_id):
        for player_id_in_order in (
            self.player_order
        ):
            if player_id_in_order != player_id:
                return player_id_in_order

        raise ValueError(
            "Could not find opponent."
        )

    def start_game(self):
        first = random.choice(
            self.player_order
        )

        self.active_player_id = first
        self.turn_number = 1

        self._emit({
            "type": "GAME_START",
            "firstPlayerId": first,
        })

        return first

    def _require_active_player(
        self,
        player_id,
    ):
        if self.is_over:
            raise ValueError(
                "Game is already over."
            )

        if player_id != self.active_player_id:
            raise ValueError(
                f"It's not {player_id}'s turn."
            )

    def perform_attack(
        self,
        player_id,
        attacker_slot_index,
        target_slot_index,
        use_super=False,
    ):
        self._require_active_player(
            player_id
        )

        attacker_player = self.players[
            player_id
        ]

        defender_id = self.get_opponent_id(
            player_id
        )

        defender_player = self.players[
            defender_id
        ]

        if not (
            0
            <= attacker_slot_index
            < len(
                attacker_player.active_slots
            )
        ):
            raise ValueError(
                "Invalid attacker slot."
            )

        if not (
            0
            <= target_slot_index
            < len(
                defender_player.active_slots
            )
        ):
            raise ValueError(
                "Invalid target slot."
            )

        attacker = (
            attacker_player.active_slots[
                attacker_slot_index
            ]
        )

        target = (
            defender_player.active_slots[
                target_slot_index
            ]
        )

        if (
            attacker is None
            or not attacker.is_alive
        ):
            raise ValueError(
                "No living attacker in that slot."
            )

        if (
            target is None
            or not target.is_alive
        ):
            raise ValueError(
                "No living target in that slot."
            )

        if (
            use_super
            and not attacker.super_unlocked
        ):
            raise ValueError(
                "That card's super isn't "
                "unlocked yet."
            )

        # Combat reveals both cards.

        attacker.reveal()
        target.reveal()

        ability_id = (
            attacker.template.super_ability_id
            if use_super
            else attacker.template.basic_attack_id
        )

        result = self.abilities.resolve(
            ability_id,
            {
                "engine": self,
                "source": attacker,
                "target": target,

                "all_allies": [
                    card
                    for card
                    in attacker_player.active_slots
                    if card is not None
                ],

                "all_enemies": [
                    card
                    for card
                    in defender_player.active_slots
                    if card is not None
                ],
            },
        )

        # First successful attack unlocks super.

        attacker.mark_acted()

        self._emit({
            "type": (
                "SUPER_ATTACK"
                if use_super
                else "BASIC_ATTACK"
            ),

            "playerId": player_id,

            "attackerId":
                attacker.instance_id,

            "targetId":
                target.instance_id,

            "attackerName":
                attacker.template.name,

            "targetName":
                target.template.name,

            "result": result,
        })

        self._check_for_defeats(
            attacker_player
        )

        self._check_for_defeats(
            defender_player
        )

        self._check_win_condition()

        if not self.is_over:
            self._advance_turn()

        return result

    def perform_swap(
        self,
        player_id,
        reserve_index,
        active_slot_index,
    ):
        self._require_active_player(
            player_id
        )

        player = self.players[
            player_id
        ]

        card = player.swap_into_active(
            reserve_index,
            active_slot_index,
        )

        self._emit({
            "type": "SWAP",
            "playerId": player_id,
            "cardId": card.instance_id,
            "cardName": card.template.name,
            "activeSlotIndex":
                active_slot_index,
        })

        self._advance_turn()

        return card

    def _check_for_defeats(
        self,
        player,
    ):
        cards_to_check = (
            list(player.active_slots)
            + list(player.reserve)
        )

        for card in cards_to_check:
            if (
                card is not None
                and card.is_defeated
                and card.zone != "graveyard"
            ):
                player.handle_defeat(card)

                self._emit({
                    "type": "DEFEATED",
                    "playerId": player.id,
                    "cardId": card.instance_id,
                    "cardName":
                        card.template.name,
                })

    def _check_win_condition(self):
        for player_id in (
            self.player_order
        ):
            if self.players[
                player_id
            ].has_lost:

                self.is_over = True

                self.winner_id = (
                    self.get_opponent_id(
                        player_id
                    )
                )

                self._emit({
                    "type": "GAME_OVER",
                    "winnerId":
                        self.winner_id,
                    "loserId":
                        player_id,
                })

                return

    def _advance_turn(self):
        self.active_player_id = (
            self.get_opponent_id(
                self.active_player_id
            )
        )

        self.turn_number += 1

    def get_state_for(
        self,
        player_id,
    ):
        if player_id not in self.players:
            raise ValueError(
                "Unknown player."
            )

        opponent_id = (
            self.get_opponent_id(
                player_id
            )
        )

        me = self.players[player_id]
        opponent = self.players[
            opponent_id
        ]

        return {
            "turnNumber":
                self.turn_number,

            "activePlayerId":
                self.active_player_id,

            "isOver":
                self.is_over,

            "winnerId":
                self.winner_id,

            "you": {
                "id": me.id,
                "name": me.name,

                "active": [
                    card.to_owner_view()
                    if card is not None
                    else None
                    for card in me.active_slots
                ],

                "reserve": [
                    card.to_owner_view()
                    for card in me.reserve
                ],
            },

            "opponent": {
                "id": opponent.id,
                "name": opponent.name,

                "active": [
                    card.to_public_view()
                    if card is not None
                    else None
                    for card
                    in opponent.active_slots
                ],

                "reserveCount":
                    len(opponent.reserve),
            },

            "log": self.log[-30:],
        }