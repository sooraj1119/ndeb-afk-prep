"""
Data pipeline module.
Pulls OHLCV and tick data from MT5.
Handles connection lifecycle explicitly.
"""
import config
import MetaTrader5 as mt5
import pandas as pd
import numpy as np

# Map string timeframe to MT5 constants
TIMEFRAME_MAP = {
    "M1": mt5.TIMEFRAME_M1,
    "M5": mt5.TIMEFRAME_M5,
    "15M": mt5.TIMEFRAME_M15,
    "H1": mt5.TIMEFRAME_H1,
    "H4": mt5.TIMEFRAME_H4,
    "D1": mt5.TIMEFRAME_D1
}

def initialize_mt5():
    """
    Initializes MT5 connection. 
    Strictly checks both initialize() and login() success.
    """
    if not config.MT5_ACCOUNT or not config.MT5_PASSWORD or not config.MT5_SERVER:
        raise ValueError("MT5 Credentials missing in .env")
        
    print(f"Initializing MT5 connection for account {config.MT5_ACCOUNT} on {config.MT5_SERVER}")
    
    authorized = mt5.initialize(
        path=config.MT5_TERMINAL_PATH, 
        login=int(config.MT5_ACCOUNT), 
        password=config.MT5_PASSWORD, 
        server=config.MT5_SERVER
    )
    
    if not authorized:
        err = mt5.last_error()
        mt5.shutdown()
        raise ConnectionError(f"MT5 Initialization/Login failed. Error code: {err}")
        
    print("MT5 Successfully Initialized and Logged In.")

def shutdown_mt5():
    """
    Shuts down MT5 connection.
    """
    print("Shutting down MT5 connection.")
    mt5.shutdown()

def get_rates(symbol, timeframe_str, count=1000):
    """
    Fetches historical OHLCV data and formats it strictly for the signal engine.
    """
    tf = TIMEFRAME_MAP.get(timeframe_str)
    if tf is None:
        raise ValueError(f"Unsupported timeframe: {timeframe_str}")
        
    rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
    
    if rates is None or len(rates) == 0:
        err = mt5.last_error()
        raise Exception(f"Failed to fetch rates for {symbol} on {timeframe_str}. Error: {err}")
        
    df = pd.DataFrame(rates)
    
    # Critical formatting step: convert UNIX timestamp to DatetimeIndex
    # MT5 returns time in seconds, representing broker local time.
    # We localize to broker timezone to handle DST, then convert to absolute UTC.
    df['time'] = pd.to_datetime(df['time'], unit='s')
    df['time'] = df['time'].dt.tz_localize(config.BROKER_TIMEZONE).dt.tz_convert('UTC')
    df.set_index('time', inplace=True)
    
    return df
