"""
Central configuration module.
"""
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# MT5 Settings
MT5_ACCOUNT = os.getenv("MT5_ACCOUNT")
MT5_PASSWORD = os.getenv("MT5_PASSWORD")
MT5_SERVER = os.getenv("MT5_SERVER")
MT5_TERMINAL_PATH = os.getenv("MT5_TERMINAL_PATH", r"C:\Program Files\MetaTrader 5\terminal64.exe").strip('"')
BROKER_TIMEZONE = "Europe/Bucharest" # IANA timezone for exact DST handling

# Risk Settings
RISK_PER_TRADE_PCT = 1.0
ATR_MULTIPLIER = 1.5

# Trade Settings
SYMBOLS = ["EURUSD"]
HTF = "H4"
LTF = "15M"

# Signal Engine Toggles
USE_FVG = True
USE_VOLUMETRIC_CONFIRMATION = True
USE_SWING_SL = True
SWING_BUFFER_ATR_FRACTION = 0.2

# Per-Symbol Overrides
SYMBOL_OVERRIDES = {
    "GBPUSD": {
        "ATR_MULTIPLIER": 1.5,
        "SWING_BUFFER_ATR_FRACTION": 0.2
    }
}

def get_config(symbol, param_name):
    """
    Returns the configuration parameter for a specific symbol,
    falling back to the global default if no override exists.
    """
    # Strip any suffix if present (e.g. if SYMBOL_SUFFIX is used)
    base_symbol = symbol[:-len(SYMBOL_SUFFIX)] if SYMBOL_SUFFIX and symbol.endswith(SYMBOL_SUFFIX) else symbol
    if base_symbol in SYMBOL_OVERRIDES and param_name in SYMBOL_OVERRIDES[base_symbol]:
        return SYMBOL_OVERRIDES[base_symbol][param_name]
    return globals().get(param_name)


# Session Settings
SESSION_TIMES = {
    "London": {"start": "07:00", "end": "16:00"},
    "NewYork": {"start": "13:00", "end": "21:00"}
}

# Mode & Execution
DEMO_MODE = True
MAGIC_NUMBER = 123456
SYMBOL_SUFFIX = ""

# --- BACKTESTING ASSUMPTIONS ---
ASSUMED_SPREAD_PIPS = 1.5
ASSUMED_COMMISSION_PIPS = 0.7

# --- SIGNAL FILTERS ---
USE_REJECTION_WICK = False
REJECTION_WICK_MIN_RATIO = 0.5

# Structure break lookforward window after a sweep
STRUCT_LOOKFORWARD_CANDLES = 5
