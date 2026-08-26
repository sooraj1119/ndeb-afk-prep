"""
Simple SMC Multi-Level Liquidity Hunt Bot
==========================================
Hunts liquidity across 4 tiers simultaneously:
  Tier 1 (Highest): Previous Week High/Low (PWH/PWL)
  Tier 2:           Previous Day High/Low  (PDH/PDL)
  Tier 3:           Classic Pivot Points   (PP, R1/R2, S1/S2)
  Tier 4 (Lowest):  Swing Highs/Lows      (H4 fractal swing points)

Signal: Any 15M candle that wicks beyond a level and closes back inside it.
Entry:  Market order on next second's tick after sweep confirmed.
Tier priority: Week > Day > Pivot > Swing (only 1 trade per sweep event).
"""

import os
import sys
import time
import json
import MetaTrader5 as mt5
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

MT5_ACCOUNT     = int(os.getenv("MT5_ACCOUNT"))
MT5_PASSWORD    = os.getenv("MT5_PASSWORD")
MT5_SERVER      = os.getenv("MT5_SERVER")
MT5_PATH        = os.getenv("MT5_TERMINAL_PATH", "").strip('"')

SYMBOLS         = ["EURUSD", "GBPUSD"]
RISK_PCT        = 1.0
SL_BUFFER_PIPS  = 2
RR_RATIO        = 2.0
MAGIC           = 654321
LTF             = mt5.TIMEFRAME_M15
TOLERANCE_PIPS  = 2     # How close to a level a wick must be to count as a sweep

# ── Logging ───────────────────────────────────────────────────────────────────
def log(msg):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)

# ── MT5 Helpers ───────────────────────────────────────────────────────────────
def connect():
    if not mt5.initialize(path=MT5_PATH, login=MT5_ACCOUNT,
                          password=MT5_PASSWORD, server=MT5_SERVER):
        raise ConnectionError(f"MT5 init failed: {mt5.last_error()}")
    for sym in SYMBOLS:
        mt5.symbol_select(sym, True)
    log(f"Connected -- Account: {MT5_ACCOUNT} on {MT5_SERVER}")

def disconnect():
    mt5.shutdown()
    log("Disconnected.")

def get_ohlc(symbol, timeframe, n):
    rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, n)
    if rates is None or len(rates) == 0:
        return None
    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s', utc=True)
    df.set_index('time', inplace=True)
    return df

# ── Liquidity Level Builder ───────────────────────────────────────────────────
def build_liquidity_levels(symbol):
    """
    Returns a list of dicts:
      { 'price': float, 'tier': int, 'label': str, 'side': 'high'|'low' }
    Tier 1 = most important (weekly), Tier 4 = least (swing)
    """
    levels = []
    info = mt5.symbol_info(symbol)
    if info is None:
        return levels, {}
    pip = info.point * 10

    # ── Tier 1: Previous Week High/Low ────────────────────────────────────────
    weekly = get_ohlc(symbol, mt5.TIMEFRAME_W1, 3)
    if weekly is not None and len(weekly) >= 2:
        pwh = weekly['high'].iloc[-2]
        pwl = weekly['low'].iloc[-2]
        levels.append({'price': pwh, 'tier': 1, 'label': 'PWH', 'side': 'high'})
        levels.append({'price': pwl, 'tier': 1, 'label': 'PWL', 'side': 'low'})
        log(f"[{symbol}] Tier1 PWH={pwh:.5f}  PWL={pwl:.5f}")

    # ── Tier 2: Previous Day High/Low ─────────────────────────────────────────
    daily = get_ohlc(symbol, mt5.TIMEFRAME_D1, 3)
    if daily is not None and len(daily) >= 2:
        pdh = daily['high'].iloc[-2]
        pdl = daily['low'].iloc[-2]
        prev_o = daily['open'].iloc[-2]
        prev_c = daily['close'].iloc[-2]
        levels.append({'price': pdh, 'tier': 2, 'label': 'PDH', 'side': 'high'})
        levels.append({'price': pdl, 'tier': 2, 'label': 'PDL', 'side': 'low'})
        log(f"[{symbol}] Tier2 PDH={pdh:.5f}  PDL={pdl:.5f}")

        # ── Tier 3: Classic Daily Pivot Points ────────────────────────────────
        pp = (pdh + pdl + prev_c) / 3
        r1 = 2 * pp - pdl
        r2 = pp + (pdh - pdl)
        s1 = 2 * pp - pdh
        s2 = pp - (pdh - pdl)
        for label, price, side in [
            ('PP',  pp, 'neutral'),
            ('R1',  r1, 'high'),
            ('R2',  r2, 'high'),
            ('S1',  s1, 'low'),
            ('S2',  s2, 'low'),
        ]:
            levels.append({'price': price, 'tier': 3, 'label': label, 'side': side})
        log(f"[{symbol}] Tier3 PP={pp:.5f}  R1={r1:.5f}  R2={r2:.5f}  S1={s1:.5f}  S2={s2:.5f}")

    # ── Tier 4: H4 Swings (DISABLED - Negative Expectancy) ───────────────
    h4 = get_ohlc(symbol, mt5.TIMEFRAME_H4, 100)
    if h4 is not None and len(h4) >= 5:
        pass

    # ── Quad Equilibrium (W1, D1, H4, M15) + Daily PP ──────────────
    eqs = {}
    
    w1 = get_ohlc(symbol, mt5.TIMEFRAME_W1, 20)
    if w1 is not None and len(w1) >= 5:
        eqs['W1'] = (w1['high'].iloc[:-1].max() + w1['low'].iloc[:-1].min()) / 2
        
    d1 = get_ohlc(symbol, mt5.TIMEFRAME_D1, 20)
    if d1 is not None and len(d1) >= 5:
        eqs['D1'] = (d1['high'].iloc[:-1].max() + d1['low'].iloc[:-1].min()) / 2
        # Also store Daily PP for directional bias
        pdh, pdl, p_close = d1['high'].iloc[-2], d1['low'].iloc[-2], d1['close'].iloc[-2]
        eqs['PP'] = (pdh + pdl + p_close) / 3
        
    if h4 is not None and len(h4) >= 5:
        eqs['H4'] = (h4['high'].iloc[-20:].max() + h4['low'].iloc[-20:].min()) / 2
        
    m15 = get_ohlc(symbol, mt5.TIMEFRAME_M15, 100)
    if m15 is not None and len(m15) >= 5:
        eqs['M15'] = (m15['high'].iloc[:-1].max() + m15['low'].iloc[:-1].min()) / 2
        
    if len(eqs) == 5:
        log(f"[{symbol}] Macro EQ Mapped -- W1:{eqs['W1']:.5f} | D1:{eqs['D1']:.5f} | H4:{eqs['H4']:.5f} | M15:{eqs['M15']:.5f} | PP:{eqs['PP']:.5f}")

    return levels, eqs

