"""
Test fixtures for signal_engine.py.
"""
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from signal_engine import entry_zone
import config

def test_fvg_overlap():
    config.USE_FVG = True
    
    # FVG exists!
    data = {
        'open':  [10, 12, 15],
        'high':  [11, 14, 16], 
        'low':   [9,  11, 12], 
        'close': [10, 13, 15]
    }
    df = pd.DataFrame(data)
    res = entry_zone(df, 2, "LONG")
    assert res is not None, "Failed to identify valid bullish FVG"
    
    # No FVG exists!
    data_no_fvg = {
        'open':  [10, 12, 12],
        'high':  [12, 14, 14], 
        'low':   [9,  11, 11], 
        'close': [11, 13, 13]
    }
    df_no_fvg = pd.DataFrame(data_no_fvg)
    res_no = entry_zone(df_no_fvg, 2, "LONG")
    assert res_no is None, "Incorrectly identified an FVG when none existed"

if __name__ == "__main__":
    test_fvg_overlap()
    print("Signal Engine tests passed.")
