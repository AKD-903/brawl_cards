class AbilitySystem:

    def __init__(self):
        self.registry = {}
        self._register_defaults()

    def register(self, ability_id, function):
        self.registry[ability_id] = function

    def resolve(self, ability_id, context):
        if ability_id not in self.registry:
            raise ValueError(
                f'No ability registered under id "{ability_id}"'
            )

        return self.registry[ability_id](context)

    def _damage_one(self, context, is_super=False):
        target = context["target"]

        amount = 1

        target.apply_damage(amount)

        return {
            "type": "damage",
            "amount": amount,
            "targetId": target.instance_id,
            "super": is_super,
        }

    def _register_defaults(self):

        # Basic attacks
        self.register(
            "basic_attack_damage_class",
            lambda context: self._damage_one(context)
        )

        self.register(
            "basic_attack_tank_class",
            lambda context: self._damage_one(context)
        )

        self.register(
            "basic_attack_support_class",
            lambda context: self._damage_one(context)
        )

        # Supers
        self.register(
            "super_damage_class",
            lambda context: self._damage_one(
                context,
                is_super=True
            )
        )

        self.register(
            "super_tank_class",
            lambda context: self._damage_one(
                context,
                is_super=True
            )
        )

        self.register(
            "super_support_class",
            lambda context: self._damage_one(
                context,
                is_super=True
            )
        )