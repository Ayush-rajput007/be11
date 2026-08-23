from PIL import Image

def trim_image(img_path, save_path):
    print(f"Opening image: {img_path}")
    img = Image.open(img_path)
    img = img.convert("RGBA")
    
    width, height = img.size
    new_img = Image.new("RGBA", (width, height))
    
    # Process pixels
    pixels = img.load()
    new_pixels = new_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Consider background if transparent (alpha < 10) OR near-white
            is_bg = (a < 10) or (r > 240 and g > 240 and b > 240)
            
            if is_bg:
                new_pixels[x, y] = (0, 0, 0, 0)
            else:
                new_pixels[x, y] = (r, g, b, a)
                
    # Get bounding box of non-transparent pixels
    bbox = new_img.getbbox()
    if bbox:
        print(f"Trimmed bbox: {bbox}")
        cropped_img = new_img.crop(bbox)
        # Add 10px padding for safety (aesthetic margins)
        padded_width = cropped_img.width + 20
        padded_height = cropped_img.height + 20
        padded_img = Image.new("RGBA", (padded_width, padded_height), (0, 0, 0, 0))
        padded_img.paste(cropped_img, (10, 10))
        
        padded_img.save(save_path, "PNG")
        print(f"Trimmed image saved to {save_path} with dimension {padded_img.width}x{padded_img.height}")
    else:
        print("Error: No bounding box found after masking.")

if __name__ == "__main__":
    src = r"c:\Users\bitd\Downloads\be11\be11_logo\be11_logo.png"
    dest = r"c:\Users\bitd\Downloads\be11\frontend\public\be11_logo.png"
    trim_image(src, dest)
