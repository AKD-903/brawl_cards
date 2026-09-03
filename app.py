import json
import random
from pathlib import Path
from http.server import (
    SimpleHTTPRequestHandler,
    ThreadingHTTPServer,
)

from data.starter_brawlers import starter_brawlers
from game.deck import build_deck
from game.player import Player
from game.game_engine import GameEngine


ROOT = Path(__file__).resolve().parent


# ============================================================
# GAME CREATION
# ============================================================

def create_game():

    deck_a = build_deck(
        starter_brawlers[0:5],
        starter_brawlers[5:7],
        "playerA",
    )

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

    # If Bob goes first, let him play.
    if engine.active_player_id == "playerB":
        bot_turn(engine)

    return engine


engine = create_game()


# ============================================================
# BOT
# ============================================================

def bot_turn(engine):

    if engine.is_over:
        return

    if engine.active_player_id != "playerB":
        return

    bot = engine.players["playerB"]
    human = engine.players["playerA"]

    # Find first living attacker.

    attacker_index = -1

    for index, card in enumerate(
        bot.active_slots
    ):
        if (
            card is not None
            and card.is_alive
        ):
            attacker_index = index
            break

    # If no attacker exists,
    # try to bring in a reserve.

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

    # Find first living human target.

    target_index = -1

    for index, card in enumerate(
        human.active_slots
    ):
        if (
            card is not None
            and card.is_alive
        ):
            target_index = index
            break

    if target_index == -1:
        return

    attacker = bot.active_slots[
        attacker_index
    ]

    use_super = (
        attacker.super_unlocked
        and random.random() < 0.30
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
# HTTP SERVER
# ============================================================

class GameRequestHandler(
    SimpleHTTPRequestHandler
):

    def __init__(
        self,
        *args,
        **kwargs,
    ):
        super().__init__(
            *args,
            directory=str(ROOT),
            **kwargs,
        )

    # --------------------------------------------------------
    # JSON RESPONSE
    # --------------------------------------------------------

    def send_json(
        self,
        data,
        status=200,
    ):
        body = json.dumps(
            data
        ).encode("utf-8")

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json",
        )

        self.send_header(
            "Content-Length",
            str(len(body)),
        )

        self.send_header(
            "Cache-Control",
            "no-cache",
        )

        self.end_headers()

        self.wfile.write(body)

    # --------------------------------------------------------
    # READ JSON
    # --------------------------------------------------------

    def read_json(self):

        length = int(
            self.headers.get(
                "Content-Length",
                0,
            )
        )

        body = self.rfile.read(
            length
        )

        if not body:
            return {}

        return json.loads(
            body.decode("utf-8")
        )

    # --------------------------------------------------------
    # GET
    # --------------------------------------------------------

    def do_GET(self):

        if self.path == "/api/state":

            self.send_json(
                engine.get_state_for(
                    "playerA"
                )
            )

            return

        super().do_GET()

    # --------------------------------------------------------
    # POST
    # --------------------------------------------------------

    def do_POST(self):

        global engine

        # ----------------------------------------------------
        # ATTACK
        # ----------------------------------------------------

        if self.path == "/api/attack":

            try:

                data = self.read_json()

                attacker_slot = int(
                    data["attackerSlot"]
                )

                target_slot = int(
                    data["targetSlot"]
                )

                use_super = bool(
                    data.get(
                        "useSuper",
                        False,
                    )
                )

                result = engine.perform_attack(
                    "playerA",
                    attacker_slot,
                    target_slot,
                    use_super,
                )

                # Bob takes his turn.

                if (
                    not engine.is_over
                    and engine.active_player_id
                    == "playerB"
                ):
                    bot_turn(engine)

                self.send_json({
                    "success": True,
                    "result": result,
                    "state":
                        engine.get_state_for(
                            "playerA"
                        ),
                })

            except Exception as error:

                self.send_json(
                    {
                        "success": False,
                        "error": str(error),
                        "state":
                            engine.get_state_for(
                                "playerA"
                            ),
                    },
                    status=400,
                )

            return

        # ----------------------------------------------------
        # SWAP
        # ----------------------------------------------------

        if self.path == "/api/swap":

            try:

                data = self.read_json()

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

                # Bob takes his turn.

                if (
                    not engine.is_over
                    and engine.active_player_id
                    == "playerB"
                ):
                    bot_turn(engine)

                self.send_json({
                    "success": True,

                    "cardName":
                        card.template.name,

                    "state":
                        engine.get_state_for(
                            "playerA"
                        ),
                })

            except Exception as error:

                self.send_json(
                    {
                        "success": False,
                        "error": str(error),
                        "state":
                            engine.get_state_for(
                                "playerA"
                            ),
                    },
                    status=400,
                )

            return

        # ----------------------------------------------------
        # NEW GAME
        # ----------------------------------------------------

        if self.path == "/api/new-game":

            try:

                engine = create_game()

                self.send_json({
                    "success": True,
                    "state":
                        engine.get_state_for(
                            "playerA"
                        ),
                })

            except Exception as error:

                self.send_json(
                    {
                        "success": False,
                        "error": str(error),
                    },
                    status=500,
                )

            return

        # ----------------------------------------------------
        # UNKNOWN POST
        # ----------------------------------------------------

        self.send_json(
            {
                "success": False,
                "error": "Unknown endpoint.",
            },
            status=404,
        )


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    host = "127.0.0.1"
    port = 8000

    server = ThreadingHTTPServer(
        (host, port),
        GameRequestHandler,
    )

    print()
    print("====================================")
    print("       BRAWL CARDS SERVER")
    print("====================================")
    print()
    print(
        f"Game running at:"
    )
    print(
        f"http://{host}:{port}"
    )
    print()
    print(
        "Press Ctrl+C to stop the server."
    )
    print()

    try:
        server.serve_forever()

    except KeyboardInterrupt:

        print()
        print("Server stopped.")

    finally:

        server.server_close()