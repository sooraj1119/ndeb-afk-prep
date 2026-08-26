"""
Core signal engine.
Combines structure, liquidity, displacement, and entry zones.
"""
import config
import news_filter
from structure import detect_structure_shift
from liquidity import sweep_detected
import pandas as pd
import numpy as np

def calculate_true_range(df):
    high_low = df['high'] - df['low']
    high_close = np.abs(df['high'] - df['close'].shift())
    low_close = np.abs(df['low'] - df['close'].shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    return true_range

def displacement_confirmed(df, index, direction):
    """
    Step 3: Displacement.
    Dual-filter approach: Leg must exceed ATR multiple.
    """
    if index < 14: return False, 0.001
    
    tr = calculate_true_range(df.iloc[max(0, index-15):index+1])
    atr = tr.iloc[-15:-1].mean()  # 14-period ATR
    if atr == 0 or pd.isna(atr): atr = 0.001
        
    leg_length = abs(df['close'].iloc[index] - df['open'].iloc[max(0, index-2)])
    
    if leg_length < (atr * 1.0): 
        return False, atr
        
    if config.USE_VOLUMETRIC_CONFIRMATION:
        body = abs(df['close'].iloc[index] - df['open'].iloc[index])
        avg_body = abs(df['close'].iloc[max(0, index-10):index] - df['open'].iloc[max(0, index-10):index]).mean()
        if body < 1.5 * avg_body:
            return False, atr
            
    return True, atr

def entry_zone(df, index, direction):
    """
    Step 4: True Entry Zone and FVG.
    Identifies Swing High/Low of the displacement leg, calculates 61.8-78.6% OTE,
    and returns entry if FVG overlaps.
    """
    if index < 5: return None
    
    swing_high = df['high'].iloc[index-2:index+1].max()
    swing_low = df['low'].iloc[index-2:index+1].min()
    
    fvg_entry = None
    if config.USE_FVG:
        if direction == "LONG":
            fvg_gap = df['low'].iloc[index] - df['high'].iloc[index-2]
            if fvg_gap <= 0: return None
            fvg_entry = df['high'].iloc[index-2] # Top of the gap
        else:
            fvg_gap = df['low'].iloc[index-2] - df['high'].iloc[index]
            if fvg_gap <= 0: return None
            fvg_entry = df['low'].iloc[index-2] # Bottom of the gap
    else:
        fvg_entry = swing_high - (swing_high - swing_low)*0.5 if direction=="LONG" else swing_low + (swing_high - swing_low)*0.5

    range_dist = swing_high - swing_low
    if direction == "LONG":
        ote_top = swing_high - (range_dist * 0.618)
        ote_bottom = swing_high - (range_dist * 0.786)
        entry_price = min(fvg_entry, ote_top) 
        if entry_price < ote_bottom:
            entry_price = ote_bottom
        return entry_price, swing_low
    else:
        ote_bottom = swing_low + (range_dist * 0.618)
        ote_top = swing_low + (range_dist * 0.786)
        entry_price = max(fvg_entry, ote_bottom)
        if entry_price > ote_top:
            entry_price = ote_top
        return entry_price, swing_high


def rejection_wick_confirmed(df, index, direction):
    if not getattr(config, 'USE_REJECTION_WICK', False):
        return True
        
    candle_range = df['high'].iloc[index] - df['low'].iloc[index]
    if candle_range <= 0:
        return False
        
    if direction == "LONG":
        lower_wick = min(df['open'].iloc[index], df['close'].iloc[index]) - df['low'].iloc[index]
        wick_ratio = lower_wick / candle_range
    else:
        upper_wick = df['high'].iloc[index] - max(df['open'].iloc[index], df['close'].iloc[index])
        wick_ratio = upper_wick / candle_range
        
    min_ratio = getattr(config, 'REJECTION_WICK_MIN_RATIO', 0.5)
    return wick_ratio >= min_ratio

def evaluate_signal(df, htf_df=None):
    df = df.copy()
    df = sweep_detected(df)
    df = detect_structure_shift(df)
    
    if htf_df is not None:
        htf_df = htf_df.copy()
        htf_df['ema_50'] = htf_df['close'].ewm(span=50, adjust=False).mean()
        # Shift by 1 to ensure we only ever use fully CLOSED H4 candles
        htf_df['ema_50_closed'] = htf_df['ema_50'].shift(1)
        
        merged = pd.merge_asof(df, htf_df[['ema_50_closed']], left_index=True, right_index=True, direction='backward')
        df['htf_ema'] = merged['ema_50_closed']
    else:
        # Fallback to LTF proxy
        df['htf_ema'] = df['close'].ewm(span=200, adjust=False).mean()
    
    df['signal_long'] = False
    df['signal_short'] = False
    df['entry_price'] = np.nan
    df['swing_extreme'] = np.nan
    df['atr'] = np.nan
    
    lookforward = getattr(config, 'STRUCT_LOOKFORWARD_CANDLES', 0)
    # Track which candles have already generated a signal to prevent duplicates
    signalled = set()

    for i in range(len(df)):
        ts = df.index[i]
        if not news_filter.is_safe_to_trade(ts):
            continue

        bull_sweep = df.get('liquidity_sweep_bullish', pd.Series(False, index=df.index)).iloc[i]
        bear_sweep = df.get('liquidity_sweep_bearish', pd.Series(False, index=df.index)).iloc[i]

        if not bull_sweep and not bear_sweep:
            continue

        # HTF Alignment at sweep candle
        htf_bullish = df['close'].iloc[i] > df['htf_ema'].iloc[i]
        htf_bearish = df['close'].iloc[i] < df['htf_ema'].iloc[i]

        # Scan from the sweep candle itself through the next N candles for structure break
        window_end = min(i + lookforward + 1, len(df))
        for j in range(i, window_end):
            if j in signalled:
                continue

            bull_struct = df['CHoCH_bullish'].iloc[j] or df['BOS_bullish'].iloc[j]
            bear_struct = df['CHoCH_bearish'].iloc[j] or df['BOS_bearish'].iloc[j]

            if bull_sweep and htf_bullish and bull_struct and rejection_wick_confirmed(df, j, "LONG"):
                disp_ok, atr = displacement_confirmed(df, j, "LONG")
                if disp_ok:
                    res = entry_zone(df, j, "LONG")
                    if res:
                        entry, swing_extreme = res
                        df.loc[df.index[j], 'signal_long'] = True
                        df.loc[df.index[j], 'entry_price'] = entry
                        df.loc[df.index[j], 'swing_extreme'] = swing_extreme
                        df.loc[df.index[j], 'atr'] = atr
                        signalled.add(j)
                        break  # One signal per sweep event

            if bear_sweep and htf_bearish and bear_struct and rejection_wick_confirmed(df, j, "SHORT"):
                disp_ok, atr = displacement_confirmed(df, j, "SHORT")
                if disp_ok:
                    res = entry_zone(df, j, "SHORT")
                    if res:
                        entry, swing_extreme = res
                        df.loc[df.index[j], 'signal_short'] = True
                        df.loc[df.index[j], 'entry_price'] = entry
                        df.loc[df.index[j], 'swing_extreme'] = swing_extreme
                        df.loc[df.index[j], 'atr'] = atr
                        signalled.add(j)
                        break  # One signal per sweep event

    return df
