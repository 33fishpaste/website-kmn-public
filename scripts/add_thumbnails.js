const fs = require('fs');
const path = require('path');

function updateFile(filePath, keyName) {
  const original = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(original);

  for (const [workId, work] of Object.entries(data.works || {})) {
    const items = work[keyName];
    if (!items) continue;
    for (const [id, obj] of Object.entries(items)) {
      obj.thumbnail = `${workId}_${keyName}_${id}_thumbnail`;
      obj.images = Array.from({ length: 5 }, (_, i) => `${workId}_${keyName}_${id}_images_${i + 1}`);
    }
  }

  const json = JSON.stringify(data, null, '\t');
  const withCRLF = json.replace(/\n/g, '\r\n');
  fs.writeFileSync(filePath, withCRLF);
}

updateFile(path.join(__dirname, '../data/characters.json'), 'characters');
updateFile(path.join(__dirname, '../data/sounds.json'), 'sounds');
updateFile(path.join(__dirname, '../data/stages.json'), 'stages');
