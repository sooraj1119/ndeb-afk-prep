"""
Liquidity module.
Detects sweeps (equal highs/lows, PDH/PDL, session extremes).
"""
import pandas as pd
import numpy as np
from zoneinfo import ZoneInfo
import config

def calculate_pdh_pdl(df):
    """
    Previous Day High / Previous Day Low
    Uses zoneinfo to perfectly align daily boundaries to 17:00 NY time, 
    accounting for all DST changes automatically.
    """
    if not isinstance(df.index, pd.DatetimeIndex):
        df['PDH'] = np.nan
        df['PDL'] = np.nan
        return df
        
    df = df.copy()
    
    # 1. Localize/Convert to Broker Time, then to NY Time
    if df.index.tz is None:
        broker_tz = ZoneInfo(config.BROKER_TIMEZONE)
        df_tz = df.tz_localize(broker_tz)
    else:
        df_tz = df
        
    ny_tz = ZoneInfo("America/New_York")
    df_ny = df_tz.tz_convert(ny_tz)
    
    # 2. Shift NY time back by 17 hours so the Forex Rollover (17:00) maps to midnight
    shifted_index = df_ny.index - pd.Timedelta(hours=17)
    
    # 3. Resample using the shifted "Forex Date"
    temp_df = pd.DataFrame({'high': df_ny['high'], 'low': df_ny['low']}, index=shifted_index)
    daily_data = temp_df.resample('D').agg({'high': 'max', 'low': 'min'})
    
    daily_data['PDH'] = daily_data['high'].shift(1)
    daily_data['PDL'] = daily_data['low'].shift(1)
    
    # 4. Map the calculated PDH/PDL back to the intraday rows using the shifted index date
    df['PDH'] = shifted_index.floor('D').map(daily_data['PDH']).values
    df['PDL'] = shifted_index.floor('D').map(daily_data['PDL']).values
    
    return df

def sweep_detected(df, lookback=5):
    """
    Detects if a liquidity sweep occurred.
    """
    df = calculate_pdh_pdl(df)
    df['liquidity_sweep_bullish'] = False
    df['liquidity_sweep_bearish'] = False
    
    if 'PDH' in df.columns and 'PDL' in df.columns:
        for i in range(1, len(df)):
            if pd.isna(df['PDH'].iloc[i]) or pd.isna(df['PDL'].iloc[i]):
                continue
                
            # Bearish sweep: price pierced PDH but closed below it
            if df['high'].iloc[i] > df['PDH'].iloc[i] and df['close'].iloc[i] < df['PDH'].iloc[i]:
                df.loc[df.index[i], 'liquidity_sweep_bearish'] = True
                
            # Bullish sweep: price pierced PDL but closed above it
            if df['low'].iloc[i] < df['PDL'].iloc[i] and df['close'].iloc[i] > df['PDL'].iloc[i]:
                df.loc[df.index[i], 'liquidity_sweep_bullish'] = True
                
    return df
