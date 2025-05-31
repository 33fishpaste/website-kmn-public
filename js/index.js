async function loadTop() {
  const [seriesData, catData] = await Promise.all([
    DBUtil.getJson('series.json'),
    DBUtil.getJson('categories.json')
  ]);

  const seriesGrid = document.getElementById('seriesGrid');
  seriesData.series.forEach(s => {
    const card = document.createElement('div');
    card.className = 'era-card hover-lift';
    card.innerHTML = `<a href="series.html#${s.id}"><div class="era-title">${s.title}</div></a>`;
    seriesGrid.appendChild(card);
  });

  const catGrid = document.getElementById('categoryGrid');
  catData.categories.forEach(c => {
    const item = document.createElement('div');
    item.className = 'category-item hover-lift';
    item.innerHTML = `<a href="category.html?category=${c.id}"><div class="category-icon">${c.icon}</div><div class="category-name">${c.name}</div></a>`;
    catGrid.appendChild(item);
  });
}

loadTop();
