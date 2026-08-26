import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from structure import detect_structure_shift

data2 = {
    'high': [10, 11, 10, 12, 10, 9, 14, 13, 12, 11, 15, 14, 13], 
    'low':  [ 8,  9,  8, 10,  8, 7, 12, 11, 10,  9, 13, 12, 11],
    'close':[ 9, 10,  9, 11,  9, 8, 13, 12, 11, 10, 14, 13, 12]
}
df = pd.DataFrame(data2)
res = detect_structure_shift(df)
print(res[['high', 'low', 'close', 'swing_high', 'swing_low', 'CHoCH_bullish', 'BOS_bullish']])
