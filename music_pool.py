import random
import os
import urllib.request

# Curated list of high-energy, joyful, bouncy marimba/xylophone & baby sensory tracks
# All hosted permanently on Internet Archive (CC-BY Kevin MacLeod)
# Perfect for 0-2 year old baby sensory videos (similar to Hey Bear Sensory & Cocomelon)
JOYFUL_TRACKS = [
    "https://archive.org/download/MonkeysSpinningMonkeys_201610/Monkeys%20Spinning%20Monkeys.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Comedy%20Scoring/Kevin%20MacLeod%20-%2005%20-%20The%20Builder.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Comedy%20Scoring/Kevin%20MacLeod%20-%2004%20-%20Happy%20Boy%20End%20Theme.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Comedy%20Scoring/Kevin%20MacLeod%20-%2011%20-%20Scheming%20Weasel%20%28faster%20version%29.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Calming/Kevin%20MacLeod%20-%2004%20-%20Carefree.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Ferret/Kevin%20MacLeod%20-%2006%20-%20Cheery%20Monday.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Groovy/Kevin%20MacLeod%20-%2013%20-%20Happy%20Happy%20Gameshow.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Happyrock/Kevin%20MacLeod%20-%2002%20-%20Chipper.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Happyrock/Kevin%20MacLeod%20-%2005%20-%20Happy%20Bee.mp3",
    "https://archive.org/download/KevinMacLeod_2019-04_Discography/Kevin%20MacLeod/Carpe%20Diem/Kevin%20MacLeod%20-%2008%20-%20Happy%20Boy.mp3",
]

def get_random_music_track(output_path="temp_assets/background_music.mp3"):
    """
    Downloads a random royalty-free joyful/bouncy sensory track.
    Automatically retries with another track if a download fails.
    """
    print("--- Music Manager: Selecting high-energy baby sensory track ---")
    
    if not os.path.exists(os.path.dirname(output_path)):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
    shuffled = list(JOYFUL_TRACKS)
    random.shuffle(shuffled)
    
    for url in shuffled:
        print(f"Trying track URL: {url}")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as response:
                content = response.read()
                if len(content) > 10000: # ensure valid audio file size (>10KB)
                    with open(output_path, 'wb') as out_file:
                        out_file.write(content)
                    print(f"Successfully downloaded engaging music track! ({len(content)//1024} KB)")
                    return output_path
        except Exception as e:
            print(f"Download failed for {url}: {e}, trying next track...")
            continue

    # Reliable fallback if all URLs fail
    fallback = "https://archive.org/download/MonkeysSpinningMonkeys_201610/Monkeys%20Spinning%20Monkeys.mp3"
    try:
        req = urllib.request.Request(fallback, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response, open(output_path, 'wb') as out_file:
            out_file.write(response.read())
        print("Fallback music downloaded successfully.")
    except Exception as e:
        print(f"Fallback music download failed: {e}")
        
    return output_path

if __name__ == "__main__":
    get_random_music_track()
