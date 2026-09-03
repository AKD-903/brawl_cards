from enum import Enum


class BrawlerClass(Enum):
    TANK = "tank"
    SUPPORT = "support"
    DAMAGE = "damage"


HP_BY_CLASS = {
    BrawlerClass.TANK: 130,
    BrawlerClass.SUPPORT: 70,
    BrawlerClass.DAMAGE: 100,
}


class BrawlerTemplate:
    """
    Static definition of a brawler.

    This is the brawler's permanent definition.
    An individual Card is created from this template.
    """

    def __init__(
        self,
        id,
        name,
        brawler_class,
        basic_attack_id,
        super_ability_id,
        max_hp=None,
        art_placeholder_color="#888888",
    ):
        if not isinstance(brawler_class, BrawlerClass):
            raise ValueError(
                f"Unknown brawler class '{brawler_class}' for {id}"
            )

        self.id = id
        self.name = name
        self.brawler_class = brawler_class

        self.max_hp = (
            max_hp
            if max_hp is not None
            else HP_BY_CLASS[brawler_class]
        )

        self.basic_attack_id = basic_attack_id
        self.super_ability_id = super_ability_id
        self.art_placeholder_color = art_placeholder_color