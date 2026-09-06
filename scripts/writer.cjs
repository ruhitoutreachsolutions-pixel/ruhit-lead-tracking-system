const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2];
if (!targetPath) {
  console.error('Target path required');
  process.exit(1);
}

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetPath, data, 'utf8');
  console.log('Successfully written ' + targetPath + ' (' + data.length + ' bytes)');
});
