import sys
import os
import subprocess

# Ensure Pillow is installed
try:
    from PIL import Image, ImageOps
except ImportError:
    print("Installing Pillow library for image processing...")
    subprocess.run([sys.executable, "-m", "pip", "install", "Pillow"], check=True)
    from PIL import Image, ImageOps

def crop_assets():
    # Source image path
    source_img_path = r"C:\Users\indiafilings\.gemini\antigravity-ide\brain\4cc6e4a5-01bb-4bda-99c6-92604f59bba4\media__1781843914811.jpg"
    
    if not os.path.exists(source_img_path):
        print(f"Error: Source image not found at {source_img_path}")
        return

    print(f"Opening source image: {source_img_path}")
    img = Image.open(source_img_path)
    W, H = img.size
    print(f"Image dimensions: {W}x{H}")

    # Output paths
    assets_dir = r"c:\Users\indiafilings\Desktop\mapapi\carapp\ride-app\mobile\assets"
    logo_out_path = os.path.join(assets_dir, "logo.png")
    car_out_path = os.path.join(assets_dir, "car.png")

    # Define crop coordinates based on proportional layout of the 1024x803 screenshot
    # Logo: Center around X=128 (0.125 * W), Y=400 (0.50 * H)
    logo_box = (
        int(0.055 * W),  # left
        int(0.330 * H),  # top
        int(0.195 * W),  # right
        int(0.485 * H)   # bottom
    )

    # Car: Center around X=120, Y=695
    car_box = (
        int(0.035 * W),  # left
        int(0.675 * H),  # top
        int(0.215 * W),  # right
        int(0.795 * H)   # bottom
    )

    print(f"Cropping logo (box: {logo_box})...")
    logo = img.crop(logo_box)
    
    # Resize logo to standard size
    logo = logo.resize((240, 240), Image.Resampling.LANCZOS)
    logo.save(logo_out_path, "PNG")
    print(f"Saved cropped logo to: {logo_out_path}")

    print(f"Cropping car (box: {car_box})...")
    car = img.crop(car_box)
    
    # Process car to remove white background (make transparent)
    car_rgba = car.convert("RGBA")
    datas = car_rgba.getdata()
    
    new_data = []
    for item in datas:
        # Check if pixel is white or very near white
        # Red, Green, Blue > 240
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0)) # Make transparent
        else:
            new_data.append(item)
            
    car_rgba.putdata(new_data)
    
    # Resize car to high-quality display size
    car_rgba = car_rgba.resize((400, 220), Image.Resampling.LANCZOS)
    car_rgba.save(car_out_path, "PNG")
    print(f"Saved cropped car (transparent background) to: {car_out_path}")

    print("Success! Assets extracted successfully.")

if __name__ == "__main__":
    crop_assets()
