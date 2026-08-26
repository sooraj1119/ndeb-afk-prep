import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def test_imports():
    try:
        import main
        import backtester
        import signal_engine
        
        print("Import test passed: main and backtester successfully import signal_engine.")
    except Exception as e:
        print(f"Import test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_imports()
