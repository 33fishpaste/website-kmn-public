const DUMMY_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BAQAE/wOXwepAAAAASUVORK5CYII=';

function defaultThumbnailId(workId, category, itemId) {
  return `${workId}_${category}_${itemId}_thumbnail`;
}

async function loadSeries() {
  const seriesId = window.location.hash.substring(1);
  const [seriesData, worksData, charData, stageData, soundData, itemData, techData, catsData, imagesData] = await Promise.all([
    DBUtil.getJson('series.json'),
    DBUtil.getJson('works.json'),
    DBUtil.getJson('characters.json'),
    DBUtil.getJson('stages.json'),
    DBUtil.getJson('sounds.json'),
    DBUtil.getJson('items.json'),
    DBUtil.getJson('techniques.json'),
    DBUtil.getJson('categories.json'),
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

  const series = seriesData.series.find(s => s.id === seriesId);
  if (!series) return;

  document.getElementById('seriesName').textContent = series.title;
  document.getElementById('seriesBreadcrumb').textContent = series.title;

  const container = document.getElementById('seriesSections');

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
  function populateSeries(seriesObj) {
    seriesSelect.innerHTML = '';
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'すべて';
    seriesSelect.appendChild(all);
    if (seriesObj) {
      seriesObj.works.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = w.name;
        seriesSelect.appendChild(opt);
      });
    } else {
      seriesData.series.forEach(s => {
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

  populateSeries(series);

  function collectSubCategories(map, prop) {
    const list = [];
    series.works.forEach(w => {
      const wdata = map[w.id];
      if (!wdata || !wdata.sub_categories) return;
      const detailMap = wdata[prop] || {};
      wdata.sub_categories.forEach(sc => {
        const items = (sc[prop] || sc.items || []).map(it => ({ ...it, workId: w.id }));
        list.push({ title: sc.title || '', icon: sc.icon || '', workId: w.id, items, details: detailMap });
      });
    });
    return list;
  }

  function createSection(title, cat, subcats) {
    if (subcats.length === 0) return;
    const section = document.createElement('section');
    section.className = 'category-section';
    section.dataset.category = cat;

    const header = document.createElement('div');
    header.className = 'category-header';
    const info = catsData.categories.find(c => c.id === cat);
    if (info) {
      header.innerHTML = `<div class="category-icon">${info.icon}</div><h3 class="category-title">${title}</h3>`;
    } else {
      const h = document.createElement('h3');
      h.className = 'category-title';
      h.textContent = title;
      header.appendChild(h);
    }
    section.appendChild(header);

    subcats.forEach(sc => {
      if (!sc.items || sc.items.length === 0) return;
      const subHeader = document.createElement('div');
      subHeader.className = 'sub-category-header';
      subHeader.textContent = sc.title;
      section.appendChild(subHeader);

      const grid = document.createElement('div');
      grid.className = 'phantom-grid';
      sc.items.forEach(it => {
        const card = document.createElement('div');
        card.className = 'phantom-card';
        const detail = (sc.details || {})[it.id] || {};
        const thumbId = detail.thumbnail || it.thumbnail ||
          defaultThumbnailId(it.workId || sc.workId, cat, it.id);
        const info = imageMap[thumbId] || { base64: '', ext: 'png', file_path: '' };
          let src = '';
          if (info.file_path && info.file_path.length > 0) {
            src = info.file_path;
          } else {
            const b64 = info.base64 && info.base64.length > 0 ? info.base64 : DUMMY_BASE64;
            src = `data:image/${info.ext};base64,${b64}`;
          }
        card.innerHTML = `<a href="detail.html?category=${cat}&id=${it.id}"><div class="phantom-image-placeholder" style="background-image:url('${src}')"></div><div class="phantom-name">${it.name}</div></a>`;
        grid.appendChild(card);
      });
      section.appendChild(grid);
    });

    container.appendChild(section);
  }

  createSection('作品', 'work', [{ title: '', items: series.works }]);
  createSection('キャラクター', 'character', collectSubCategories(charData.works, 'characters'));
  createSection('ステージ', 'stage', collectSubCategories(stageData.works, 'stages'));
  createSection('サウンド', 'sound', collectSubCategories(soundData.works, 'sounds'));
  createSection('アイテム', 'item', collectSubCategories(itemData.works, 'items'));
  createSection('技', 'technique', collectSubCategories(techData.works, 'techniques'));
}
loadSeries();
