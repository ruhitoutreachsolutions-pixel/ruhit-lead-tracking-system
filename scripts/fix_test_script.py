import json

with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['scripts']['test'] = 'npx vitest run'

with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)

print('Successfully set test script to npx vitest run')
