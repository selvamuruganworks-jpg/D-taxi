import shutil
import os

src = r"C:\Users\indiafilings\.gemini\antigravity-ide\brain\4cc6e4a5-01bb-4bda-99c6-92604f59bba4\d_taxi_logo_1781860959286.png"
dst = r"c:\Users\indiafilings\Desktop\mapapi\carapp\ride-app\mobile\assets\logo.png"

if os.path.exists(src):
    shutil.copy(src, dst)
    print("Success: Logo updated successfully in assets/logo.png")
else:
    print(f"Error: Source image not found at {src}")
