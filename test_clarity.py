import os
from search_downloader import get_latest_fifa_video, download_video
from video_processor import process_to_shorts

def test_clarity():
    print("Fetching video...")
    vid = get_latest_fifa_video()
    if not vid:
        print("No new videos found.")
        return
        
    print(f"Found: {vid['title']}")
    raw_path = "test_raw.mp4"
    if os.path.exists(raw_path):
        os.remove(raw_path)
        
    print("Downloading...")
    download_video(vid['url'], raw_path)
    
    print("Rendering 15-second ultra-sharp clip...")
    output_path = "test_sharp.mp4"
    if os.path.exists(output_path):
        os.remove(output_path)
        
    process_to_shorts(raw_path, output_path, 180, 15)
    print(f"Done! Open {output_path} to see the clarity.")

if __name__ == '__main__':
    test_clarity()
