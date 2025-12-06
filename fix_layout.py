
import os
import re

BASE_DIR = "servers/nextjs/presentation-templates"

# We want to replace "h-full w-full" with the standardized container classes
# including aspect-video to ensure it fills the slide area correctly.
TARGET_STRING = 'h-full w-full'
REPLACEMENT_STRING = 'w-full max-w-[1280px] aspect-video mx-auto relative overflow-hidden rounded-md h-full'

def fix_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()
    
    # Use simple string replacement as it's safer for this specific pattern
    # which we know we generated consistently.
    if TARGET_STRING in content:
        new_content = content.replace(TARGET_STRING, REPLACEMENT_STRING)
        
        if new_content != content:
            print(f"Fixing {filepath}")
            with open(filepath, "w") as f:
                f.write(new_content)

def main():
    if not os.path.exists(BASE_DIR):
        print(f"Error: {BASE_DIR} does not exist.")
        return

    print(f"Scanning {BASE_DIR}...")
    
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            # Only target our generated slides (not Example ones)
            if file.endswith(".tsx") and not file.startswith("Example"):
                filepath = os.path.join(root, file)
                fix_file(filepath)
        
    print("Done!")

if __name__ == "__main__":
    main()
