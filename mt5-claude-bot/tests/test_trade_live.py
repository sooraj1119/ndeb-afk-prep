import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import config
from data_feed import initialize_mt5, shutdown_mt5
import execution
import MetaTrader5 as mt5

def test_trade():
    print("Initializing MT5...")
    initialize_mt5()
    
    # Force LIVE mode for this test
    config.DEMO_MODE = False
    
    symbol = "EURUSD"
    symbol_with_suffix = symbol + config.SYMBOL_SUFFIX
    
    print(f"Fetching current tick for {symbol_with_suffix}...")
    tick = mt5.symbol_info_tick(symbol_with_suffix)
    if tick is None:
        print(f"Failed to get tick for {symbol_with_suffix}. MT5 Error: {mt5.last_error()}")
        shutdown_mt5()
        return
        
    ask = tick.ask
    
    # 20 pip SL, 40 pip TP (approx for 5 digit broker)
    # 1 pip = 0.0001
    sl = ask - 0.0020
    tp = ask + 0.0040
    volume = 0.01
    
    print(f"Executing LONG {volume} on {symbol_with_suffix} | Ask: {ask} | SL: {sl} | TP: {tp}")
    
    result = execution.place_order(symbol, "LONG", volume, sl, tp)
    if result:
        print("Test trade EXECUTED successfully!")
    else:
        print("Test trade FAILED.")
        
    shutdown_mt5()

if __name__ == "__main__":
    test_trade()
