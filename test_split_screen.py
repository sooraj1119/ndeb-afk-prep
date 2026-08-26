import os
import sys
import io
from search_downloader import get_latest_fifa_video, download_video
from video_processor import process_to_shorts, get_top_replayed_timestamps

# Force UTF-8 encoding for terminal output to support emojis in YouTube titles
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def test_split_screen():
    print("Fetching video to test new Split-Screen format...")
    vid = get_latest_fifa_video()
    if not vid:
        print("No new videos found.")
        return
        
    print(f"Found: {vid['title']}")
    raw_path = "test_raw2.mp4"
    
    if not os.path.exists(raw_path):
        print("Fetching heatmap data to find the most viral moment...")
        start_times = get_top_replayed_timestamps(vid['id'], duration=10, num_clips=1, min_distance=60)
        best_start_time = start_times[0] if start_times else 180
        print(f"Found viral peak! Slicing exactly at {best_start_time}s...")
        
        print("Downloading...")
        download_video(vid['url'], raw_path)
    else:
        print("Using cached raw video...")
        best_start_time = 180
    
    print("Rendering 10-second Split-Screen test clip...")
    output_path = "test_splitscreen2.mp4"
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except:
            pass
        
    process_to_shorts(raw_path, output_path, best_start_time, 10)
    print(f"Done! Open {output_path} to see the new layout!")

if __name__ == '__main__':
    test_split_screen()
