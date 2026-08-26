import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import MetaTrader5 as mt5
import pandas as pd
from data_feed import initialize_mt5
import config

print(f"Trying to connect with {config.MT5_ACCOUNT} / {config.MT5_SERVER}")
initialize_mt5()
rates = mt5.copy_rates_from_pos('EURUSD', mt5.TIMEFRAME_M15, 0, 100000)
if rates is not None:
    print(f'Max 15M bars fetched: {len(rates)}')
    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s')
    print(f'Earliest date: {df.time.iloc[0]}')
else:
    print('Failed to fetch rates')
mt5.shutdown()
