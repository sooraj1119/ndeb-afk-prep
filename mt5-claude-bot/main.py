"""
Main execution orchestrator.
"""
import config
import data_feed
import signal_engine
import risk_manager
import execution
from logger import log_signal, log_system, send_alert
import MetaTrader5 as mt5
import time
from datetime import datetime, timezone, timedelta
import json
import os

HISTORY_FILE = "signal_history.json"

def load_signal_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_signal_history(history):
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f)

def get_seconds_to_next_boundary(ltf_str):
    now = datetime.now(timezone.utc)
    if ltf_str == "15M":
        minutes = 15 - (now.minute % 15)
        next_boundary = now.replace(second=0, microsecond=0) + timedelta(minutes=minutes)
        return (next_boundary - now).total_seconds() + 5
    return 60

def run_live_loop(iterations=None):
    log_system(f"Starting live loop. Demo Mode: {config.DEMO_MODE}")
    data_feed.initialize_mt5()
    
    try:
        signal_history = load_signal_history()
        last_candle_time = None
        
        count = 0
        while True:
            if iterations is not None and count >= iterations:
                break
                
            # --- FAST LOOP (Run every 1 second) ---
            active_symbols = set()
            positions = mt5.positions_get(magic=config.MAGIC_NUMBER)
            if positions:
                for p in positions:
                    active_symbols.add(p.symbol)
                    
            pending_orders = mt5.orders_get(magic=config.MAGIC_NUMBER)
            if pending_orders:
                for o in pending_orders:
                    active_symbols.add(o.symbol)
                    
            # Fast scan: cancel pending limit orders if price touched TP before entry
            if pending_orders:
                for order in pending_orders:
                    tick = mt5.symbol_info_tick(order.symbol)
                    if tick:
                        # BUY_LIMIT
                        if order.type == mt5.ORDER_TYPE_BUY_LIMIT and tick.bid >= order.tp:
                            log_system(f"[{order.symbol}] Fast Scan: Pending BUY Limit hit TP before entry. Invalidating.")
                            if execution.cancel_order(order.ticket):
                                active_symbols.discard(order.symbol)
                        # SELL_LIMIT
                        elif order.type == mt5.ORDER_TYPE_SELL_LIMIT and tick.ask <= order.tp:
                            log_system(f"[{order.symbol}] Fast Scan: Pending SELL Limit hit TP before entry. Invalidating.")
                            if execution.cancel_order(order.ticket):
                                active_symbols.discard(order.symbol)

            # --- SLOW LOOP (Evaluates signals at 15M candle boundary) ---
            run_evaluation = False
            for symbol in config.SYMBOLS:
                symbol_with_suffix = symbol + config.SYMBOL_SUFFIX
                try:
                    # Fetch just the last 2 rates to check closed candle time
                    quick_df = data_feed.get_rates(symbol_with_suffix, config.LTF, 2)
                    if len(quick_df) >= 2:
                        closed_time = quick_df.iloc[-2].name
                        if last_candle_time != closed_time:
                            run_evaluation = True
                            last_candle_time = closed_time
                except Exception:
                    pass
            
            if run_evaluation or iterations is not None:
                log_system("New candle detected or startup: evaluating signals...")
                for symbol in config.SYMBOLS:
                    symbol_with_suffix = symbol + config.SYMBOL_SUFFIX
                    try:
                        df = data_feed.get_rates(symbol_with_suffix, config.LTF, 200)
                        htf_df = data_feed.get_rates(symbol_with_suffix, config.HTF, 50)
                        
                        df_signals = signal_engine.evaluate_signal(df, htf_df)
                        
                        if len(df_signals) < 2: continue
                        closed_candle = df_signals.iloc[-2]
                        candle_time_str = str(closed_candle.name)
                        
                        log_system(f"[{symbol_with_suffix}] Evaluated Closed Candle: {candle_time_str} | System Time: {datetime.now(timezone.utc).strftime('%H:%M:%S')} UTC")
                        
                        if closed_candle['signal_long'] or closed_candle['signal_short']:
                            direction = "LONG" if closed_candle['signal_long'] else "SHORT"
                            
                            last_fired = signal_history.get(symbol_with_suffix)
                            if last_fired == candle_time_str:
                                continue
                                
                            pseudo_positions = [{"symbol": sym} for sym in active_symbols]
                            if not risk_manager.check_exposure(pseudo_positions, symbol_with_suffix):
                                log_system(f"[{symbol_with_suffix}] Max exposure reached. Skipping {direction} signal.")
                                continue
                                
                            equity = mt5.account_info().equity
                            info = mt5.symbol_info(symbol_with_suffix)
                            
                            entry = closed_candle['entry_price']
                            swing_extreme = closed_candle['swing_extreme']
                            atr = closed_candle['atr']
                            
                            sl, tp = risk_manager.calculate_sl_tp(entry, swing_extreme, atr, direction, symbol_with_suffix)
                            sl_dist_pips = (abs(entry - sl) / info.point) / 10.0
                            
                            volume = risk_manager.calculate_position_size(
                                equity=equity, 
                                stop_distance_pips=sl_dist_pips, 
                                risk_pct=config.RISK_PER_TRADE_PCT, 
                                volume_step=info.volume_step, 
                                min_volume=info.volume_min
                            )
                            
                            log_signal({"symbol": symbol_with_suffix, "direction": direction, "entry": entry, "sl": sl, "volume": volume})
                            
                            success = execution.place_order(symbol_with_suffix, direction, volume, sl, tp, entry_price=entry)
                            if success:
                                signal_history[symbol_with_suffix] = candle_time_str
                                save_signal_history(signal_history)
                                active_symbols.add(symbol_with_suffix)
                                
                    except Exception as e:
                        log_system(f"Error processing {symbol_with_suffix}: {e}")
                        send_alert(f"Error processing {symbol_with_suffix}: {e}")
                
                if iterations is not None:
                    count += 1
            
            # Fast scan tick interval
            time.sleep(1)
            
    except KeyboardInterrupt:
        log_system("Live loop interrupted by user.")
        send_alert("Live loop interrupted by user.")
    finally:
        data_feed.shutdown_mt5()

if __name__ == "__main__":
    run_live_loop()
