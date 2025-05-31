const DUMMY_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BAQAE/wOXwepAAAAASUVORK5CYII=';

const config = {
  character: {file: 'data/characters.json', prop: 'characters', title: 'キャラクター', en: 'CHARACTERS'},
  item: {file: 'data/items.json', prop: 'items', title: 'アイテム', en: 'ITEMS'},
  stage: {file: 'data/stages.json', prop: 'stages', title: 'ステージ', en: 'STAGES'},
  sound: {file: 'data/sounds.json', prop: 'sounds', title: 'BGM', en: 'BGM'},
  technique: {file: 'data/techniques.json', prop: 'techniques', title: '技', en: 'TECHNIQUES'},
  work: {file: 'data/works.json', listKey: 'list', itemsKey: 'items', title: '作品', en: 'WORKS'}
};

function defaultThumbnailId(workId, category, itemId) {
  return `${workId}_${category}_${itemId}_thumbnail`;
}

async function loadCategory() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category') || 'character';
  const conf = config[cat];

  const [worksData, catsData, data, imagesData] = await Promise.all([
    DBUtil.getJson('series.json'),
    DBUtil.getJson('categories.json'),
    DBUtil.getJson(conf.file.replace('data/','')),
    DBUtil.getJson('image_resources.json')
  ]);

  const imageMap = {};
  if (imagesData.images) {
    imagesData.images.forEach(img => {
      imageMap[img.id] = {
        base64: img.base64,
        ext: img.ext || 'png',
        file_path: img.file_path || ''
      };
    });
  }

  const filterContainer = document.getElementById('category-filters');
  if (filterContainer) {
    catsData.categories.forEach(c => {
      const label = document.createElement('label');
      label.style.display = 'block';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.dataset.cat = c.id;
      label.appendChild(cb);
      label.append(' ' + c.name);
      filterContainer.appendChild(label);
    });
    filterContainer.addEventListener('change', e => {
      if (e.target.dataset.cat) {
        const section = document.querySelector(`[data-category="${e.target.dataset.cat}"]`);
        if (section) section.style.display = e.target.checked ? '' : 'none';
      }
    });
  }

  const seriesSelect = document.getElementById('series-select');
  const hashSeries = window.location.hash.substring(1);

  function populateSeries(series) {
    seriesSelect.innerHTML = '';
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'すべて';
    seriesSelect.appendChild(all);
    if (series) {
      document.getElementById('seriesTitle').textContent = series.title;
      series.works.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = w.name;
        seriesSelect.appendChild(opt);
      });
    } else {
      document.getElementById('seriesTitle').textContent = '';
      worksData.series.forEach(s => {
        const group = document.createElement('optgroup');
        group.label = s.title;
        const allOpt = document.createElement('option');
        allOpt.value = `${s.id}-all`;
        allOpt.textContent = 'すべて';
        group.appendChild(allOpt);
        s.works.forEach(w => {
          const opt = document.createElement('option');
          opt.value = w.id;
          opt.textContent = w.name;
          group.appendChild(opt);
        });
        seriesSelect.appendChild(group);
      });
    }
  }

  const selectedSeries = worksData.series.find(s => s.id === hashSeries);
  populateSeries(selectedSeries);
  document.getElementById('breadcrumbCategory').textContent = conf.title;
  document.getElementById('categoryTitle').textContent = conf.title;
  document.getElementById('categoryTitleEn').textContent = conf.en;

  const container = document.getElementById('categorySections');
  let count = 0;

  if (cat === 'work') {
    const grid = document.createElement('div');
    grid.className = 'phantom-grid';
    grid.dataset.category = cat;

    let items = [];
    if (selectedSeries) {
      items = selectedSeries.works;
    } else {
      worksData.series.forEach(s => items.push(...s.works));
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'phantom-card';
      const thumbId = item.thumbnail || defaultThumbnailId(item.id, 'work', item.id);
      const info = imageMap[thumbId] || { base64: '', ext: 'png', file_path: '' };
      let src = '';
      if (info.file_path && info.file_path.length > 0) {
        src = info.file_path;
      } else {
        const b64 = info.base64 && info.base64.length > 0 ? info.base64 : DUMMY_BASE64;
        src = `data:image/${info.ext};base64,${b64}`;
      }
      card.innerHTML = `<a href="detail.html?category=${cat}&id=${item.id}"><div class="phantom-image-placeholder" style="background-image:url('${src}')"></div><div class="phantom-name">${item.name}</div></a>`;
      grid.appendChild(card);
      count++;
    });
    container.appendChild(grid);
  } else {
    const worksList = [];
    if (selectedSeries) {
      worksList.push(...selectedSeries.works);
    } else {
      worksData.series.forEach(s => worksList.push(...s.works));
    }

    worksList.forEach(w => {
      const wdata = data.works && data.works[w.id];
      if (!wdata || !wdata.sub_categories) return;
      const detailMap = wdata[conf.prop] || {};
      const section = document.createElement('section');
      section.className = 'work-section';
      const header = document.createElement('div');
      header.className = 'work-header';
      header.textContent = w.name;
      section.appendChild(header);

      wdata.sub_categories.forEach(sc => {
        const items = sc[conf.prop] || sc.items || [];
        if (items.length === 0) return;
        const subHeader = document.createElement('div');
        subHeader.className = 'sub-category-header';
        subHeader.textContent = sc.title;
        section.appendChild(subHeader);

        const grid = document.createElement('div');
        grid.className = 'phantom-grid';
        items.forEach(item => {
          const card = document.createElement('div');
          card.className = 'phantom-card';
          const detail = detailMap[item.id] || {};
          const thumbId = detail.thumbnail || item.thumbnail ||
            defaultThumbnailId(w.id, cat, item.id);
          const info = imageMap[thumbId] || { base64: '', ext: 'png', file_path: '' };
          let src = '';
          if (info.file_path && info.file_path.length > 0) {
            src = info.file_path;
          } else {
            const b64 = info.base64 && info.base64.length > 0 ? info.base64 : DUMMY_BASE64;
            src = `data:image/${info.ext};base64,${b64}`;
          }
          card.innerHTML = `<a href="detail.html?category=${cat}&id=${item.id}"><div class="phantom-image-placeholder" style="background-image:url('${src}')"></div><div class="phantom-name">${item.name}</div></a>`;
          grid.appendChild(card);
          count++;
        });
        section.appendChild(grid);
      });

      container.appendChild(section);
    });
  }

  document.getElementById('resultCount').textContent = count;
}

loadCategory();

