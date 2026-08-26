import os
import math
import numpy as np
from PIL import Image, ImageDraw
from moviepy.editor import VideoClip, AudioFileClip, CompositeAudioClip, ImageClip, CompositeVideoClip
from moviepy.audio.fx.all import audio_loop, volumex
from music_pool import get_random_music_track
import colorsys

def crop_to_content(img_array):
    mask = np.any(img_array > 15, axis=-1)
    if not np.any(mask): return img_array
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    return img_array[rmin:rmax+1, cmin:cmax+1]

def generate_milkdrop_animations(story_data, input_dir="temp_assets", output_file="temp_assets/final_milkdrop.mp4"):
    print("--- Geometric Animator: Creating Joyful Hey-Bear visuals ---")
    
    W, H = 1920, 1080
    fps = 24
    total_duration = len(story_data) * 10.0
    
    # 1. Fetch Background Music
    bg_music_path = get_random_music_track()
    if not bg_music_path or not os.path.exists(bg_music_path):
        print("Failed to get music.")
        return None
        
    bg_audio = AudioFileClip(bg_music_path).fx(volumex, 0.2).fx(audio_loop, duration=total_duration)
    
    # Mathematical 120 BPM pulse envelope for the visuals
    def get_pulse(t):
        return 0.5 + 0.5 * math.sin(t * math.pi * 2.0 * 2.0)
    
    # 2. Build the visualizer background (Expanding Neon Rings)
    def make_geometric_bg(t):
        pulse = get_pulse(t)
        
        # Create a pure black canvas
        img = Image.new('RGB', (W, H), (0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw 8 expanding concentric rings
        num_rings = 8
        max_radius = 1200 # larger than screen to exit cleanly
        
        cx, cy = W // 2, H // 2
        
        # Rings expand outwards continuously
        base_radius_shift = (t * 200) % (max_radius / num_rings)
        
        for i in range(num_rings):
            # Calculate radius for this ring
            r = base_radius_shift + (i * (max_radius / num_rings))
            
            # Pulse the ring thickness to the beat
            thickness = int(20 + 20 * pulse)
            
            # Calculate a joyful rainbow color that shifts over time
            hue = ((t * 0.1) + (i * 0.15)) % 1.0
            rgb = colorsys.hsv_to_rgb(hue, 0.8, 1.0)
            color = (int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255))
            
            # Draw the ring
            bbox = [cx - r, cy - r, cx + r, cy + r]
            draw.ellipse(bbox, outline=color, width=thickness)
            
        return np.array(img)

    bg_clip = VideoClip(make_geometric_bg, duration=total_duration)
    
    # 3. Add Floating Objects (one object per 10 seconds, bobbing gently)
    objects_clips = []
    
    for idx, s in enumerate(story_data):
        img_path = os.path.join(input_dir, f"scene_{s['scene_number']}.png")
        if os.path.exists(img_path):
            img = Image.open(img_path).convert("RGBA")
            obj_img = img.resize((600, 600), Image.Resampling.LANCZOS)
            obj_np = np.array(obj_img)

            start_t = idx * 10.0
            vx = 250
            vy = 200

            def pos_func(t, st=start_t, _vx=vx, _vy=vy):
                local_t = t - st
                bob_y = math.sin(local_t * math.pi * 2.0 * 2.0) * 40
                max_x = W - 600
                max_y = H - 600
                curr_x = int(max_x - abs(max_x - ((_vx * local_t) % (2 * max_x)))) if max_x > 0 else 0
                curr_y = int(max_y - abs(max_y - ((_vy * local_t) % (2 * max_y)))) if max_y > 0 else 0
                final_y = max(0, min(max_y, curr_y + int(bob_y)))
                return (curr_x, final_y)

            # Use real RGBA alpha channel as mask (proper transparency)
            rgb_np = obj_np[:, :, :3]   # RGB channels for the clip
            mask_np = obj_np[:, :, 3]   # Alpha channel for the mask

            clip = ImageClip(rgb_np).set_start(start_t).set_duration(10.0)
            mask_clip = ImageClip(mask_np, ismask=True)
            clip = clip.set_mask(mask_clip).set_position(pos_func)

            if idx > 0:
                clip = clip.crossfadein(1.0)

            objects_clips.append(clip)
            
    # 4. Layer everything
    final_video = CompositeVideoClip([bg_clip] + objects_clips, size=(W, H)).set_duration(total_duration)
    
    # 5. Layer Audio (Exclamations)
    audio_clips = [bg_audio]
    for s in story_data:
        audio_path = os.path.join(input_dir, f"scene_{s['scene_number']}.mp3")
        if os.path.exists(audio_path):
            a_clip = AudioFileClip(audio_path)
            start_time = (s['scene_number'] - 1) * 10.0 + 3.0
            if start_time < total_duration:
                a_clip = a_clip.set_start(start_time)
                audio_clips.append(a_clip)
                
    # INJECT BOING SFX at exact collision timestamps
    boing_path = "temp_assets/boing.wav"
    if os.path.exists(boing_path):
        vx = 250
        vy = 200
        max_x = W - 600
        max_y = H - 600
        
        # Calculate every X collision
        num_x_bounces = int((total_duration * vx) / max_x)
        for k in range(1, num_x_bounces + 1):
            t_bounce = (k * max_x) / vx
            audio_clips.append(AudioFileClip(boing_path).set_start(t_bounce))
            
        # Calculate every Y collision
        num_y_bounces = int((total_duration * vy) / max_y)
        for k in range(1, num_y_bounces + 1):
            t_bounce = (k * max_y) / vy
            audio_clips.append(AudioFileClip(boing_path).set_start(t_bounce))
            
    final_audio = CompositeAudioClip(audio_clips).set_duration(total_duration)
    final_video = final_video.set_audio(final_audio)

    # Watermark removed

    print("Rendering Joyful Geometric Masterpiece...")
    final_video.write_videofile(output_file, fps=fps, codec="libx264", audio_codec="aac", threads=4)
    print(f"DONE: {output_file}")
    
    return output_file

if __name__ == "__main__":
    pass
