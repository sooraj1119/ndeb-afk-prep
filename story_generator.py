import os
import google.generativeai as genai
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")
load_dotenv(dotenv_path=".env", override=True)

def generate_story(num_scenes=8):
    print("--- Story Generator: Brainstorming Infinite Sensory Ideas ---")
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

    generation_config = {
        "temperature": 1.0,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 8192,
        "response_mime_type": "application/json",
    }

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=generation_config,
        system_instruction=(
            "You are an expert director of baby sensory videos (for 0-2 year olds) like 'Hey Bear Sensory'. "
            "Your job is to generate a JSON array of highly engaging, visually stimulating objects for a black background. "
            "Output exactly a JSON array. Each object MUST have these 3 fields:\n"
            "  - 'scene_number': integer starting from 1\n"
            "  - 'image_prompt': detailed image generation prompt string\n"
            "  - 'object_name': a simple, friendly 1-3 word name (e.g. 'Apple', 'Blue Car', 'Rainbow Star', 'Happy Bunny'). "
            "This will be SPOKEN ALOUD to the baby, so it must be short, simple, and delightful.\n\n"
            "Rules for image_prompts:\n"
            "1. MUST be extremely simple, highly recognizable, and friendly.\n"
            "2. MUST be one of these categories: cute smiling cars, dancing neon vegetables, bouncy happy fruits, "
            "glowing stars, fluffy animals, metallic toys, glowing shapes, or cute insects.\n"
            "3. MUST include adjectives like 'neon', 'glowing', 'vibrant', 'pastel', or 'metallic'.\n"
            "4. MUST end with 'pitch black background, 3d render, cute kawaii style, thick outlines, solid black background'.\n\n"
            "Generate " + str(num_scenes) + " completely unique objects to ensure every day has a different video theme."
        )
    )

    chat_session = model.start_chat(history=[])
    prompt = f"Generate {num_scenes} unique sensory objects. Output valid JSON array only."

    try:
        response = chat_session.send_message(prompt)
        story_data = json.loads(response.text)
        print(f"Successfully generated {len(story_data)} unique sensory objects.")
        return story_data
    except Exception as e:
        print(f"Error generating story: {e}")
        return [
            {"scene_number": 1, "object_name": "Apple",    "image_prompt": "A cute glowing neon apple smiling, pitch black background, 3d render, cute kawaii style, solid black background"},
            {"scene_number": 2, "object_name": "Blue Car", "image_prompt": "A happy metallic blue car, pitch black background, 3d render, cute kawaii style, solid black background"},
            {"scene_number": 3, "object_name": "Star",     "image_prompt": "A glowing yellow star with a cute face, pitch black background, 3d render, cute kawaii style, solid black background"},
        ]

if __name__ == "__main__":
    data = generate_story(3)
    print(json.dumps(data, indent=2))
