import os
import asyncio
import random
import edge_tts

# Warm, enthusiastic child-like voice
VOICE = "en-US-AnaNeural"
PITCH = "+15Hz"
RATE  = "+5%"

# High-energy exclamations (mixed after the name)
EXCLAMATIONS = [
    "Wow!", "Yay!", "Ooo!", "Wheee!", "Look!",
    "Boing!", "Yayyy!", "So fun!", "Again!", "Woo-hoo!"
]

async def _generate_audio(text, output_file):
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(output_file)

def generate_all_audio(story_data, output_dir="temp_assets"):
    """
    Feature 8: Speak the object name first, then an exclamation.
    e.g.  "Apple! Yay!"   or   "Blue Car! Wow!"
    Falls back to a random exclamation if object_name is missing.
    """
    print("--- Voice Module: Speaking Object Names + Exclamations ---")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for scene in story_data:
        scene_num  = scene['scene_number']
        obj_name   = scene.get('object_name', '').strip()
        excl       = random.choice(EXCLAMATIONS)

        if obj_name:
            text = f"{obj_name}! {excl}"
        else:
            text = excl

        output_file = os.path.join(output_dir, f"scene_{scene_num}.mp3")
        print(f"  Scene {scene_num}: \"{text}\"")
        asyncio.run(_generate_audio(text, output_file))

if __name__ == "__main__":
    mock_data = [
        {"scene_number": 1, "object_name": "Apple"},
        {"scene_number": 2, "object_name": "Blue Car"},
        {"scene_number": 3, "object_name": "Rainbow Star"},
    ]
    generate_all_audio(mock_data)
