"""
Test fixtures for structure.py.
"""
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from structure import detect_structure_shift

def test_bos_detection():
    data2 = {
        'high': [10, 11, 10, 12, 10, 9, 14, 13, 12, 11, 16, 14, 13], 
        'low':  [ 8,  9,  8, 10,  8, 7, 12, 11, 10,  9, 13, 12, 11],
        'close':[ 9, 10,  9, 11,  9, 8, 13, 12, 11, 10, 15, 13, 12] 
    }
    df2 = pd.DataFrame(data2)
    res2 = detect_structure_shift(df2)
    
    assert res2['CHoCH_bullish'].iloc[6] == True, "Failed CHoCH bullish detection"
    assert res2['BOS_bullish'].iloc[10] == True, "Failed BOS bullish detection"

def test_choch_detection():
    data = {
        'high': [10, 11, 10, 12, 10, 9, 14, 13, 12, 11, 8, 7, 6], 
        'low':  [ 8,  9,  8, 10,  8, 7, 12, 11, 10,  9, 5, 4, 3],
        'close':[ 9, 10,  9, 11,  9, 8, 13, 12, 11, 10, 6, 5, 4] # idx 10 close is 6, < 7
    }
    df = pd.DataFrame(data)
    res = detect_structure_shift(df)
    
    assert res['CHoCH_bullish'].iloc[6] == True, "Failed CHoCH bullish"
    assert res['CHoCH_bearish'].iloc[10] == True, "Failed CHoCH bearish"

if __name__ == "__main__":
    test_bos_detection()
    test_choch_detection()
    print("All tests passed successfully.")
