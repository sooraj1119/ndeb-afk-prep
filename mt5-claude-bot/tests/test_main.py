import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import run_live_loop

if __name__ == "__main__":
    print("Running main loop for 1 iteration...")
    run_live_loop(iterations=1)
