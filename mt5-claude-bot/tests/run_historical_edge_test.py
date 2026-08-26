import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
import data_feed
import backtester
import json
import csv

def dump_trades(trades, symbol, fvg_flag):
    if not trades:
        print(f'No trades to dump for {symbol} FVG={fvg_flag}')
        return
        
    filename = f'trade_log_{symbol}_FVG{fvg_flag}.csv'
    
    # Ensure keys are unified based on the returned trade dictionary
    fieldnames = ['entry_time', 'direction', 'entry_price', 'sl', 'tp', 'exit_price', 'status']
    
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(trades)
    print(f'Dumped {len(trades)} trades to {filename}')

def test_edge():
    data_feed.initialize_mt5()
    
    try:
        test_symbols = [config.SYMBOLS[0], 'GBPUSD']
        
        for symbol_base in test_symbols:
            symbol = symbol_base + config.SYMBOL_SUFFIX
            print(f'\nFetching max historical 15M data for {symbol}...')
            df = data_feed.get_rates(symbol, config.LTF, 50000)
            print(f'Fetched {len(df)} bars. Earliest date: {df.index[0]}\n')
            
            # SPLIT DATA 70/30 (chronological)
            split_idx = int(len(df) * 0.7)
            df_train = df.iloc[:split_idx]
            df_test = df.iloc[split_idx:]
            print(f'Data split: Train (In-Sample): {len(df_train)} bars, Test (Out-of-Sample): {len(df_test)} bars')
            
            print(f'Fetching max historical H4 data for {symbol}...')
            htf_df = data_feed.get_rates(symbol, config.HTF, 10000)
            print(f'Fetched {len(htf_df)} H4 bars.')
            
            # Test FVG OFF (Core Edge)
            print(f'--- RUNNING EDGE TEST (FVG OFF) FOR {symbol} ---')
            config.USE_FVG = False
            res_no_fvg, trades_no_fvg = backtester.run_backtest(df_train, symbol, htf_df)
            print(json.dumps(res_no_fvg, indent=4))
            dump_trades(trades_no_fvg, symbol, 'False')
            
            # Test FVG ON (Hyper-Selective)
            print(f'\n--- RUNNING EDGE TEST (FVG ON) FOR {symbol} ---')
            config.USE_FVG = True
            res_fvg, trades_fvg = backtester.run_backtest(df_train, symbol, htf_df)
            print(json.dumps(res_fvg, indent=4))
            dump_trades(trades_fvg, symbol, 'True')
            
    finally:
        data_feed.shutdown_mt5()

if __name__ == '__main__':
    test_edge()
