import os
import sys
import config
import data_feed
import backtester
import signal_engine

# Temporarily disable the wick filter to get baseline trades
config.USE_REJECTION_WICK = False

def analyze_wick_ratios():
    data_feed.initialize_mt5()
    try:
        for symbol_base in config.SYMBOLS:
            symbol = symbol_base + config.SYMBOL_SUFFIX
            print(f'\n--- ANALYZING WICK RATIOS FOR {symbol} ---')
            
            df = data_feed.get_rates(symbol, config.LTF, 50000)
            split_idx = int(len(df) * 0.7)
            df_train = df.iloc[:split_idx]
            
            htf_df = data_feed.get_rates(symbol, config.HTF, 10000)
            
            # Evaluate signals
            df_eval = signal_engine.evaluate_signal(df_train, htf_df)
            
            # Find signals
            longs = df_eval[df_eval['signal_long'] == True]
            shorts = df_eval[df_eval['signal_short'] == True]
            
            print(f"Total Base Trades: {len(longs) + len(shorts)}")
            
            for i, (idx, row) in enumerate(longs.iterrows()):
                candle_range = row['high'] - row['low']
                lower_wick = min(row['open'], row['close']) - row['low']
                ratio = lower_wick / candle_range if candle_range > 0 else 0
                print(f"Trade {i+1} [LONG]: Candle {idx} Range: {candle_range:.5f}, Lower Wick: {lower_wick:.5f}, Ratio: {ratio:.2f}")
                
            for i, (idx, row) in enumerate(shorts.iterrows()):
                candle_range = row['high'] - row['low']
                upper_wick = row['high'] - max(row['open'], row['close'])
                ratio = upper_wick / candle_range if candle_range > 0 else 0
                print(f"Trade {len(longs)+i+1} [SHORT]: Candle {idx} Range: {candle_range:.5f}, Upper Wick: {upper_wick:.5f}, Ratio: {ratio:.2f}")
                
    finally:
        data_feed.shutdown_mt5()

if __name__ == '__main__':
    analyze_wick_ratios()
