import yt_dlp
import json

ydl_opts = {
    'quiet': True,
    'extract_flat': False,
}

url = "https://www.youtube.com/watch?v=2YZxC2Rmr8M"  # The video we just downloaded
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(url, download=False)
    
    if 'heatmap' in info:
        print("Heatmap found!")
        heatmap = info['heatmap']
        # Print top 5 highest points
        sorted_heatmap = sorted(heatmap, key=lambda x: x['value'], reverse=True)
        print("Top 5 most replayed segments:")
        for h in sorted_heatmap[:5]:
            print(f"Start: {h['start_time']}s, Value: {h['value']}")
    else:
        print("No heatmap data available for this video.")
