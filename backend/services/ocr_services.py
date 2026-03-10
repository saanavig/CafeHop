from PIL import Image
import pytesseract

def ocr_image(file_stream) -> str:
    img = Image.open(file_stream).convert("RGB")
    return (pytesseract.image_to_string(img) or "").strip()