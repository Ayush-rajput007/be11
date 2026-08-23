import os
from PIL import Image, ImageChops

def trim_image(img_path, save_path):
    print(f"Opening image: {img_path}")
    img = Image.open(img_path)
    
    # Convert to RGBA if not already
    img = img.convert("RGBA")
    
    # Get the bounding box of non-transparent and non-white pixels
    # Since the background might be pure white (255, 255, 255, 255) or transparent (x, x, x, 0)
    # We can create a mask where pixels are considered background if they are white or transparent
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # If pixel is transparent or very close to pure white, make it transparent
        if item[3] == 0 or (item[0] > 240 and item[1] > 240 and item[2] > 240):
            new_data.append((0, 0, 0, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Get bbox of the non-zero (non-transparent) area
    bbox = img.getbbox()
    if bbox:
        print(f"Trimming to bbox: {bbox}")
        cropped_img = img.crop(bbox)
        
        # Save to destination
        cropped_img.save(save_path, "PNG")
        print(f"Successfully trimmed and saved to {save_path}")
    else:
        print("No bounding box found! Image might be completely transparent/white.")

if __name__ == "__main__":
    src = r"c:\Users\bitd\Downloads\be11\be11_logo\be11_logo.png"
    dest = r"c:\Users\bitd\Downloads\be11\frontend\public\be11_logo.png"
    trim_image(src, dest)
