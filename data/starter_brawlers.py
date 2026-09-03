from game.brawler_template import (
    BrawlerTemplate,
    BrawlerClass,
)


ABILITY_ID_BY_CLASS = {
    BrawlerClass.TANK: {
        "basic": "basic_attack_tank_class",
        "super": "super_tank_class",
    },

    BrawlerClass.SUPPORT: {
        "basic": "basic_attack_support_class",
        "super": "super_support_class",
    },

    BrawlerClass.DAMAGE: {
        "basic": "basic_attack_damage_class",
        "super": "super_damage_class",
    },
}


def make_template(
    id,
    name,
    brawler_class
):
    abilities = ABILITY_ID_BY_CLASS[
        brawler_class
    ]

    return BrawlerTemplate(
        id=id,
        name=name,
        brawler_class=brawler_class,
        basic_attack_id=abilities["basic"],
        super_ability_id=abilities["super"],
    )


starter_brawlers = [

    make_template(
        "brawler_01",
        "Placeholder Tank 1",
        BrawlerClass.TANK,
    ),

    make_template(
        "brawler_02",
        "Placeholder Tank 2",
        BrawlerClass.TANK,
    ),

    make_template(
        "brawler_03",
        "Placeholder Tank 3",
        BrawlerClass.TANK,
    ),

    make_template(
        "brawler_04",
        "Placeholder Tank 4",
        BrawlerClass.TANK,
    ),

    make_template(
        "brawler_05",
        "Placeholder Tank 5",
        BrawlerClass.TANK,
    ),

    make_template(
        "brawler_06",
        "Placeholder Support 1",
        BrawlerClass.SUPPORT,
    ),

    make_template(
        "brawler_07",
        "Placeholder Support 2",
        BrawlerClass.SUPPORT,
    ),

    make_template(
        "brawler_08",
        "Placeholder Support 3",
        BrawlerClass.SUPPORT,
    ),

    make_template(
        "brawler_09",
        "Placeholder Support 4",
        BrawlerClass.SUPPORT,
    ),

    make_template(
        "brawler_10",
        "Placeholder Support 5",
        BrawlerClass.SUPPORT,
    ),

    make_template(
        "brawler_11",
        "Placeholder Damage 1",
        BrawlerClass.DAMAGE,
    ),

    make_template(
        "brawler_12",
        "Placeholder Damage 2",
        BrawlerClass.DAMAGE,
    ),

    make_template(
        "brawler_13",
        "Placeholder Damage 3",
        BrawlerClass.DAMAGE,
    ),

    make_template(
        "brawler_14",
        "Placeholder Damage 4",
        BrawlerClass.DAMAGE,
    ),

    make_template(
        "brawler_15",
        "Placeholder Damage 5",
        BrawlerClass.DAMAGE,
    ),
]


def get_brawler_by_id(brawler_id):
    for brawler in starter_brawlers:
        if brawler.id == brawler_id:
            return brawler

    raise ValueError(
        f'Unknown starter brawler id "{brawler_id}"'
    )