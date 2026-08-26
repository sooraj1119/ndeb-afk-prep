import os
import urllib.request
from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_videoclips, CompositeAudioClip
from moviepy.audio.fx.all import audio_fadeout, audio_loop, volumex

def assemble_final_video(story_data, input_dir="temp_assets", output_file="final_baby_sensory.mp4"):
    print("--- Video Assembly Module: Stitching Scenes, Audio & Music ---")
    
    clips = []
    
    for scene in story_data:
        scene_num = scene['scene_number']
        video_path = os.path.join(input_dir, f"scene_{scene_num}.mp4")
        audio_path = os.path.join(input_dir, f"scene_{scene_num}.mp3")
        
        if not os.path.exists(video_path) or not os.path.exists(audio_path):
            print(f"Skipping Scene {scene_num}: Missing assets.")
            continue
            
        try:
            if os.path.getsize(video_path) < 100:
                print(f"Detected mock video for Scene {scene_num}, skipping MoviePy render...")
                continue
                
            v_clip = VideoFileClip(video_path)
            a_clip = AudioFileClip(audio_path)
            
            scene_duration = 10.0
            v_clip = v_clip.loop(duration=scene_duration)
            
            # Put the exclamation in the middle without changing its native duration
            a_clip = a_clip.set_start((scene_duration - a_clip.duration) / 2)
            
            # The CompositeAudioClip takes the natural duration of its longest element.
            # We explicitly set the duration of the Composite to match the video.
            comp_audio = CompositeAudioClip([a_clip]).set_duration(scene_duration)
            
            v_clip = v_clip.set_audio(comp_audio)
            clips.append(v_clip)
        except Exception as e:
            print(f"Error processing Scene {scene_num}: {e}")
            
    if clips:
        print("Concatenating scenes...")
        final_clip = concatenate_videoclips(clips, method="compose")
        
        # Add engaging background nursery music
        bg_music_path = "background_music.mp3"
        if not os.path.exists(bg_music_path):
            print("Downloading royalty-free nursery music...")
            try:
                urllib.request.urlretrieve("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", bg_music_path)
            except Exception as e:
                print(f"Could not download music: {e}. Video will only have exclamations.")
                
        if os.path.exists(bg_music_path):
            try:
                bg_audio = AudioFileClip(bg_music_path)
                bg_audio = bg_audio.fx(volumex, 0.2) 
                bg_audio = bg_audio.fx(audio_loop, duration=final_clip.duration)
                
                final_audio = CompositeAudioClip([final_clip.audio, bg_audio])
                final_clip = final_clip.set_audio(final_audio)
                print("Successfully layered engaging background music!")
            except Exception as e:
                print(f"Failed to layer music: {e}")
        
        print("Rendering final masterpiece...")
        final_clip.write_videofile(output_file, fps=24, codec="libx264", audio_codec="aac")
        print(f"SUCCESS: Assembled {output_file}!")
    else:
        print("No valid video clips to assemble. Skipping final render.")

if __name__ == "__main__":
    mock_data = [{"scene_number": 1}]
    assemble_final_video(mock_data)
