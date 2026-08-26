import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
import data_feed
import backtester
import json
import csv

def dump_trades(trades, symbol, fvg_flag, split_name):
    if not trades:
        print(f'No trades to dump for {symbol} FVG={fvg_flag} ({split_name})')
        return
        
    filename = f'trade_log_{symbol}_FVG{fvg_flag}_{split_name}.csv'
    
    fieldnames = ['entry_time', 'direction', 'entry_price', 'sl', 'tp', 'exit_price', 'status']
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(trades)
    print(f'Dumped {len(trades)} trades to {filename}')

def run_holdout():
    data_feed.initialize_mt5()
    try:
        # Final Holdout Test: EURUSD only
        symbol = config.SYMBOLS[0] + config.SYMBOL_SUFFIX
        print(f'\n--- FINAL HOLDOUT (OUT-OF-SAMPLE) TEST FOR {symbol} ---')
        
        df = data_feed.get_rates(symbol, config.LTF, 50000)
        split_idx = int(len(df) * 0.7)
        df_test = df.iloc[split_idx:]
        
        htf_df = data_feed.get_rates(symbol, config.HTF, 10000)
        
        print(f'Data: Test (Out-of-Sample): {len(df_test)} bars. Start Date: {df_test.index[0]}')
        
        config.USE_FVG = False
        res, trades = backtester.run_backtest(df_test, symbol, htf_df)
        print(json.dumps(res, indent=4))
        dump_trades(trades, symbol, 'False', 'TEST')
        
    finally:
        data_feed.shutdown_mt5()

if __name__ == '__main__':
    run_holdout()
