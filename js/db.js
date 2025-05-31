const DB_NAME = '33fishpaste_website_kmn';
const STORE_NAME = 'json';
const DB_VERSION = 1;
let dbPromise = null;
let initPromise = null;

const JSON_FILES = [
  'categories.json',
  'characters.json',
  'image_resources.json',
  'sound-resources.json',
  'items.json',
  'phantoms.json',
  'series.json',
  'sounds.json',
  'stages.json',
  'techniques.json',
  'works.json'
];

async function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'name' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  const db = await dbPromise;
  if (!initPromise) {
    if (location.protocol === 'file:') {
      initPromise = Promise.resolve();
    } else {
      initPromise = initData(db);
    }
  }
  await initPromise;
  return db;
}

function initData(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();
    countReq.onsuccess = async () => {
      if (countReq.result > 0) {
        resolve();
        return;
      }
      try {
        const items = [];
        for (const file of JSON_FILES) {
          const res = await fetch('data/' + file);
          const data = await res.json();
          items.push({ name: file, data });
        }
        const txw = db.transaction(STORE_NAME, 'readwrite');
        const storeW = txw.objectStore(STORE_NAME);
        items.forEach(item => storeW.put(item));
        txw.oncomplete = () => resolve();
        txw.onerror = () => reject(txw.error);
      } catch (err) {
        reject(err);
      }
    };
    countReq.onerror = () => reject(countReq.error);
  });
}

async function getJson(file) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(file);
    getReq.onsuccess = async () => {
      if (getReq.result) {
        resolve(getReq.result.data);
      } else {
        if (location.protocol === 'file:') {
          reject(new Error('Data not found in IndexedDB'));
          return;
        }
        try {
          const res = await fetch('data/' + file);
          const data = await res.json();
          const txw = db.transaction(STORE_NAME, 'readwrite');
          txw.objectStore(STORE_NAME).put({ name: file, data });
          txw.oncomplete = () => resolve(data);
          txw.onerror = () => reject(txw.error);
        } catch (err) {
          reject(err);
        }
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

async function clearAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function putJson(file, data) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ name: file, data });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

window.DBUtil = { getJson, clearAll, putJson };
