import sys, os
target = sys.argv[1]
if os.path.dirname(target):
    os.makedirs(os.path.dirname(target), exist_ok=True)
content = sys.stdin.read()
with open(target, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Wrote {target} ({len(content)} bytes)')