# ── Sweep Detector ────────────────────────────────────────────────────────────
def detect_sweep_against_levels(candle, active_levels, pip_size, zone, tolerance_pips=1.0):
    best = None
    tolerance = tolerance_pips * pip_size
    for lvl in active_levels:
        price = lvl['price']
        tier = lvl['tier']
        # LONG: Wick drops AT LEAST `tolerance` below the level
        if zone == "MACRO DISCOUNT" and candle['open'] > price and candle['close'] > price and candle['low'] < (price - tolerance):
            if best is None or tier < best[0]:
                best = (tier, 'LONG', lvl)
        # SHORT: Wick rises AT LEAST `tolerance` above the level
        if zone == "MACRO PREMIUM" and candle['open'] < price and candle['close'] < price and candle['high'] > (price + tolerance):
            if best is None or tier < best[0]:
                best = (tier, 'SHORT', lvl)
    return best

def calc_lot(symbol, sl_dist_price):
    info = mt5.symbol_info(symbol)
    acc  = mt5.account_info()
    if info is None or acc is None:
        return info.volume_min if info else 0.01

    risk_money = acc.equity * (RISK_PCT / 100.0)
    
    # Calculate SL distance in terms of ticks
    ticks_at_risk = sl_dist_price / info.trade_tick_size
    
    # Value lost per lot if SL is hit
    money_at_risk_per_lot = ticks_at_risk * info.trade_tick_value
    
    if money_at_risk_per_lot <= 0:
        return info.volume_min
        
    lot = risk_money / money_at_risk_per_lot
    
    # Normalize to broker constraints
    lot = round(lot / info.volume_step) * info.volume_step
    return max(info.volume_min, min(info.volume_max, lot))

