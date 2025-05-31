const fs = require('fs');

function collect(file, key) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = [];
  for (const work of Object.values(data.works || {})) {
    const items = work[key] || {};
    for (const [id, item] of Object.entries(items)) {
      if (Array.isArray(item.images)) {
        for (const img of item.images) {
          result.push({id: img, name: item.name});
        }
      }
    }
  }
  return result;
}

const ch = collect('data/characters.json', 'characters');
const so = collect('data/sounds.json', 'sounds');
const st = collect('data/stages.json', 'stages');
const all = [...ch, ...so, ...st];
const map = new Map();
const duplicates = new Set();
for (const {id, name} of all) {
  if (map.has(id)) {
    duplicates.add(id);
  } else {
    map.set(id, {id, description: name, base64: '', ext: 'png'});
  }
}

fs.writeFileSync('data/image_resources.json', JSON.stringify({images: Array.from(map.values())}, null, 2));
console.log('duplicates:', Array.from(duplicates));
