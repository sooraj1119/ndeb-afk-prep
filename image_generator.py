import os
import urllib.parse
import requests
import time
import numpy as np
from PIL import Image
import io

def remove_black_background(pil_image, threshold=30):
    """
    Converts a solid black (or near-black) background to transparent.
    Pixels darker than 'threshold' on all channels become fully transparent.
    """
    img_rgba = pil_image.convert("RGBA")
    data = np.array(img_rgba)

    # Create mask: pixels where R, G, B are ALL below threshold = background
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    black_mask = (r < threshold) & (g < threshold) & (b < threshold)

    # Set those pixels to fully transparent
    data[:,:,3] = np.where(black_mask, 0, 255)

    return Image.fromarray(data, 'RGBA')

def generate_all_images(story_data, output_dir="temp_assets"):
    print("--- Image Module: Generating 100% Free Sensory Images (Transparent BG) ---")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for scene in story_data:
        scene_num = scene['scene_number']
        prompt = scene.get('image_prompt', scene.get('video_prompt', ''))

        # Save as PNG to preserve transparency
        output_file = os.path.join(output_dir, f"scene_{scene_num}.png")
        
        print(f"Generating Scene {scene_num} Image...")
        print(f"Prompt: {prompt}")
        
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1080&height=1080&nologo=true"
        
        try:
            response = requests.get(url, timeout=60)
            if response.status_code == 200:
                # Open as PIL image
                pil_img = Image.open(io.BytesIO(response.content)).convert("RGB")
                
                # Remove the black background -> makes it transparent
                transparent_img = remove_black_background(pil_img, threshold=35)
                
                # Save as PNG to preserve alpha channel
                transparent_img.save(output_file, "PNG")
                print(f"Saved transparent sensory image to {output_file}")
            else:
                print(f"Failed to fetch image for Scene {scene_num}. Status Code: {response.status_code}")
                
            time.sleep(1)  # Prevent hammering the free API
        except Exception as e:
            print(f"Pollinations API Error on Scene {scene_num}: {e}")

if __name__ == "__main__":
    mock_data = [
        {"scene_number": 1, "image_prompt": "A cute glowing neon smiling apple, pitch black background, 3d render, cute kawaii style, thick outlines, solid black background"}
    ]
    generate_all_images(mock_data)
