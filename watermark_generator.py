from PIL import Image, ImageDraw, ImageFont
import os

def generate_watermark(output_path="temp_assets/watermark.png", text="Baby Dropzzz"):
    """
    Creates a highly vibrant, semi-transparent watermark logo.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Create a transparent canvas
    W, H = 800, 200
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    try:
        # Try to use a bold system font if available
        font = ImageFont.truetype("arialbd.ttf", 80)
    except:
        try:
            font = ImageFont.truetype("segoeuib.ttf", 80)
        except:
            font = ImageFont.load_default()
            
    # Draw text with a vibrant color and a thick black outline for visibility
    text_color = (255, 200, 50, 220)  # Golden yellow, slightly transparent
    outline_color = (0, 0, 0, 220)
    
    # Rough outline by drawing text offset in black
    offsets = [(x, y) for x in range(-4, 5) for y in range(-4, 5)]
    for ox, oy in offsets:
        draw.text((50 + ox, 50 + oy), text, font=font, fill=outline_color)
        
    # Draw main text
    draw.text((50, 50), text, font=font, fill=text_color)
    
    # Save the transparent PNG
    img.save(output_path, format="PNG")
    print(f"Generated Watermark: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_watermark()
