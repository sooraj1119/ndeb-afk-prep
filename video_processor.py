from moviepy.editor import VideoFileClip, CompositeVideoClip
import moviepy.video.fx.all as vfx
import os
import random
from moviepy.editor import AudioFileClip
from moviepy.audio.fx.all import audio_loop

def process_to_shorts(input_path, output_path):
    """
    Takes an input YouTube Short, applies heavy evasion filters, and saves it.
    """
    print(f"Loading video {input_path}...")
    clip = VideoFileClip(input_path)
    
    # Evasion Stack 1: Rotate and Scale (Hides watermarks/edges)
    print("Applying cinematic Dutch Angle and Scale to raw footage...")
    processed_clip = clip.fx(vfx.rotate, angle=1.5, resample='bilinear')
    processed_clip = processed_clip.resize(1.03) # Reduced zoom to preserve more of the original video
    
    # Crop exactly to 1080x1920 from center to remove any rotated black edges
    w_rot, h_rot = processed_clip.size
    target_w, target_h = 1080, 1920
    
    if w_rot < target_w or h_rot < target_h:
        processed_clip = processed_clip.resize(height=target_h)
        w_rot, h_rot = processed_clip.size
        
    processed_clip = processed_clip.crop(x_center=w_rot/2, y_center=h_rot/2, width=target_w, height=target_h)
    
    if processed_clip.size != (1080, 1920):
        processed_clip = processed_clip.resize((1080, 1920))
        
    # Evasion Stack 2: Strip Audio and add Phonk
    processed_clip = processed_clip.without_audio()
    
    if os.path.exists("bg_music.m4a"):
        print("Adding background music...")
        bg_audio = AudioFileClip("bg_music.m4a")
        
        if bg_audio.duration < processed_clip.duration:
            bg_audio = audio_loop(bg_audio, duration=processed_clip.duration)
        else:
            max_start = max(0, bg_audio.duration - processed_clip.duration)
            start_offset = random.uniform(0, max_start)
            bg_audio = bg_audio.subclip(start_offset, start_offset + processed_clip.duration)
            
        final_audio = bg_audio
    else:
        final_audio = None
        
    if final_audio is not None:
        final_audio = final_audio.set_duration(processed_clip.duration)
        processed_clip = processed_clip.set_audio(final_audio)
    
    # Evasion Stack 3: Flip horizontally
    processed_clip = processed_clip.fx(vfx.mirror_x)
    
    # Evasion Stack 4: Speed up
    processed_clip = processed_clip.fx(vfx.speedx, 1.07)
    
    # Evasion Stack 5: Color Boost and Text Hook via FFmpeg
    print(f"Writing to {output_path}...")
    clean_hooks = [
        'Wait for it...',
        'Did he really do that?!',
        'Pure Magic',
        'Legendary Moment',
        'Unstoppable!',
        'Is this the GOAT?'
    ]
    hook_text = random.choice(clean_hooks).upper()
    font_path = 'impact.ttf'
    
    # Drawtext y=100 (top of the video)
    vf_string = f"deband,eq=contrast=1.05:saturation=1.10,unsharp=3:3:0.5:3:3:0.0,drawtext=fontfile='{font_path}':text='{hook_text}':fontcolor=yellow:fontsize=75:x=(w-text_w)/2:y=100:borderw=5:bordercolor=black" 
    
    processed_clip.write_videofile(
        output_path, 
        fps=59.94,
        codec="libx264", 
        audio_codec="aac",
        threads=2,
        preset="medium",
        bitrate="15000k",
        ffmpeg_params=["-pix_fmt", "yuv420p", "-vf", vf_string],
        logger=None
    )
    
    clip.close()
    processed_clip.close()
    if 'bg_audio' in locals():
        bg_audio.close()
    if 'final_audio' in locals() and final_audio is not None:
        final_audio.close()
    
    return output_path
