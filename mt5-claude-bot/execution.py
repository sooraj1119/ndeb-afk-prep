"""
Execution module.
Order placement, modification, MT5 trade management.
"""
import config
from logger import log_trade
import MetaTrader5 as mt5
import time

def cancel_order(ticket):
    """
    Cancels a pending order given its ticket number.
    """
    request = {
        "action": mt5.TRADE_ACTION_REMOVE,
        "order": ticket,
        "magic": config.MAGIC_NUMBER,
        "comment": "Antigravity Cancel",
    }
    
    result = mt5.order_send(request)
    if result and result.retcode == mt5.TRADE_RETCODE_DONE:
        print(f"Successfully cancelled pending order #{ticket}")
        return True
    else:
        err = result.retcode if result else mt5.last_error()[0]
        print(f"Failed to cancel order #{ticket}. Error: {err}")
        return False

def place_order(symbol, action, volume, sl, tp, max_retries=3, entry_price=None):
    """
    Sends LIMIT order to broker with a 150-minute (10-candle) expiration.
    """
    symbol_with_suffix = symbol + config.SYMBOL_SUFFIX
    
    if config.DEMO_MODE:
        msg = f"[DRY RUN] LIMIT {action} {symbol_with_suffix} | Vol: {volume} | Entry: {entry_price} | SL: {sl} | TP: {tp} | MAGIC: {config.MAGIC_NUMBER}"
        print(msg)
        log_trade({"symbol": symbol_with_suffix, "action": action, "volume": volume, "entry": entry_price, "sl": sl, "tp": tp, "status": "DEMO_SUCCESS"})
        return True
        
    print(f"Placing LIVE LIMIT {action} order for {symbol_with_suffix} with MAGIC: {config.MAGIC_NUMBER}")
    
    order_type = mt5.ORDER_TYPE_BUY_LIMIT if action == "LONG" else mt5.ORDER_TYPE_SELL_LIMIT
    
    # Expiration: 10 candles on 15M = 150 minutes = 9000 seconds
    expiration_ts = int(time.time()) + 9000
    
    request = {
        "action": mt5.TRADE_ACTION_PENDING,
        "symbol": symbol_with_suffix,
        "volume": float(volume),
        "type": order_type,
        "price": float(entry_price),
        "sl": float(sl),
        "tp": float(tp),
        "magic": config.MAGIC_NUMBER,
        "comment": "Antigravity MT5 Bot",
        "type_time": mt5.ORDER_TIME_SPECIFIED,
        "expiration": expiration_ts,
        "type_filling": mt5.ORDER_FILLING_FOK if (mt5.symbol_info(symbol_with_suffix).filling_mode & 1) else mt5.ORDER_FILLING_IOC,
    }
    
    TRANSIENT_ERRORS = {
        mt5.TRADE_RETCODE_REQUOTE,
        mt5.TRADE_RETCODE_REJECT,
        mt5.TRADE_RETCODE_PRICE_CHANGED,
        mt5.TRADE_RETCODE_PRICE_OFF,
        mt5.TRADE_RETCODE_CONNECTION,
        mt5.TRADE_RETCODE_TIMEOUT
    }
    
    retries = 0
    while retries < max_retries:
        result = mt5.order_send(request)
        if result and result.retcode == mt5.TRADE_RETCODE_DONE:
            log_trade({
                "symbol": symbol_with_suffix, 
                "action": action, 
                "volume": volume, 
                "entry": entry_price,
                "sl": sl, 
                "tp": tp, 
                "status": "LIVE_SUCCESS",
                "ticket": result.order
            })
            return True
        else:
            err = result.retcode if result else mt5.last_error()[0]
            if err in TRANSIENT_ERRORS:
                print(f"Transient order failure, retrying... (Error: {err})")
                retries += 1
                time.sleep(1)
            else:
                print(f"Hard order failure. Abandoning trade. (Error: {err})")
                return False
                
    print(f"FAILED TO PLACE {action} LIMIT ORDER after {max_retries} retries.")
    return False