# ── Order Execution ───────────────────────────────────────────────────────────
def place_order(symbol, direction, sl_price):
    info = mt5.symbol_info(symbol)
    tick = mt5.symbol_info_tick(symbol)
    if info is None or tick is None:
        return False, 0.0

    pip = info.point * 10

    if direction == 'LONG':
        order_type = mt5.ORDER_TYPE_BUY
        price      = tick.ask
        sl         = round(sl_price, info.digits)
        sl_dist    = price - sl
        if sl_dist <= 0:
            log(f"[{symbol}] LONG SL above entry price -- skipping.")
            return False, 0.0
    else:
        order_type = mt5.ORDER_TYPE_SELL
        price      = tick.bid
        sl         = round(sl_price, info.digits)
        sl_dist    = sl - price
        if sl_dist <= 0:
            log(f"[{symbol}] SHORT SL below entry price -- skipping.")
            return False, 0.0

    lot = calc_lot(symbol, sl_dist)
    if lot == 0.0:
        return False, 0.0

    request = {
        "action":       mt5.TRADE_ACTION_DEAL,
        "symbol":       symbol,
        "volume":       lot,
        "type":         order_type,
        "price":        price,
        "sl":           sl,
        "tp":           0.0, # NO HARD TP, Trailing SL enabled
        "deviation":    10,
        "magic":        MAGIC,
        "comment":      "SMC-LiqHunt",
        "type_time":    mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_FOK,
    }

    result = mt5.order_send(request)
    if result is None:
        log(f"[{symbol}] ORDER FAILED -- mt5.order_send returned None")
        return False, 0.0
    if result.retcode == mt5.TRADE_RETCODE_DONE:
        log(f"[{symbol}] ORDER FILLED: {direction} | Lot:{lot} | Entry:{price:.5f} | SL:{sl:.5f} | TP:NONE (Trailing)")
        return True, float(sl_dist)
    else:
        log(f"[{symbol}] ORDER FAILED -- retcode:{result.retcode} | {result.comment}")
        return False, 0.0

# ── Daily State ───────────────────────────────────────────────────────────────
def load_state():
    path = "liq_bot_state.json"
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}

def save_state(state):
    with open("liq_bot_state.json", "w") as f:
        json.dump(state, f, indent=2)


# ── Trade Management (Trailing SL) ────────────────────────────────────────────
def manage_positions(state):
    import math
    positions = mt5.positions_get()
    if not positions:
        return
        
    for pos in positions:
        if pos.magic != MAGIC:
            continue
            
        sym = pos.symbol
        sym_state = state.get(sym, {})
        one_r = sym_state.get('active_1r')
        
        if not one_r or one_r <= 0:
            continue
            
        info = mt5.symbol_info(sym)
        tick = mt5.symbol_info_tick(sym)
        if info is None or tick is None:
            continue
            
        current_price = tick.bid if pos.type == mt5.ORDER_TYPE_BUY else tick.ask
        
        if pos.type == mt5.ORDER_TYPE_BUY:
            current_r = (current_price - pos.price_open) / one_r
        else:
            current_r = (pos.price_open - current_price) / one_r
            
        locked_r = math.floor(current_r) - 1
        
        if locked_r >= 1:
            # We have at least 2R profit, meaning locked_r is >= 1
            if pos.type == mt5.ORDER_TYPE_BUY:
                new_sl = pos.price_open + (locked_r * one_r)
                new_sl = round(new_sl, info.digits)
                if pos.sl == 0.0 or new_sl > pos.sl:
                    _modify_sl(pos.ticket, sym, new_sl, pos.tp)
            else:
                new_sl = pos.price_open - (locked_r * one_r)
                new_sl = round(new_sl, info.digits)
                if pos.sl == 0.0 or new_sl < pos.sl:
                    _modify_sl(pos.ticket, sym, new_sl, pos.tp)

def _modify_sl(ticket, symbol, new_sl, pos_tp):
    request = {
        "action": mt5.TRADE_ACTION_SLTP,
        "position": ticket,
        "symbol": symbol,
        "sl": new_sl,
        "tp": pos_tp
    }
    res = mt5.order_send(request)
    if res is None:
        log(f"[{symbol}] Trailing SL update FAILED -- mt5.order_send returned None")
        return
    if res.retcode == mt5.TRADE_RETCODE_DONE:
        log(f"[{symbol}] Trailing SL updated to {new_sl:.5f} for ticket {ticket}")

