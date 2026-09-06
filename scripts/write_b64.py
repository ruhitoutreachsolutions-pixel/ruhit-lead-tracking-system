import base64
import sys
import os

if len(sys.argv) < 3:
    print('Usage: python write_b64.py <filepath> <base64_string>')
    sys.exit(1)

filepath = sys.argv[1]
b64_content = sys.argv[2]
content = base64.b64decode(b64_content).decode('utf-8')

os.makedirs(os.path.dirname(filepath), exist_ok=True)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Successfully wrote {filepath} ({len(content)} chars)')
