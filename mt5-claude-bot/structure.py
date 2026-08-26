"""
Market structure engine.
Detects BOS/CHoCH, swing highs/lows with ZERO lookahead bias.
"""
import pandas as pd
import numpy as np

def detect_swing_highs_lows(df, left_bars=2, right_bars=2):
    df = df.copy()
    df['swing_high_confirmed'] = False
    df['swing_low_confirmed'] = False
    df['confirmed_SH_price'] = np.nan
    df['confirmed_SL_price'] = np.nan
    
    for i in range(left_bars, len(df) - right_bars):
        is_sh = True
        for j in range(1, left_bars + 1):
            if df['high'].iloc[i] <= df['high'].iloc[i - j]: is_sh = False; break
        if is_sh:
            for j in range(1, right_bars + 1):
                if df['high'].iloc[i] <= df['high'].iloc[i + j]: is_sh = False; break
                
        # ZERO LOOKAHEAD: Only mark as confirmed at i + right_bars
        if is_sh: 
            confirm_idx = i + right_bars
            df.loc[df.index[confirm_idx], 'swing_high_confirmed'] = True
            df.loc[df.index[confirm_idx], 'confirmed_SH_price'] = df['high'].iloc[i]
            
        is_sl = True
        for j in range(1, left_bars + 1):
            if df['low'].iloc[i] >= df['low'].iloc[i - j]: is_sl = False; break
        if is_sl:
            for j in range(1, right_bars + 1):
                if df['low'].iloc[i] >= df['low'].iloc[i + j]: is_sl = False; break
                
        if is_sl: 
            confirm_idx = i + right_bars
            df.loc[df.index[confirm_idx], 'swing_low_confirmed'] = True
            df.loc[df.index[confirm_idx], 'confirmed_SL_price'] = df['low'].iloc[i]
            
    return df

def detect_structure_shift(df):
    df = detect_swing_highs_lows(df)
    
    df['BOS_bullish'] = False
    df['BOS_bearish'] = False
    df['CHoCH_bullish'] = False
    df['CHoCH_bearish'] = False
    
    last_sh = None
    last_sl = None
    trend = 0
    
    for i in range(len(df)):
        current_close = df['close'].iloc[i]
        
        # Check break FIRST against currently known levels
        if last_sh is not None and current_close > last_sh:
            if trend == 1: df.loc[df.index[i], 'BOS_bullish'] = True
            else: df.loc[df.index[i], 'CHoCH_bullish'] = True; trend = 1
            last_sh = None
            
        elif last_sl is not None and current_close < last_sl:
            if trend == -1: df.loc[df.index[i], 'BOS_bearish'] = True
            else: df.loc[df.index[i], 'CHoCH_bearish'] = True; trend = -1
            last_sl = None
            
        # Update last_sh/last_sl AFTER, ensuring we only use levels confirmed at this tick
        if df['swing_high_confirmed'].iloc[i]: 
            last_sh = df['confirmed_SH_price'].iloc[i]
        if df['swing_low_confirmed'].iloc[i]: 
            last_sl = df['confirmed_SL_price'].iloc[i]
            
    return df
