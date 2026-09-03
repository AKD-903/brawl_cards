from flask import (
    Flask,
    jsonify,
    render_template,
    request,
)

from data.starter_brawlers import starter_brawlers
from game.deck import build_deck
from game.player import Player
from game.game_engine import GameEngine


app = Flask(__name__)


# ============================================================
# GAME CREATION
# ============================================================

def create_game():

    # Alice gets brawlers 1-5 active
    # and 6-7 as reserves.
    deck_a = build_deck(
        starter_brawlers[0:5],
        starter_brawlers[5:7],
        "playerA",
    )

    # Bob gets brawlers 8-12 active
    # and 13-14 as reserves.
    deck_b = build_deck(
        starter_brawlers[7:12],
        starter_brawlers[12:14],
        "playerB",
    )

    player_a = Player(
        "playerA",
        "Alice",
        deck_a,
    )

    player_b = Player(
        "playerB",
        "Bob",
        deck_b,
    )

    engine = GameEngine(
        player_a,
        player_b,
    )

    engine.start_game()

    return engine


engine = create_game()


# ============================================================
# PAGE
# ============================================================

@app.route("/")
def index():
    return render_template("index.html")


# ============================================================
# GAME STATE
# ============================================================

@app.route("/api/state")
def state():

    return jsonify(
        engine.get_state_for("playerA")
    )


# ============================================================
# ATTACK
# ============================================================

@app.route("/api/attack", methods=["POST"])
def attack():

    try:

        data = request.get_json()

        attacker_slot = int(
            data["attackerSlot"]
        )

        target_slot = int(
            data["targetSlot"]
        )

        use_super = bool(
            data.get("useSuper", False)
        )

        result = engine.perform_attack(
            "playerA",
            attacker_slot,
            target_slot,
            use_super,
        )

        # Let the computer play Bob's turn.
        if (
            not engine.is_over
            and engine.active_player_id == "playerB"
        ):
            bot_turn()

        return jsonify({
            "success": True,
            "result": result,
            "state": engine.get_state_for(
                "playerA"
            ),
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "error": str(error),
            "state": engine.get_state_for(
                "playerA"
            ),
        }), 400


# ============================================================
# SWAP
# ============================================================

@app.route("/api/swap", methods=["POST"])
def swap():

    try:

        data = request.get_json()

        reserve_index = int(
            data["reserveIndex"]
        )

        active_slot = int(
            data["activeSlot"]
        )

        card = engine.perform_swap(
            "playerA",
            reserve_index,
            active_slot,
        )

        # Bob gets his turn after the swap.
        if (
            not engine.is_over
            and engine.active_player_id == "playerB"
        ):
            bot_turn()

        return jsonify({
            "success": True,
            "cardName": card.template.name,
            "state": engine.get_state_for(
                "playerA"
            ),
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "error": str(error),
            "state": engine.get_state_for(
                "playerA"
            ),
        }), 400


# ============================================================
# BOT
# ============================================================

def bot_turn():

    if engine.is_over:
        return

    if engine.active_player_id != "playerB":
        return

    bot = engine.players["playerB"]
    human = engine.players["playerA"]

    # --------------------------------------------------------
    # Find an active attacker
    # --------------------------------------------------------

    attacker_index = -1

    for index, card in enumerate(
        bot.active_slots
    ):
        if card is not None and card.is_alive:
            attacker_index = index
            break

    # --------------------------------------------------------
    # If no attacker exists, swap a reserve in.
    # --------------------------------------------------------

    if attacker_index == -1:

        reserve_index = -1

        for index, card in enumerate(
            bot.reserve
        ):
            if card.is_alive:
                reserve_index = index
                break

        empty_slot = -1

        for index, card in enumerate(
            bot.active_slots
        ):
            if card is None:
                empty_slot = index
                break

        if (
            reserve_index != -1
            and empty_slot != -1
        ):
            engine.perform_swap(
                "playerB",
                reserve_index,
                empty_slot,
            )

        return

    # --------------------------------------------------------
    # Find a target.
    # --------------------------------------------------------

    target_index = -1

    for index, card in enumerate(
        human.active_slots
    ):
        if card is not None and card.is_alive:
            target_index = index
            break

    if target_index == -1:
        return

    attacker = bot.active_slots[
        attacker_index
    ]

    # Use super occasionally.
    use_super = (
        attacker.super_unlocked
        and __import__("random").random() < 0.3
    )

    try:

        engine.perform_attack(
            "playerB",
            attacker_index,
            target_index,
            use_super,
        )

    except Exception as error:
        print(
            f"Bot error: {error}"
        )


# ============================================================
# NEW GAME
# ============================================================

@app.route("/api/new-game", methods=["POST"])
def new_game():

    global engine

    engine = create_game()

    return jsonify({
        "success": True,
        "state": engine.get_state_for(
            "playerA"
        ),
    })


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000,
    )