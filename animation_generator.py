import os
import requests
from dotenv import load_dotenv
import replicate
import time

def generate_all_animations(story_data, output_dir="temp_assets"):
    print("--- Animation Module: Generating Seamless Video via Replicate ---")
    
    load_dotenv(dotenv_path=".env.local")
    load_dotenv(dotenv_path=".env", override=True)
    
    replicate_api_token = os.getenv("REPLICATE_API_TOKEN")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    if not replicate_api_token:
        print("WARNING: REPLICATE_API_TOKEN not found in .env!")
        print("Mocking animation generation for testing purposes...")
        for scene in story_data:
            scene_num = scene['scene_number']
            output_file = os.path.join(output_dir, f"scene_{scene_num}.mp4")
            # Create a blank/dummy file to simulate output
            with open(output_file, 'wb') as f:
                f.write(b"MOCK_VIDEO_DATA")
            print(f"Mocked rendering for Scene {scene_num}: {output_file}")
        return

    # Real Generation Logic
    # Using an open-source text-to-video model on Replicate (e.g. zeroscope or damo)
    # Model: cjwbw/damo-text-to-video:1e205ea73084bd17a0a3b43396e49ba0d6bc2e754e9283b2df49fad2dcf95755
    model_id = "cjwbw/damo-text-to-video:1e205ea73084bd17a0a3b43396e49ba0d6bc2e754e9283b2df49fad2dcf95755"

    for scene in story_data:
        scene_num = scene['scene_number']
        prompt = scene['video_prompt']
        output_file = os.path.join(output_dir, f"scene_{scene_num}.mp4")
        
        print(f"Generating Scene {scene_num} via Replicate...")
        print(f"Prompt: {prompt}")
        
        try:
            output = replicate.run(
                model_id,
                input={"prompt": prompt, "num_frames": 24, "fps": 8}
            )
            # output is a URL to the mp4
            video_url = output
            print(f"Downloading from {video_url}...")
            r = requests.get(video_url)
            with open(output_file, 'wb') as f:
                f.write(r.content)
            print(f"Saved seamless video to {output_file}")
            
            # Rate limit safety
            time.sleep(2)
        except Exception as e:
            print(f"Replicate API Error on Scene {scene_num}: {e}")

if __name__ == "__main__":
    mock_data = [
        {"scene_number": 1, "video_prompt": "3D Pixar animation style, highly vibrant colors, 16:9 widescreen, seamless motion. A cute baby plays with a toy."},
    ]
    generate_all_animations(mock_data)
