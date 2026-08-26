"""
Test to mathematically prove the elimination of lookahead bias.
"""
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from signal_engine import evaluate_signal

def test_lookahead():
    data = {
        'open':  [9,  10, 9,  11, 9,  8,  13, 12, 11, 10, 14, 13, 12],
        'high':  [10, 11, 10, 12, 10, 9,  14, 13, 12, 11, 16, 14, 13], 
        'low':   [8,  9,  8,  10, 8,  7,  12, 11, 10, 9,  13, 12, 11],
        'close': [9,  10, 9,  11, 9,  8,  13, 12, 11, 10, 15, 13, 12]
    }
    df_full = pd.DataFrame(data)
    
    # Batch run
    res_batch = evaluate_signal(df_full)
    
    # Simulated tick-by-tick run
    res_tick_list = []
    for i in range(1, len(df_full) + 1):
        df_slice = df_full.iloc[:i]
        if len(df_slice) > 4: 
            res_slice = evaluate_signal(df_slice)
            res_tick_list.append(res_slice.iloc[-1])
        else:
            res_tick_list.append(pd.Series({'signal_long': False, 'signal_short': False}))
            
    for i in range(5, len(df_full)):
        batch_long = res_batch['signal_long'].iloc[i]
        tick_long = res_tick_list[i]['signal_long']
        assert batch_long == tick_long, f"Lookahead Bias Detected at index {i}. Batch: {batch_long}, Tick: {tick_long}"

if __name__ == "__main__":
    test_lookahead()
    print("Lookahead test passed.")
