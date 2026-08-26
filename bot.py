import os
import sys
import io
import time
from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from story_generator import generate_story
from image_generator import generate_all_images
from audio_generator import generate_all_audio
from programmatic_animator import generate_all_animations

load_dotenv(dotenv_path=".env.local")
load_dotenv(dotenv_path=".env", override=True)

def run_daily_automation():
    print("=====================================================")
    print("   AUTOMATED DAILY SENSORY VIDEO FACTORY STARTING   ")
    print("   Engine: DVD Bounce (Baby Dropzzz)                ")
    print("=====================================================")
    
    print("\n[Phase 1] Brainstorming Infinite Story Concepts...")
    num_scenes = 30
    story_data = generate_story(num_scenes=num_scenes)
    
    print("\n[Phase 2] Generating Transparent 4K Images from Prompts...")
    generate_all_images(story_data)
    
    print("\n[Phase 3] Recording Toddler Audio Exclamations...")
    generate_all_audio(story_data)
    
    # Generate boing sound effects
    from sfx_generator import generate_boing_sfx
    generate_boing_sfx()
    
    print("\n[Phase 4] Orchestrating DVD Bounce Animation...")
    output_file = "temp_assets/daily_sensory_video.mp4"
    final_video = generate_all_animations(story_data, output_file=output_file)
    
    if final_video and os.path.exists(final_video):
        print(f"\n[SUCCESS] Daily Video Created Successfully: {final_video}")
        
        # Extract vibrant thumbnail at 3 seconds
        print("\n[Phase 5] Extracting Custom Thumbnail...")
        from moviepy.editor import VideoFileClip
        thumb_path = "temp_assets/thumbnail.jpg"
        try:
            with VideoFileClip(final_video) as clip:
                clip.save_frame(thumb_path, t=3.0)
            print(f"[SUCCESS] Custom Thumbnail Created: {thumb_path}")
        except Exception as e:
            print(f"[WARNING] Failed to extract thumbnail: {e}")
            
        # from uploader import upload_to_youtube, upload_to_facebook
        # title = f"Baby Dropzzz Sensory Adventure! Fun Animations! #{int(time.time())}"
        # description = "Amazing visually stimulating sensory video for babies and toddlers! #sensory #babydropzzz #heybear"
        # upload_to_youtube(final_video, title, description)
        # upload_to_facebook(final_video, title, description)
        # print("Uploads complete!")
    else:
        print("\n[FAILED] Pipeline failed to produce a final video.")

if __name__ == "__main__":
    run_daily_automation()
