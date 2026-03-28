from PIL import Image
import os

def crop_image():
    os.makedirs("images", exist_ok=True)
    img = Image.open("data/images/2024_q03_choices.png")
    width, height = img.size
    print(f"Image loaded: {width}x{height}")
    
    w3 = width // 3
    h2 = height // 2
    
    img.crop((0, 0, w3, h2)).save("images/2024_q03_c1.png")
    img.crop((w3, 0, w3*2, h2)).save("images/2024_q03_c2.png")
    img.crop((w3*2, 0, width, h2)).save("images/2024_q03_c3.png")
    img.crop((0, h2, w3, height)).save("images/2024_q03_c4.png")
    img.crop((w3, h2, w3*2, height)).save("images/2024_q03_c5.png")
    print("Done slicing 5 choice images.")

if __name__ == "__main__":
    crop_image()
