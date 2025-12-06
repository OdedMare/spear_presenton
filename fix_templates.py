
import os
import re

BASE_DIR = "servers/nextjs/presentation-templates"

COMPLEX_REPLACEMENTS = [
    (r"image\.src", "image.__image_url__"),
    (r"image\.alt", "image.__image_prompt__"),
    (r"member\.image\.src", "member.image.__image_url__"),
    (r"img\.src\.src", "img.src.__image_url__"),
    (r"img\.src\.alt", "img.src.__image_prompt__"),
]

def fix_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()
    
    original_content = content
    
    for pattern, replacement in COMPLEX_REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
        
    if content != original_content:
        print(f"Fixing {filepath}")
        with open(filepath, "w") as f:
            f.write(content)

def main():
    if not os.path.exists(BASE_DIR):
        print(f"Error: {BASE_DIR} does not exist.")
        return

    print(f"Scanning {BASE_DIR}...")
    
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            if file.endswith(".tsx") and not file.startswith("Example"):
                filepath = os.path.join(root, file)
                fix_file(filepath)
        
    print("Done!")

if __name__ == "__main__":
    main()
