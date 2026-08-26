"""
Logging module with Webhook alerting.
"""
import json
import urllib.request
from datetime import datetime, timezone
import config

def log_system(msg):
    time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{time_str}] [SYSTEM] {msg}")

def log_signal(signal_info):
    time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{time_str}] [SIGNAL] {json.dumps(signal_info)}")

def log_trade(trade_info):
    time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{time_str}] [TRADE] {json.dumps(trade_info)}")
    send_alert(f"TRADE EXECUTED: {json.dumps(trade_info)}")

def send_alert(message: str):
    """
    Dispatches a webhook payload (e.g. to Discord).
    Wrapped in a tight try/except so network failures never crash the bot.
    """
    webhook_url = getattr(config, "DISCORD_WEBHOOK_URL", None)
    if not webhook_url or webhook_url == "":
        return
        
    try:
        data = json.dumps({"content": f"[Antigravity MT5 Bot] {message}"}).encode('utf-8')
        req = urllib.request.Request(webhook_url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        # 5 second timeout to prevent hanging the shutdown sequence
        with urllib.request.urlopen(req, timeout=5) as response:
            pass
    except Exception as e:
        print(f"Failed to send webhook alert: {e}")
