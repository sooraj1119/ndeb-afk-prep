"""
Risk management module.
Handles position sizing, SL/TP calculation, max exposure, and correlation.
"""
import config

def calculate_position_size(equity, stop_distance_pips, risk_pct=config.RISK_PER_TRADE_PCT, volume_step=0.01, min_volume=0.01):
    if stop_distance_pips <= 0:
        return min_volume
        
    risk_amount = equity * (risk_pct / 100.0)
    pip_value_per_lot = 10.0 
    lots = risk_amount / (stop_distance_pips * pip_value_per_lot)
    
    # Round down to nearest volume_step
    lots_stepped = (lots // volume_step) * volume_step
    return max(min_volume, round(lots_stepped, 2))

def calculate_sl_tp(entry_price, swing_extreme, atr, direction, symbol):
    if config.get_config(symbol, "USE_SWING_SL"):
        buffer_fraction = config.get_config(symbol, "SWING_BUFFER_ATR_FRACTION")
        if direction == "LONG":
            sl = swing_extreme - (atr * buffer_fraction)
            sl_distance = entry_price - sl
        else:
            sl = swing_extreme + (atr * buffer_fraction)
            sl_distance = sl - entry_price
    else:
        atr_multiplier = config.get_config(symbol, "ATR_MULTIPLIER")
        sl_distance = atr * atr_multiplier
        if direction == "LONG":
            sl = entry_price - sl_distance
        else:
            sl = entry_price + sl_distance

    # Guard: if sl_distance is zero or negative, the trade geometry is broken
    if sl_distance <= 0:
        return None, None

    if direction == "LONG":
        tp = entry_price + (sl_distance * 2)
    else:
        tp = entry_price - (sl_distance * 2)
    return sl, tp

def check_exposure(current_positions, new_symbol):
    """
    Max concurrent positions and correlated exposure logic.
    
    KNOWN LIMITATION: This naive quote-currency string check only correctly handles
    correlations for *USD pairs (e.g., EURUSD, GBPUSD). Both being LONG means both are 
    Short-USD, which is correlated. 
    However, if we later trade a USD* pair (e.g., USDJPY), LONG EURUSD (Short-USD) and 
    LONG USDJPY (Long-USD) would actually offset, not correlate. This string check 
    would incorrectly flag them or miss them.
    """
    if len(current_positions) >= 2:
        return False
        
    for pos in current_positions:
        open_symbol = pos['symbol'] if isinstance(pos, dict) else pos.symbol
        if open_symbol == new_symbol:
            return False
            
        # Basic correlation check for *USD pairs
        if new_symbol.endswith("USD") and open_symbol.endswith("USD"):
            # If we are already exposed to USD in the quote currency, block new USD-quote trades
            return False
            
    return True
