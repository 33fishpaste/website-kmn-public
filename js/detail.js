const config = {
  character: {file: 'data/characters.json', worksKey: 'works', itemKey: 'characters', title: 'キャラクター'},
  technique: {file: 'data/techniques.json', worksKey: 'works', itemKey: 'techniques', title: '技'},
  item: {file: 'data/items.json', worksKey: 'works', itemKey: 'items', title: 'アイテム'},
  stage: {file: 'data/stages.json', worksKey: 'works', itemKey: 'stages', title: 'ステージ'},
  sound: {file: 'data/sounds.json', worksKey: 'works', itemKey: 'sounds', title: 'サウンド'},
  work: {file: 'data/works.json', worksKey: 'items', itemKey: 'items', title: '作品'}
};

const DUMMY_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BAQAE/wOXwepAAAAASUVORK5CYII=';

function defaultThumbnailId(workId, category, itemId) {
  return `${workId}_${category}_${itemId}_thumbnail`;
}

function defaultImageId(workId, category, itemId, index) {
  return `${workId}_${category}_${itemId}_images_${index}`;
}

async function loadDetail() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || 'character';
  const id = params.get('id');
  const conf = config[category];
  const [data, imagesData] = await Promise.all([
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
  let item = null;
  let workId = null;
  if (conf.worksKey) {
    const works = data[conf.worksKey];
    for (const w in works) {
      const obj = works[w];
      if (obj && obj[conf.itemKey] && obj[conf.itemKey][id]) {
        item = obj[conf.itemKey][id];
        workId = w;
        break;
      }
    }
  } else if (data[conf.itemKey]) {
    item = data[conf.itemKey][id];
  }
  if (!item) {
    document.getElementById('detailContainer').textContent = 'Not found';
    return;
  }

  document.getElementById('breadcrumbCategoryLink').textContent = conf.title;
  document.getElementById('breadcrumbCategoryLink').href = `category.html?category=${category}`;
  document.getElementById('breadcrumbName').textContent = item.name;

  const container = document.getElementById('detailContainer');
  let html = '';

  html += '<div class="phantom-header">';
  if (item.kana) html += `<div class="phantom-kana">${item.kana}</div>`;
  html += `<h1 class="phantom-name">${item.name}</h1>`;
  html += '</div>';

  const imageIds = (item.images && item.images.length)
    ? item.images
    : (() => {
        const ids = [];
        for (let i = 1; i < 10; i++) {
          const candidate = defaultImageId(workId || id, category, id, i);
          if (imageMap[candidate]) ids.push(candidate); else break;
        }
        return ids;
      })();
  if (imageIds.length) {
    const imagesArr = imageIds.map(id => {
      const info = imageMap[id] || { base64: '', ext: 'png', file_path: '' };
      if (info.file_path && info.file_path.length > 0) {
        return info.file_path;
      }
      const b64 = info.base64 && info.base64.length > 0 ? info.base64 : DUMMY_BASE64;
      return `data:image/${info.ext};base64,` + b64;
    });
    html += '<div class="phantom-image-container">';
    html += `<div class="main-image-wrapper"><div class="phantom-image-placeholder" id="mainImage" style="background-image:url('${imagesArr[0]}')"></div></div>`;
    html += '<div class="image-nav">';
    html += '<button class="image-nav-button" id="prevImage">←</button>';
    html += `<span class="image-counter"><span id="currentIndex">1</span> / <span id="totalImages">${imagesArr.length}</span></span>`;
    html += '<button class="image-nav-button" id="nextImage">→</button>';
    html += '</div>';
    html += '<div class="image-gallery">' + imagesArr.map((img,i)=>`<div class="gallery-thumbnail${i===0?' active':''}" data-index="${i}" style="background-image:url('${img}')"></div>`).join('') + '</div>';
    html += '</div>';
  }

  container.innerHTML = html;

  const infoDiv = document.createElement('div');
  infoDiv.className = 'phantom-info';

  if (item.info && item.info.length) {
    const infoSection = document.createElement('div');
    infoSection.className = 'info-section';
    item.info.forEach(row => {
      infoSection.innerHTML += `<div class="info-row"><div class="info-label">${row.label}</div><div class="info-value">${row.value}</div></div>`;
    });
    infoDiv.appendChild(infoSection);
  }

  if (item.description && item.description.length) {
    const desc = document.createElement('div');
    desc.className = 'description-section';
    desc.innerHTML = '<h2 class="section-title">説明</h2><div class="description-text">' + item.description.map(p=>`<p>${p}</p>`).join('') + '</div>';
    infoDiv.appendChild(desc);
  }

  if (item.stats && item.stats.length) {
    const stats = document.createElement('div');
    stats.className = 'stats-section';
    stats.innerHTML = '<div class="stats-grid">' + item.stats.map(s=>`<div class="stat-item"><span class="stat-label">${s.label}</span><span class="stat-value">${s.value}</span></div>`).join('') + '</div>';
    infoDiv.appendChild(stats);
  }

  infoDiv.innerHTML += `
    <div class="share-buttons">
      <a href="#" class="share-button twitter"><span>Twitter</span></a>
      <a href="#" class="share-button facebook"><span>Facebook</span></a>
      <a href="#" class="share-button line"><span>LINE</span></a>
    </div>
    <div class="navigation-buttons">
      <a href="#" class="nav-button prev">前へ</a>
      <a href="#" class="nav-button next">次へ</a>
    </div>`;

  container.appendChild(infoDiv);

  const sidebar = document.getElementById('detailSidebar');
  let sidebarHtml = '';
  if (item.relatedCharacters && item.relatedCharacters.length) {
    sidebarHtml += '<div class="sidebar-section"><h3 class="sidebar-title">関連キャラクター</h3><ul class="related-links">';
    item.relatedCharacters.forEach(cid => { sidebarHtml += `<li><a href="detail.html?category=character&id=${cid}">${cid}</a></li>`; });
    sidebarHtml += '</ul></div>';
  }
  if (item.relatedPhantoms && item.relatedPhantoms.length) {
    sidebarHtml += '<div class="sidebar-section"><h3 class="sidebar-title">関連する怪人</h3><ul class="related-links">';
    item.relatedPhantoms.forEach(pid => { sidebarHtml += `<li><a href="detail.html?category=character&id=${pid}">${pid}</a></li>`; });
    sidebarHtml += '</ul></div>';
  }
  if (item.relatedItems && item.relatedItems.length) {
    sidebarHtml += '<div class="sidebar-section"><h3 class="sidebar-title">関連アイテム</h3><ul class="related-links">';
    item.relatedItems.forEach(name => { sidebarHtml += `<li><a href="#">${name}</a></li>`; });
    sidebarHtml += '</ul></div>';
  }
  if (item.relatedStages && item.relatedStages.length) {
    sidebarHtml += '<div class="sidebar-section"><h3 class="sidebar-title">関連ステージ</h3><ul class="related-links">';
    item.relatedStages.forEach(name => { sidebarHtml += `<li><a href="#">${name}</a></li>`; });
    sidebarHtml += '</ul></div>';
  }
  if (item.relatedSounds && item.relatedSounds.length) {
    sidebarHtml += '<div class="sidebar-section"><h3 class="sidebar-title">関連サウンド</h3><ul class="related-links">';
    item.relatedSounds.forEach(name => { sidebarHtml += `<li><a href="#">${name}</a></li>`; });
    sidebarHtml += '</ul></div>';
  }
  if (item.relatedRiders && item.relatedRiders.length) {
    sidebarHtml += '<div class="sidebar-section"><h3 class="sidebar-title">この作品の仮面ライダー</h3><ul class="related-links">';
    item.relatedRiders.forEach(name => { sidebarHtml += `<li><a href="#">${name}</a></li>`; });
    sidebarHtml += '</ul></div>';
  }
  sidebar.innerHTML = sidebarHtml;

  if (imageIds.length) {
    const imagesArr = imageIds.map(id => {
      const info = imageMap[id] || { base64: '', ext: 'png', file_path: '' };
      if (info.file_path && info.file_path.length > 0) {
        return info.file_path;
      }
      const b64 = info.base64 && info.base64.length > 0 ? info.base64 : DUMMY_BASE64;
      return `data:image/${info.ext};base64,` + b64;
    });
    let currentImageIndex = 0;
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.gallery-thumbnail');
    const prevButton = document.getElementById('prevImage');
    const nextButton = document.getElementById('nextImage');
    const currentIndexSpan = document.getElementById('currentIndex');

    function updateMainImage(index) {
      currentImageIndex = index;
      mainImage.style.backgroundImage = `url('${imagesArr[index]}')`;
      thumbnails.forEach((thumb, i) => {
        if (i === index) thumb.classList.add('active'); else thumb.classList.remove('active');
      });
      currentIndexSpan.textContent = index + 1;
      prevButton.disabled = index === 0;
      nextButton.disabled = index === imagesArr.length - 1;
      mainImage.style.opacity = '0';
      setTimeout(() => { mainImage.style.opacity = '1'; }, 100);
    }

    thumbnails.forEach((thumb, index) => { thumb.addEventListener('click', () => updateMainImage(index)); });
    prevButton.addEventListener('click', () => { if (currentImageIndex > 0) updateMainImage(currentImageIndex - 1); });
    nextButton.addEventListener('click', () => { if (currentImageIndex < imagesArr.length - 1) updateMainImage(currentImageIndex + 1); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && currentImageIndex > 0) updateMainImage(currentImageIndex - 1);
      else if (e.key === 'ArrowRight' && currentImageIndex < imagesArr.length - 1) updateMainImage(currentImageIndex + 1);
    });
    mainImage.style.transition = 'opacity 0.3s';
  }
}

loadDetail();
