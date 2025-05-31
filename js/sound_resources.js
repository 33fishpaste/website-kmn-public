async function loadTable() {
  const [resData, soundsData, worksData] = await Promise.all([
    DBUtil.getJson('sound-resources.json').catch(() => ({ sounds: [] })),
    DBUtil.getJson('sounds.json'),
    DBUtil.getJson('works.json'),
  ]);

  const workTitle = {};
  (worksData.list || []).forEach(w => { workTitle[w.id] = w.name; });

  const soundInfo = {};
  for (const [workId, work] of Object.entries(soundsData.works || {})) {
    const wName = workTitle[workId] || '';
    for (const item of Object.values(work.sounds || {})) {
      if (item.sound) {
        soundInfo[item.sound] = { name: item.name || '', workId: workId, workName: wName };
      }
    }
  }

  const resMap = {};
  (resData.sounds || []).forEach(r => { resMap[r.id] = r; });

  const tbody = document.getElementById('soundTableBody');
  const statusEl = document.getElementById('status');
  let saveTimer;

  async function saveData() {
    const rows = tbody.querySelectorAll('tr');
    const sounds = Array.from(rows).map(row => ({
      id: row.querySelector('.id-input').value,
      description: row.querySelector('.desc-input').value,
      file_name: row.querySelector('.name-input').value,
      ext: row.querySelector('.ext-input').value || 'mp3',
      file_path: row.querySelector('.path-input').value
    }));
    await DBUtil.putJson('sound-resources.json', { sounds });
    statusEl.textContent = '保存しました';
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveData, 500);
  }
  Object.keys(soundInfo).forEach(id => {
    const info = soundInfo[id];
    const saved = resMap[id] || {};
    const fileName = saved.file_name || '';
    const ext = saved.ext || 'mp3';
    const desc = saved.description || info.name;
    const filePath =
      saved.file_path ||
      (fileName
        ? `resources/sounds/${info.workId}/${fileName}.${ext}`
        : '');

    const tr = document.createElement('tr');
    tr.dataset.workId = info.workId;

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
    descInput.value = desc || '';
    descTd.appendChild(descInput);
    tr.appendChild(descTd);
    descInput.addEventListener('input', scheduleSave);

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
    const audio = document.createElement('audio');
    audio.controls = true;
    previewTd.appendChild(audio);
    tr.appendChild(previewTd);

    const fileTd = document.createElement('td');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'file-input';
    fileInput.accept = 'audio/*';
    fileTd.appendChild(fileInput);
    tr.appendChild(fileTd);

    function updatePath() {
      const n = nameInput.value.trim();
      const e = (extInput.value || 'mp3').trim();
      if (n) {
        pathInput.value = `resources/sounds/${info.workId}/${n}.${e}`;
      } else {
        pathInput.value = '';
      }
    }

    function setPreviewFromPath() {
      if (pathInput.value) {
        audio.src = pathInput.value;
      } else {
        audio.removeAttribute('src');
        audio.load();
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
        audio.src = URL.createObjectURL(file);
      }
      scheduleSave();
    });

    tbody.appendChild(tr);
  });

  document.getElementById('saveBtn').addEventListener('click', saveData);
}

loadTable();

