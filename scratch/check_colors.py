from PIL import Image

img = Image.open(r"c:\Users\bitd\Downloads\be11\be11_logo\be11_logo.png")
img = img.convert("RGBA")
width, height = img.size
print(f"Image dimensions: {width}x{height}")

# Print colors of a few pixels at the corners and center
corners = [
    (0, 0), (width-1, 0), (0, height-1), (width-1, height-1),
    (10, 10), (width-11, 10), (10, height-11), (width-11, height-11),
    (width//2, height//2)
]
for x, y in corners:
    print(f"Pixel at ({x}, {y}): {img.getpixel((x, y))}")
