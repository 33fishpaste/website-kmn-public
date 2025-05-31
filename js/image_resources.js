async function loadTable() {
  const [resData, charData, soundData, stageData, worksData] = await Promise.all([
    DBUtil.getJson('image_resources.json').catch(() => ({ images: [] })),
    DBUtil.getJson('characters.json'),
    DBUtil.getJson('sounds.json'),
    DBUtil.getJson('stages.json'),
    DBUtil.getJson('works.json'),
  ]);

  const workTitle = {};
  (worksData.list || []).forEach(w => { workTitle[w.id] = w.name; });

  function defaultThumbnailId(workId, category, itemId) {
    return `${workId}_${category}_${itemId}_thumbnail`;
  }

  function defaultImageId(workId, category, itemId, index) {
    return `${workId}_${category}_${itemId}_images_${index}`;
  }

  const imgInfo = {};
  let resMap = {};
  (resData.images || []).forEach(r => { resMap[r.id] = r; });

  function collect(data, key, category) {
    for (const [workId, work] of Object.entries(data.works || {})) {
      const items = work[key] || {};
      for (const [itemId, item] of Object.entries(items)) {
        const baseInfo = {
          name: item.name || '',
          workId,
          workName: workTitle[workId] || '',
          category,
          itemId
        };
        const tId = item.thumbnail || defaultThumbnailId(workId, category, itemId);
        imgInfo[tId] = { ...baseInfo };

        if (Array.isArray(item.images) && item.images.length) {
          item.images.forEach(id => {
            imgInfo[id] = { ...baseInfo };
          });
        } else {
          for (let i = 1; i < 10; i++) {
            const id = defaultImageId(workId, category, itemId, i);
            if (resMap[id]) imgInfo[id] = { ...baseInfo }; else break;
          }
        }
      }
    }
  }

  collect(charData, 'characters', 'character');
  collect(soundData, 'sounds', 'sound');
  collect(stageData, 'stages', 'stage');

  const tbody = document.getElementById('imageTableBody');
  const statusEl = document.getElementById('status');
  let saveTimer;

  async function saveData() {
    const rows = tbody.querySelectorAll('tr');
    const images = Array.from(rows).map(row => ({
      id: row.querySelector('.id-input').value,
      file_name: row.querySelector('.name-input').value,
      ext: row.querySelector('.ext-input').value || 'png',
      file_path: row.querySelector('.path-input').value
    }));
    await DBUtil.putJson('image_resources.json', { images });
    statusEl.textContent = '保存しました';
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveData, 500);
  }
  Object.keys(imgInfo).forEach(id => {
    const info = imgInfo[id];
    const saved = resMap[id] || {};
    const fileName = saved.file_name || '';
    const ext = saved.ext || 'png';
    const filePath =
      saved.file_path ||
      (fileName
        ? `resources/images/${info.workId}/${info.category}/${info.itemId}/${fileName}.${ext}`
        : '');

    const tr = document.createElement('tr');
    tr.dataset.workId = info.workId;
    tr.dataset.category = info.category;
    tr.dataset.itemId = info.itemId;

    const idTd = document.createElement('td');
    const idInput = document.createElement('input');
    idInput.type = 'text';
    idInput.className = 'text-input id-input';
    idInput.value = id;
    idInput.disabled = true;
    idTd.appendChild(idInput);
    tr.appendChild(idTd);

    const workTd = document.createElement('td');
    workTd.textContent = info.workId;
    tr.appendChild(workTd);

    const descTd = document.createElement('td');
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'text-input desc-input';
    descInput.value = info.name || '';
    descInput.disabled = true;
    descTd.appendChild(descInput);
    tr.appendChild(descTd);

    const pathTd = document.createElement('td');
    const pathInput = document.createElement('input');
    pathInput.type = 'text';
    pathInput.className = 'text-input path-input';
    pathInput.readOnly = true;
    pathInput.value = filePath;
    pathTd.appendChild(pathInput);
    tr.appendChild(pathTd);

    const nameTd = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'text-input name-input';
    nameInput.value = fileName;
    nameTd.appendChild(nameInput);
    tr.appendChild(nameTd);

    const extTd = document.createElement('td');
    const extInput = document.createElement('input');
    extInput.type = 'text';
    extInput.className = 'text-input ext-input';
    extInput.value = ext;
    extTd.appendChild(extInput);
    tr.appendChild(extTd);

    const previewTd = document.createElement('td');
    const img = document.createElement('img');
    previewTd.appendChild(img);
    tr.appendChild(previewTd);

    const fileTd = document.createElement('td');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'file-input';
    fileInput.accept = 'image/*';
    fileTd.appendChild(fileInput);
    tr.appendChild(fileTd);

    function updatePath() {
      const n = nameInput.value.trim();
      const e = (extInput.value || 'png').trim();
      if (n) {
        pathInput.value =
          `resources/images/${info.workId}/${info.category}/${info.itemId}/${n}.${e}`;
      } else {
        pathInput.value = '';
      }
    }

    function setPreviewFromPath() {
      if (pathInput.value) {
        img.src = pathInput.value;
      } else {
        img.removeAttribute('src');
      }
    }

    updatePath();
    if (filePath) setPreviewFromPath();

    nameInput.addEventListener('input', () => { updatePath(); setPreviewFromPath(); scheduleSave(); });
    extInput.addEventListener('input', () => { updatePath(); setPreviewFromPath(); scheduleSave(); });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) {
        const idx = file.name.lastIndexOf('.');
        const base = idx >= 0 ? file.name.slice(0, idx) : file.name;
        const extension = idx >= 0 ? file.name.slice(idx + 1).toLowerCase() : '';
        nameInput.value = base;
        extInput.value = extension;
        updatePath();
        img.src = URL.createObjectURL(file);
      }
      scheduleSave();
    });

    tbody.appendChild(tr);
  });

  document.getElementById('saveBtn').addEventListener('click', saveData);
}

loadTable();
