import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import run_live_loop

def inject_mock_history():
    history = {"EURUSD": "2026-07-09 07:00:00"}
    with open("signal_history.json", "w") as f:
        json.dump(history, f)

if __name__ == "__main__":
    print("Injecting mock history...")
    inject_mock_history()
    print("Running main loop for 1 iteration with mock history...")
    run_live_loop(iterations=1)
