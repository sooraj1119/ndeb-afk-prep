"""
Baby Dropzzz — Sensory Engine v4  "HYPNOTIC"
=============================================
Upgrades over v3:
  • Rainbow comet TRAIL behind every bouncer (10 ghost frames)
  • BPM-locked expanding ring field in background (beats visible)
  • Twinkling star field (60 stars, vectorised)
  • Full-screen colour FLASH burst on every wall hit
  • Main object is now 700 px — fills the screen
  • 4 bouncers with distinct sizes for layered depth
  • Scene cycles every 4 s (constant novelty)

Retained from v3:
  2.  Per-scene colour theme from dominant image hue
  8.  Object name text overlay (bottom of screen)
  9.  Animated 3-second intro
  10. Per-bouncer rotation
  12. Subscribe end card
"""

import os
import math
import random
import colorsys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import VideoClip, AudioFileClip, CompositeAudioClip
from moviepy.audio.fx.all import audio_loop, volumex
from music_pool import get_random_music_track

# ─── Canvas & Timing ────────────────────────────────────────────────────────
W, H         = 1920, 1080
FPS          = 15
OBJ_SIZE     = 700          # main bouncer — BIG & unmissable
SCENE_T      = 4.0          # 4-second scene cycling
BPM          = 120.0
INTRO_T      = 3.0
OUTRO_T      = 3.5
NAME_SHOW_T  = 2.0

# Trail config
TRAIL_STEPS  = 4            # ghost frames
TRAIL_DT     = 0.080        # seconds between trail ghosts

# ─── 4 Bouncers — varied sizes & speeds ─────────────────────────────────────
BOUNCERS = [
    {"vx": 205, "vy": 148, "phase": 0.0, "size_mul": 1.00, "rot_spd":  5},   # MAIN – huge
    {"vx": 138, "vy": 208, "phase": 4.3, "size_mul": 0.58, "rot_spd": -8},   # medium CCW
    {"vx": 262, "vy": 118, "phase": 2.1, "size_mul": 0.43, "rot_spd": 13},   # small fast CW
    {"vx": 178, "vy": 268, "phase": 7.0, "size_mul": 0.32, "rot_spd":-11},   # tiny, fast CCW
]

# Pre-seeded star field (fixed positions, twinkling varies per frame)
_RNG          = np.random.default_rng(7)
N_STARS       = 70
STAR_X        = _RNG.integers(0, W, N_STARS)
STAR_Y        = _RNG.integers(0, H, N_STARS)
STAR_PHASE    = _RNG.uniform(0, 2 * np.pi, N_STARS)
STAR_SIZE     = _RNG.integers(2, 7, N_STARS)
STAR_HUE      = _RNG.uniform(0, 1, N_STARS)

# ─── Font helpers ─────────────────────────────────────────────────────────
_FONT_CACHE = {}

def _font(size):
    if size in _FONT_CACHE:
        return _FONT_CACHE[size]
    for path in ["C:/Windows/Fonts/Impact.ttf",
                 "C:/Windows/Fonts/arialbd.ttf",
                 "C:/Windows/Fonts/arial.ttf"]:
        try:
            f = ImageFont.truetype(path, size)
            _FONT_CACHE[size] = f
            return f
        except Exception:
            continue
    f = ImageFont.load_default()
    _FONT_CACHE[size] = f
    return f

def _text_center(draw, text, y, size, fill, shadow=(0,0,0)):
    fn = _font(size)
    try:
        bb = draw.textbbox((0, 0), text, font=fn)
        tw = bb[2] - bb[0]
    except AttributeError:
        tw, _ = draw.textsize(text, font=fn)
    x = (W - tw) // 2
    draw.text((x+5, y+5), text, font=fn, fill=shadow)
    draw.text((x,   y),   text, font=fn, fill=fill)

# ─── Colour helpers ──────────────────────────────────────────────────────────
def _hsv(h, s=0.9, v=1.0):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, s, v)
    return (int(r*255), int(g*255), int(b*255))

def _pulse(t):
    return 0.5 + 0.5 * math.sin(t * math.pi * 2 * (BPM / 60))

def _dominant_hue(rgb, alpha):
    mask = alpha > 100
    if not np.any(mask):
        return random.random()
    pix = rgb[mask].astype(np.float32) / 255.0
    h, _, _ = colorsys.rgb_to_hsv(pix[:,0].mean(), pix[:,1].mean(), pix[:,2].mean())
    return h

