import os
import sys
import time

from story_generator import generate_story
from image_generator import generate_all_images
from audio_generator import generate_all_audio
from programmatic_animator import generate_all_animations
from sfx_generator import generate_boing_sfx

def run_5min_trial():
    print("=========================================================")
    print("   Baby Dropzzz: Generating 5-Minute (300s) Trial Video  ")
    print("=========================================================")
    start_t = time.time()

    # Generate 10 cute sensory characters to cycle through across the 5 minutes
    story_data = generate_story(num_scenes=10)

    if not os.path.exists("temp_assets/scene_10.png"):
        print("\n[1/4] Generating Transparent Sensory Characters...")
        generate_all_images(story_data)
    else:
        print("\n[1/4] Using existing 10 sensory characters from temp_assets/...")

    if not os.path.exists("temp_assets/scene_10.mp3"):
        print("\n[2/4] Generating Spoken Names & Exclamations...")
        generate_all_audio(story_data)
    else:
        print("\n[2/4] Using existing spoken audio clips...")

    if not os.path.exists("temp_assets/boing.wav"):
        print("\n[3/4] Generating Boing SFX...")
        generate_boing_sfx()
    else:
        print("\n[3/4] Using existing Boing SFX...")

    out_path = r"C:\Users\sooraj\.gemini\antigravity\brain\2f129b31-61eb-42de-8c67-ce63650f9f84\scratch\baby_dropzzz_5min_trial.mp4"

    print("\n[4/4] Rendering 5-Minute Baby Dropzzz Video (300 seconds)...")
    generate_all_animations(story_data, output_file=out_path, target_duration=300.0)

    elapsed = int(time.time() - start_t)
    print(f"\n=========================================================")
    print(f"5-Minute Trial Complete in {elapsed//60}m {elapsed%60}s!")
    print(f"Video saved to: {out_path}")
    print("=========================================================")

if __name__ == "__main__":
    run_5min_trial()
