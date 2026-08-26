"""
Backtesting module.
Simulates historical trades using signal_engine.
"""
import config
from signal_engine import evaluate_signal
import risk_manager
import pandas as pd

def run_backtest(df, symbol, htf_df=None):
    """
    Runs historical simulation using the exact live signal_engine.
    """
    print(f"Running backtest for {symbol} with config: FVG={config.USE_FVG}, HTF={config.HTF}, LTF={config.LTF}")


    df_signals = evaluate_signal(df, htf_df)
    
    trades = []
    active_trade = None
    pending_order = None
    
    # 1.5 pips spread + 0.7 pip commission = 2.2 pips = 0.00022 raw price
    transaction_cost_raw = (config.ASSUMED_SPREAD_PIPS + config.ASSUMED_COMMISSION_PIPS) / 10000.0
    
    for i in range(len(df_signals)):
        row = df_signals.iloc[i]
        high = row['high']
        low = row['low']
        
        # 1. Manage active trade
        if active_trade is not None:
            if active_trade['direction'] == 'LONG':
                if low <= active_trade['sl']:
                    active_trade['status'] = 'LOSS'
                    active_trade['exit_price'] = active_trade['sl'] - transaction_cost_raw
                    trades.append(active_trade)
                    active_trade = None
                elif high >= active_trade['tp']:
                    gross_profit = active_trade['tp'] - active_trade['entry_price']
                    if gross_profit <= transaction_cost_raw:
                        active_trade['status'] = 'LOSS'
                    else:
                        active_trade['status'] = 'WIN'
                    active_trade['exit_price'] = active_trade['tp'] - transaction_cost_raw
                    trades.append(active_trade)
                    active_trade = None
            else: # SHORT
                if high >= active_trade['sl']:
                    active_trade['status'] = 'LOSS'
                    active_trade['exit_price'] = active_trade['sl'] + transaction_cost_raw
                    trades.append(active_trade)
                    active_trade = None
                elif low <= active_trade['tp']:
                    gross_profit = active_trade['entry_price'] - active_trade['tp']
                    if gross_profit <= transaction_cost_raw:
                        active_trade['status'] = 'LOSS'
                    else:
                        active_trade['status'] = 'WIN'
                    active_trade['exit_price'] = active_trade['tp'] + transaction_cost_raw
                    trades.append(active_trade)
                    active_trade = None
            continue 
            
        # 2. Manage pending limit order
        if pending_order is not None:
            pending_order['bars_elapsed'] += 1
            
            if pending_order['direction'] == 'LONG':
                # Check invalidations: touched TP before entry, or 10-candle expiry
                if high >= pending_order['tp'] or pending_order['bars_elapsed'] >= 10:
                    pending_order = None # Invalidated
                # Check if entry is tagged
                elif low <= pending_order['entry_price']:
                    active_trade = pending_order
                    pending_order = None
            else: # SHORT
                if low <= pending_order['tp'] or pending_order['bars_elapsed'] >= 10:
                    pending_order = None # Invalidated
                elif high >= pending_order['entry_price']:
                    active_trade = pending_order
                    pending_order = None
                    
            if active_trade is not None:
                continue # Skip looking for new signals if we just entered
                
        # 3. Look for new entries
        if row['signal_long'] and pending_order is None and active_trade is None:
            sl, tp = risk_manager.calculate_sl_tp(row['entry_price'], row['swing_extreme'], row['atr'], "LONG", symbol)
            if sl is not None and tp is not None:
                pending_order = {
                    'entry_time': row.name,
                    'direction': 'LONG',
                    'entry_price': row['entry_price'],
                    'sl': sl,
                    'tp': tp,
                    'bars_elapsed': 0
                }
        elif row['signal_short'] and pending_order is None and active_trade is None:
            sl, tp = risk_manager.calculate_sl_tp(row['entry_price'], row['swing_extreme'], row['atr'], "SHORT", symbol)
            if sl is not None and tp is not None:
                pending_order = {
                    'entry_time': row.name,
                    'direction': 'SHORT',
                    'entry_price': row['entry_price'],
                    'sl': sl,
                    'tp': tp,
                    'bars_elapsed': 0
                }
            
    # Calculate stats
    wins = len([t for t in trades if t['status'] == 'WIN'])
    total = len(trades)
    win_rate = (wins / total * 100) if total > 0 else 0
    
    max_losing_streak = 0
    current_losing_streak = 0
    for t in trades:
        if t['status'] == 'LOSS':
            current_losing_streak += 1
            max_losing_streak = max(max_losing_streak, current_losing_streak)
        else:
            current_losing_streak = 0
            
    avg_win = sum([abs(t['exit_price'] - t['entry_price']) for t in trades if t['status'] == 'WIN']) / wins if wins > 0 else 0
    losses = total - wins
    avg_loss = sum([abs(t['exit_price'] - t['entry_price']) for t in trades if t['status'] == 'LOSS']) / losses if losses > 0 else 0
    
    expectancy = ((win_rate / 100) * avg_win) - ((losses / total if total > 0 else 0) * avg_loss)
    
    results = {
        "config_tag": f"FVG_{config.USE_FVG}_{config.HTF}_{config.LTF}",
        "win_rate": round(win_rate, 2),
        "expectancy_points": round(expectancy, 5),
        "drawdown_streak": max_losing_streak,
        "trades": total
    }
    
    return results, trades