# ── Main Loop ─────────────────────────────────────────────────────────────────
def run():
    connect()
    log("Multi-Level SMC Liquidity Hunt Bot started.")
    log("Tiers: Week > Day > Pivot > H4 Swing")

    state        = load_state()   # { symbol: { last_candle, traded_levels: [] } }
    levels_cache = {}             # { symbol: levels[] }
    eq_cache     = {}             # { symbol: equilibrium_price }
    
    try:
        while True:
            now = datetime.now(timezone.utc)
            try:
                manage_positions(state) # Trailing SL tick check
            except Exception as e:
                log(f"Manage positions error: {e}")

            for sym in SYMBOLS:
                try:
                    sym_state = state.setdefault(sym, {})
                    
                    # Broker-Synchronized Daily Rebuild
                    d1_df = get_ohlc(sym, mt5.TIMEFRAME_D1, 1)
                    if d1_df is not None and len(d1_df) >= 1:
                        broker_day_str = str(d1_df.index[-1])
                        if sym not in levels_cache or sym_state.get('last_rebuild_day') != broker_day_str:
                            log(f"[{sym}] New Broker Day ({broker_day_str}). Rebuilding levels...")
                            try:
                                levels, eqs = build_liquidity_levels(sym)
                                levels_cache[sym] = levels
                                eq_cache[sym] = eqs
                                log(f"[{sym}] Total levels mapped: {len(levels)}")
                                sym_state['last_rebuild_day'] = broker_day_str
                                sym_state['traded_levels'] = []
                                save_state(state)
                            except Exception as e:
                                log(f"[{sym}] Level build error: {e}")

                    df = get_ohlc(sym, LTF, 3)
                    if df is None or len(df) < 2:
                        continue

                    closed_time = str(df.index[-2])
                    sym_state   = state.setdefault(sym, {})

                    # Skip if we already processed this candle
                    if sym_state.get('last_candle') == closed_time:
                        continue
                    sym_state['last_candle'] = closed_time

                    # Skip if position already open for this symbol
                    positions = mt5.positions_get(symbol=sym)
                    if positions and any(p.magic == MAGIC for p in positions):
                        continue

                    candle = df.iloc[-2]
                    levels = levels_cache.get(sym, [])
                    if not levels:
                        continue

                    info = mt5.symbol_info(sym)
                    pip  = info.point * 10

                    # Macro Trend & Pivot Bias Filter (4-Tier Fractal Alignment)
                    eqs = eq_cache.get(sym, {})
                    w1_eq = eqs.get('W1')
                    d1_eq = eqs.get('D1')
                    h4_eq = eqs.get('H4')
                    m15_eq = eqs.get('M15')
                    pp = eqs.get('PP')
                    
                    current_price = candle['close']
                    
                    if None in (w1_eq, d1_eq, h4_eq, m15_eq, pp):
                        log(f"[{sym}] Missing EQ data. Skipping cycle.")
                        continue
                        
                    if True: # Kept for indentation
                        # Price must be above ALL levels for Full Premium
                        all_prem = (current_price > w1_eq and current_price > d1_eq and 
                                    current_price > h4_eq and current_price > m15_eq and 
                                    current_price > pp)
                                    
                        # Price must be below ALL levels for Full Discount
                        all_disc = (current_price < w1_eq and current_price < d1_eq and 
                                    current_price < h4_eq and current_price < m15_eq and 
                                    current_price < pp)
                        
                        zone = "CONFLICT"
                        if all_prem:
                            zone = "MACRO PREMIUM"
                        elif all_disc:
                            zone = "MACRO DISCOUNT"
                            
                        filtered_levels = []
                        if zone == "MACRO PREMIUM":
                            for lvl in levels:
                                if lvl['side'] in ('high', 'neutral'):
                                    filtered_levels.append(lvl) # SHORT from premium
                        elif zone == "MACRO DISCOUNT":
                            for lvl in levels:
                                if lvl['side'] in ('low', 'neutral'):
                                    filtered_levels.append(lvl) # LONG from discount
                                    
                        if not filtered_levels:
                            continue
                        log(f"[{sym}] {zone} Aligned (price={current_price:.5f}) | Active levels: {len(filtered_levels)}")
                        levels = filtered_levels

                    result = detect_sweep_against_levels(candle, levels, pip, zone, TOLERANCE_PIPS)
                    if result is None:
                        continue

                    tier, direction, lvl = result
                    level_key = f"{lvl['label']}_{round(lvl['price'], 5)}"

                    # Don't re-trade the same level within the same day
                    traded_today = sym_state.get('traded_levels', [])
                    if level_key in traded_today:
                        continue

                    log(f"[{sym}] SWEEP DETECTED -- Tier{tier} {lvl['label']} @ {lvl['price']:.5f} | Direction: {direction}")

                    # SL anchored to the structural wick extreme of the sweep candle
                    # This is the PRICE at which the setup is invalidated, not a pip count
                    buf = SL_BUFFER_PIPS * pip
                    if direction == 'LONG':
                        sl_price = candle['low'] - buf   # below the wick low
                    else:
                        sl_price = candle['high'] + buf  # above the wick high

                    success, risk_dist = place_order(sym, direction, sl_price)
                    if success:
                        traded_today.append(level_key)
                        sym_state['traded_levels'] = traded_today
                        sym_state['active_1r'] = risk_dist
                        save_state(state)

                except Exception as e:
                    log(f"[{sym}] Loop error: {e}")

            time.sleep(1)

    except KeyboardInterrupt:
        log("Bot stopped by user.")
    finally:
        disconnect()

if __name__ == "__main__":
    run()
