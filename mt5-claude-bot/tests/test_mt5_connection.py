"""
Test live MT5 connection and fetch sample data.
"""
import sys
import os
import pandas as pd
import MetaTrader5 as mt5

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import config
from data_feed import initialize_mt5, shutdown_mt5, get_rates

def test_connection():
    try:
        initialize_mt5()
        
        # Determine the correct symbol format for the demo server
        # Some brokers use "EURUSD", others use "EURUSD.a" or similar.
        all_symbols = mt5.symbols_get()
        if all_symbols is None:
            print("Failed to fetch symbols. Terminal might be disconnected.")
            shutdown_mt5()
            return
            
        eurusd_symbol = None
        for s in all_symbols:
            if "EURUSD" in s.name:
                eurusd_symbol = s.name
                break
                
        if not eurusd_symbol:
            print("EURUSD not found on this server.")
            shutdown_mt5()
            return
            
        print(f"Found correct EURUSD symbol format: '{eurusd_symbol}'")
        
        # Verify symbol info
        info = mt5.symbol_info(eurusd_symbol)
        if info is None:
            print(f"Failed to fetch symbol info for {eurusd_symbol}")
            shutdown_mt5()
            return
            
        print(f"Symbol Volume Step: {info.volume_step}, Min Volume: {info.volume_min}")
        
        # Try fetching data
        try:
            df = get_rates(eurusd_symbol, "15M", 100)
            print("Successfully fetched 100 bars of 15M data.")
            print(f"Dataframe Index type: {type(df.index)}")
            print(df.tail(2))
        except Exception as e:
            # Check if this is a typical weekend outage or actual failure
            err_code = mt5.last_error()[0]
            if err_code in [1, -1, 4736, 4738]: # Generic failures often seen when market is closed or no history
                print(f"Failed to fetch rates, but this is likely due to the market being closed (Weekend). Error: {e}")
            else:
                print(f"Failed to fetch rates. Real Error: {e}")
                
    except Exception as e:
        print(f"Connection test failed fatally: {e}")
    finally:
        shutdown_mt5()

if __name__ == "__main__":
    test_connection()