# ─── Bounce position helper ──────────────────────────────────────────────────
def _bpos(local_t, vx, vy, max_x, max_y):
    lt = max(0.0, local_t)
    bx = int(max_x - abs(max_x - ((vx * lt) % (2 * max_x)))) if max_x > 0 else 0
    by = int(max_y - abs(max_y - ((vy * lt) % (2 * max_y)))) if max_y > 0 else 0
    return bx, by

# ─── Drawing helpers ─────────────────────────────────────────────────────────
def _glow_ring(canvas_pil, cx, cy, radius, color, thickness=28):
    draw = ImageDraw.Draw(canvas_pil)
    for layer in range(6, 0, -1):
        frac = layer / 6
        col  = tuple(int(c * frac) for c in color)
        t    = thickness + (6 - layer) * 12
        r2   = radius + t
        draw.ellipse([cx-r2, cy-r2, cx+r2, cy+r2], outline=col, width=max(1, t//2))

def _sparkle_burst(canvas_np, cx, cy, color, num=30):
    for _ in range(num):
        ang  = random.uniform(0, 2*math.pi)
        dist = random.uniform(OBJ_SIZE//2+10, OBJ_SIZE//2+130)
        sx   = int(cx + math.cos(ang) * dist)
        sy   = int(cy + math.sin(ang) * dist)
        r    = random.randint(6, 18)
        y1,y2 = max(0,sy-r), min(H,sy+r)
        x1,x2 = max(0,sx-r), min(W,sx+r)
        if y2>y1 and x2>x1:
            canvas_np[y1:y2,x1:x2] = np.clip(
                canvas_np[y1:y2,x1:x2].astype(np.int32)+list(color),0,255).astype(np.uint8)

def _alpha_composite(canvas, rgb, alpha, ox, oy):
    h, w = rgb.shape[:2]
    y1,y2 = max(0,oy), min(H,oy+h)
    x1,x2 = max(0,ox), min(W,ox+w)
    fy1=y1-oy; fy2=fy1+(y2-y1); fx1=x1-ox; fx2=fx1+(x2-x1)
    if y2>y1 and x2>x1:
        a = alpha[fy1:fy2,fx1:fx2,None]
        src = rgb[fy1:fy2,fx1:fx2]
        dst = canvas[y1:y2,x1:x2]
        canvas[y1:y2,x1:x2] = (src.astype(np.uint16) * a + dst.astype(np.uint16) * (255 - a)) // 255

_RESIZE_CACHE = {}
def _get_resized_sprite(rgb, alp, img_idx, breathe, w_sc, h_sc):
    key = (img_idx, breathe)
    if key in _RESIZE_CACHE:
        return _RESIZE_CACHE[key]
    if len(_RESIZE_CACHE) > 300:
        _RESIZE_CACHE.clear()
    rgb_sc = np.array(Image.fromarray(rgb).resize((w_sc,h_sc), Image.Resampling.BILINEAR))
    alp_sc = np.array(Image.fromarray(alp).resize((w_sc,h_sc), Image.Resampling.BILINEAR))
    _RESIZE_CACHE[key] = (rgb_sc, alp_sc)
    return rgb_sc, alp_sc

_GHOST_CACHE = {}
def _get_ghost_sprite(rgb, alp, ring_hue, step):
    key = (id(rgb), round(ring_hue, 1), step)
    if key in _GHOST_CACHE:
        return _GHOST_CACHE[key]
    if len(_GHOST_CACHE) > 500:
        _GHOST_CACHE.clear()
    trail_strength   = (1.0 - step/TRAIL_STEPS) * 0.30
    trail_hue        = (ring_hue + step * 0.07) % 1.0
    tc               = np.array(_hsv(trail_hue), dtype=np.uint16)
    tinted           = ((rgb.astype(np.uint16) * tc) // 255).astype(np.uint8)
    t_alpha          = ((alp.astype(np.uint16) * int(trail_strength * 255)) // 255).astype(np.uint8)
    _GHOST_CACHE[key] = (tinted, t_alpha)
    return tinted, t_alpha

_ROT_CACHE = {}
def _rotate_rgba(rgb, alpha, angle_deg):
    step_deg = int(angle_deg / 4.0) * 4 % 360
    cache_key = (id(rgb), step_deg)
    if cache_key in _ROT_CACHE:
        return _ROT_CACHE[cache_key]
    rgb_r   = np.array(Image.fromarray(rgb).rotate(step_deg, resample=Image.BILINEAR, expand=False))
    alpha_r = np.array(Image.fromarray(alpha).rotate(step_deg, resample=Image.BILINEAR, expand=False))
    _ROT_CACHE[cache_key] = (rgb_r, alpha_r)
    return rgb_r, alpha_r

# ─── Background: BPM rings (Disabled as requested) ─────────────────────────
def _draw_bpm_rings(canvas_pil, t, scene_hue):
    pass


# ─── Background: Twinkling star field ────────────────────────────────────────
def _draw_stars(canvas_np, t, scene_hue):
    """Vectorised twinkling stars."""
    twinkle   = np.maximum(0.0, 0.4 + 0.6 * np.sin(t * 2.5 + STAR_PHASE))
    hue_vals  = (scene_hue + STAR_HUE * 0.4) % 1.0
    for i in range(N_STARS):
        bri = twinkle[i]
        col = tuple(int(c * bri) for c in _hsv(hue_vals[i], 0.6, 1.0))
        r   = STAR_SIZE[i]
        y1,y2 = max(0,STAR_Y[i]-r), min(H,STAR_Y[i]+r)
        x1,x2 = max(0,STAR_X[i]-r), min(W,STAR_X[i]+r)
        if y2>y1 and x2>x1:
            canvas_np[y1:y2,x1:x2] = col

# ══════════════════════════════════════════════════════════════════════════════
#  INTRO FRAME BUILDER
# ══════════════════════════════════════════════════════════════════════════════
def _make_intro_frame(t):
    progress = min(t / INTRO_T, 1.0)
    ease     = 1 - (1 - progress) ** 3

    hue    = (t * 0.20) % 1.0
    bg     = _hsv(hue, 0.65, 0.10)
    canvas = Image.new("RGB", (W, H), bg)
    canvas_np = np.array(canvas)
    _draw_stars(canvas_np, t, hue)

    pil_tmp = Image.fromarray(canvas_np)
    draw    = ImageDraw.Draw(pil_tmp)

    # Zoom-in title
    txt_size = int(40 + 160 * ease)
    txt_col  = _hsv((t * 0.5) % 1.0, 0.15, 1.0)
    _text_center(draw, "BABY DROPZZZ", H//2 - txt_size//2, txt_size,
                 fill=txt_col, shadow=(0, 0, 60))

    if t > 1.4:
        sub_ease = min((t - 1.4) / 0.8, 1.0)
        sub_col  = tuple(int(c * sub_ease) for c in (210, 220, 255))
        _text_center(draw, "Sensory Adventure for Babies!",
                     H//2 + txt_size//2 + 18, max(24, int(52 * ease)),
                     fill=sub_col, shadow=(0,0,0))
    return np.array(pil_tmp)

# ══════════════════════════════════════════════════════════════════════════════
#  END CARD FRAME BUILDER
# ══════════════════════════════════════════════════════════════════════════════
def _make_outro_frame(t, last_frame):
    progress = min(t / OUTRO_T, 1.0)
    ease     = 1 - (1 - progress) ** 2

    canvas = last_frame.copy()
    overlay = np.zeros_like(canvas)
    canvas  = (canvas * 0.35 + overlay * 0.65).astype(np.uint8)

    _draw_stars(canvas, t, (t * 0.1) % 1.0)

    pil_tmp = Image.fromarray(canvas)
    draw    = ImageDraw.Draw(pil_tmp)

    slide_y = int(H * 0.28 + (1-ease) * 160)
    sub_col = _hsv((t * 0.35) % 1.0, 0.15, 1.0)
    _text_center(draw, "SUBSCRIBE FOR MORE!", slide_y, 138,
                 fill=sub_col, shadow=(0,0,0))
    _text_center(draw, "* * * * *", slide_y + 160, 72,
                 fill=_hsv(0.13, 0.9, 1.0), shadow=(60,30,0))
    _text_center(draw, "Baby Dropzzz", slide_y + 260, 92,
                 fill=(180,220,255), shadow=(0,0,60))
    return np.array(pil_tmp)

# ══════════════════════════════════════════════════════════════════════════════
#  MAIN GENERATOR
# ══════════════════════════════════════════════════════════════════════════════
def generate_all_animations(story_data, input_dir="temp_assets",
                             output_file="temp_assets/final_master.mp4",
                             target_duration=None):
    print("--- Baby Dropzzz Engine v4: HYPNOTIC ---")

    images, alphas, hues, names = [], [], [], []
    for s in story_data:
        path = os.path.join(input_dir, f"scene_{s['scene_number']}.png")
        name = s.get('object_name', '')
        if os.path.exists(path):
            img  = Image.open(path).convert("RGBA").resize(
                (OBJ_SIZE, OBJ_SIZE), Image.Resampling.LANCZOS)
            arr  = np.array(img)
            rgb, alpha = arr[:,:,:3], arr[:,:,3]
            images.append(rgb)
            alphas.append(alpha)
            hues.append(_dominant_hue(rgb, alpha))
            names.append(name)

    if not images:
        print("No images found!")
        return None

    n            = len(images)
    if target_duration:
        content_dur = float(target_duration) - (INTRO_T + OUTRO_T)
    else:
        content_dur  = len(story_data) * SCENE_T
    total_dur    = INTRO_T + content_dur + OUTRO_T

    # Pre-compute wall hits
    wall_hits = {i: [] for i in range(len(BOUNCERS))}
    for bi, b in enumerate(BOUNCERS):
        ow = int(OBJ_SIZE * b["size_mul"])
        oh = int(OBJ_SIZE * b["size_mul"])
        mx = W - ow;  my = H - oh
        if mx>0 and my>0:
            for k in range(1, int(content_dur * b["vx"] / mx) + 2):
                wt = k * mx / b["vx"]
                if wt < content_dur: wall_hits[bi].append(wt)
            for k in range(1, int(content_dur * b["vy"] / my) + 2):
                wt = k * my / b["vy"]
                if wt < content_dur: wall_hits[bi].append(wt)

    last_frame = [None]

    def make_content_frame(ct):
        scene_idx = int(ct / SCENE_T) % n
        dom_hue   = hues[scene_idx]
        bg_col    = _hsv((dom_hue + 0.5) % 1.0, 0.55, 0.11)

        # ── Background ──────────────────────────────────────────────────
        canvas_pil = Image.new("RGB", (W, H), bg_col)
        canvas_np = np.array(canvas_pil)
        _draw_stars(canvas_np, ct, dom_hue)             # twinkling stars

        # Per-bouncer flash accumulator
        flash_overlay = np.zeros((H, W, 3), dtype=np.float32)

        for bi, b in enumerate(BOUNCERS):
            ow       = int(OBJ_SIZE * b["size_mul"])
            oh       = int(OBJ_SIZE * b["size_mul"])
            max_x    = W - ow;  max_y = H - oh
            if max_x<=0 or max_y<=0: continue

            vx, vy   = b["vx"], b["vy"]
            phase    = b["phase"]
            local_t  = ct + phase

            bx, by   = _bpos(local_t, vx, vy, max_x, max_y)
            breathe  = 1.0 + 0.07 * math.sin(ct * math.pi * 2 * (BPM/60) + bi * 1.4)
            w_sc     = int(ow * breathe)
            h_sc     = int(oh * breathe)
            ox       = bx - (w_sc - ow) // 2
            oy       = by - (h_sc - oh) // 2

            img_idx  = (int(ct / SCENE_T) + bi * 5) % n
            rgb, alp = images[img_idx], alphas[img_idx]

            # Rotation
            angle    = (ct * b["rot_spd"]) % 360
            rgb, alp = _rotate_rgba(rgb, alp, angle)

            # Scale to breathing size
            b_key = round(breathe, 2)
            if b_key != 1.0:
                rgb, alp = _get_resized_sprite(rgb, alp, img_idx, b_key, w_sc, h_sc)

            ring_hue = (hues[img_idx] + ct * 0.06 + bi * 0.25) % 1.0
            ring_col = _hsv(ring_hue, 1.0, 1.0)
            cx_c     = ox + w_sc // 2
            cy_c     = oy + h_sc // 2

            # ── Rainbow comet TRAIL ────────────────────────────────────
            for step in range(TRAIL_STEPS, 0, -1):
                past_lt          = max(0.0, local_t - step * TRAIL_DT)
                pbx, pby         = _bpos(past_lt, vx, vy, max_x, max_y)
                p_ox             = pbx - (w_sc-ow)//2
                p_oy             = pby - (h_sc-oh)//2
                tinted, t_alpha  = _get_ghost_sprite(rgb, alp, ring_hue, step)
                _alpha_composite(canvas_np, tinted, t_alpha, p_ox, p_oy)

            # ── Composite object ───────────────────────────────────────
            _alpha_composite(canvas_np, rgb, alp, ox, oy)

            # ── Sparkle + Flash on wall hit ────────────────────────────
            flash_str = 0.0
            for wt in wall_hits[bi]:
                dt = ct - wt
                if 0 <= dt < (5 / FPS):
                    intensity = 1.0 - dt * FPS / 5
                    flash_str = max(flash_str, intensity)
                    if dt < (2 / FPS):
                        _sparkle_burst(canvas_np, cx_c, cy_c, ring_col, num=32)

            if flash_str > 0:
                # Full-screen colour flash
                fc = np.array(ring_col, dtype=np.float32) * flash_str * 0.55
                flash_overlay += fc[np.newaxis, np.newaxis, :]

        # Apply accumulated flash overlay
        if flash_overlay.max() > 0:
            canvas_np = np.clip(
                canvas_np.astype(np.float32) + flash_overlay, 0, 255
            ).astype(np.uint8)

        # ── Object name text overlay ───────────────────────────────────
        scene_start = int(ct / SCENE_T) * SCENE_T
        time_in_s   = ct - scene_start
        obj_name    = names[scene_idx] if scene_idx < len(names) else ""
        if obj_name and time_in_s < NAME_SHOW_T:
            fade = min(time_in_s / 0.35, 1.0)
            if time_in_s > NAME_SHOW_T - 0.45:
                fade = (NAME_SHOW_T - time_in_s) / 0.45
            fade = max(0.0, min(1.0, fade))
            tc   = tuple(int(c * fade) for c in _hsv(hues[scene_idx], 0.15, 1.0))
            sc   = tuple(int(c * fade) for c in (0, 0, 0))
            pil_tmp = Image.fromarray(canvas_np)
            _text_center(ImageDraw.Draw(pil_tmp), obj_name.upper(),
                         H - 200, 118, fill=tc, shadow=sc)
            canvas_np = np.array(pil_tmp)

        return canvas_np

    def make_frame(t):
        if t < INTRO_T:
            return _make_intro_frame(t)
        ct = t - INTRO_T
        if ct >= content_dur:
            base = last_frame[0] if last_frame[0] is not None else np.zeros((H,W,3),dtype=np.uint8)
            return _make_outro_frame(ct - content_dur, base)
        frame = make_content_frame(ct)
        last_frame[0] = frame.copy()
        return frame

    final_clip = VideoClip(make_frame, duration=total_dur)

    # ── Audio ─────────────────────────────────────────────────────────────
    audio_clips = []
    bg = get_random_music_track()
    if bg and os.path.exists(bg):
        audio_clips.append(
            AudioFileClip(bg).fx(volumex, 0.45).fx(audio_loop, duration=total_dur)
        )
    num_cycles = int(math.ceil(content_dur / SCENE_T))
    for idx in range(num_cycles):
        s = story_data[idx % len(story_data)]
        ap = os.path.join(input_dir, f"scene_{s['scene_number']}.mp3")
        if os.path.exists(ap):
            st = INTRO_T + idx * SCENE_T + 0.6
            if st < total_dur - OUTRO_T:
                audio_clips.append(AudioFileClip(ap).set_start(st))
    boing = "temp_assets/boing.wav"
    if os.path.exists(boing):
        all_hits = sorted({t for hits in wall_hits.values() for t in hits})
        for wt in all_hits:
            at = INTRO_T + wt
            if at < total_dur - OUTRO_T:
                audio_clips.append(
                    AudioFileClip(boing).fx(volumex, 0.55).set_start(at)
                )
    if audio_clips:
        final_clip = final_clip.set_audio(
            CompositeAudioClip(audio_clips).set_duration(total_dur)
        )

    print("Rendering Baby Dropzzz HYPNOTIC v4...")
    final_clip.write_videofile(
        output_file, fps=FPS, codec="libx264",
        audio_codec="aac", threads=4
    )
    print(f"DONE: {output_file}")
    return output_file


if __name__ == "__main__":
    pass
