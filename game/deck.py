from .card import Card


DECK_ACTIVE_SIZE = 5
DECK_RESERVE_SIZE = 2


def build_deck(
    active_templates,
    reserve_templates,
    owner_id
):
    if len(active_templates) != DECK_ACTIVE_SIZE:
        raise ValueError(
            f"Active lineup must have exactly "
            f"{DECK_ACTIVE_SIZE} brawlers "
            f"(got {len(active_templates)})"
        )

    if len(reserve_templates) != DECK_RESERVE_SIZE:
        raise ValueError(
            f"Reserves must have exactly "
            f"{DECK_RESERVE_SIZE} brawlers "
            f"(got {len(reserve_templates)})"
        )

    all_ids = [
        template.id
        for template in (
            active_templates + reserve_templates
        )
    ]

    if len(set(all_ids)) != len(all_ids):
        raise ValueError(
            "Deck contains duplicate brawlers."
        )

    active = []

    for template in active_templates:
        card = Card(template, owner_id)
        card.zone = "active"
        active.append(card)

    reserve = []

    for template in reserve_templates:
        card = Card(template, owner_id)
        card.zone = "reserve"
        reserve.append(card)

    return {
        "active": active,
        "reserve": reserve,
    }