const DB_NAME = 'trade-offline';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pdvs'))
        db.createObjectStore('pdvs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('queue'))
        db.createObjectStore('queue', { keyPath: '_qid', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCatalog(pdvs) {
  const db = await openDB();
  const tx = db.transaction('pdvs', 'readwrite');
  const store = tx.objectStore('pdvs');
  store.clear();
  for (const pdv of pdvs) store.put(pdv);
  return new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function loadCachedCatalog() {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction('pdvs', 'readonly');
      const req = tx.objectStore('pdvs').getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return [];
  }
}

export async function enqueueOperation(op) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('queue', 'readwrite');
    const req = tx.objectStore('queue').add({ ...op, _ts: Date.now() });
    req.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('offline-queued'));
      res(req.result);
    };
    req.onerror = () => rej(req.error);
  });
}

export async function getPendingQueue() {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction('queue', 'readonly');
      const req = tx.objectStore('queue').getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return [];
  }
}

export async function removeQueueItem(qid) {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction('queue', 'readwrite');
      const req = tx.objectStore('queue').delete(qid);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
  } catch {
    // ignore
  }
}
