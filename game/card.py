class Card:
    """
    One actual in-game copy of a BrawlerTemplate.
    """

    _instance_counter = 0

    def __init__(
        self,
        template,
        owner_id,
    ):
        Card._instance_counter += 1

        self.instance_id = (
            f"card_{Card._instance_counter}"
        )

        self.template = template
        self.owner_id = owner_id

        self.current_hp = template.max_hp

        self.is_revealed = False
        self.has_acted_once = False
        self.super_unlocked = False
        self.is_defeated = False

        # reserve | active | graveyard
        self.zone = "reserve"

    @property
    def is_alive(self):
        return not self.is_defeated

    def reveal(self):
        self.is_revealed = True

    def mark_acted(self):
        """
        First successful attack unlocks the super.
        """

        if not self.has_acted_once:
            self.has_acted_once = True
            self.super_unlocked = True

    def apply_damage(self, amount):
        self.current_hp = max(
            0,
            self.current_hp - amount,
        )

        if self.current_hp == 0:
            self.is_defeated = True

        return self.current_hp

    def apply_healing(self, amount):
        self.current_hp = min(
            self.template.max_hp,
            self.current_hp + amount,
        )

        return self.current_hp

    def to_public_view(self):
        """
        Information visible to the opponent.
        """

        if not self.is_revealed:
            return {
                "instanceId": self.instance_id,
                "ownerId": self.owner_id,
                "revealed": False,
                "zone": self.zone,
                "alive": self.is_alive,
            }

        return {
            "instanceId": self.instance_id,
            "ownerId": self.owner_id,
            "revealed": True,
            "zone": self.zone,
            "alive": self.is_alive,
            "name": self.template.name,
            "brawlerClass": (
                self.template.brawler_class.value
            ),
            "currentHP": self.current_hp,
            "maxHP": self.template.max_hp,
            "superUnlocked": self.super_unlocked,
        }

    def to_owner_view(self):
        return {
            "instanceId": self.instance_id,
            "ownerId": self.owner_id,
            "revealed": self.is_revealed,
            "zone": self.zone,
            "alive": self.is_alive,
            "name": self.template.name,
            "brawlerClass": (
                self.template.brawler_class.value
            ),
            "currentHP": self.current_hp,
            "maxHP": self.template.max_hp,
            "superUnlocked": self.super_unlocked,
            "hasActedOnce": self.has_acted_once,
        }