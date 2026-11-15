export type CassetteSide = {
  kind: 'audio';
  blob: Blob;
  fileName: string;
} | {
  kind: 'audio';
  src: string;
  fileName: string;
} | {
  kind: 'video';
  youtubeId: string;
} | {
  kind: 'soundcloud';
  trackUrl: string;
} | null;

export interface Cassette {
  id: string;
  title: string;
  sideATitle: string;
  sideBTitle: string;
  sideA: CassetteSide;
  sideB: CassetteSide;
  color: string;
  locked: boolean;
}

interface PlaybackProgress {
  key: string;
  seconds: number;
}

const databaseName = 'chris-music-cassettes';
const databaseVersion = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('cassettes')) {
        database.createObjectStore('cassettes', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('progress')) {
        database.createObjectStore('progress', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open music storage.'));
    request.onblocked = () => reject(new Error('Music storage is blocked by another open tab.'));
  });
}

async function readStore<T>(storeName: string, key?: IDBValidKey): Promise<T> {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = key === undefined ? store.getAll() : store.get(key);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error('Unable to read music storage.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Unable to read music storage.'));
    };
  });
}

async function writeStore<T>(storeName: string, value: T): Promise<void> {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Unable to save music storage.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('Music storage update was cancelled.'));
    };
  });
}

export async function loadCassettes(): Promise<Cassette[]> {
  return readStore<Cassette[]>('cassettes');
}

export async function saveCassette(cassette: Cassette): Promise<void> {
  return writeStore('cassettes', cassette);
}

export async function loadPlaybackProgress(key: string): Promise<number> {
  const progress = await readStore<PlaybackProgress | undefined>('progress', key);
  return progress?.seconds ?? 0;
}

export async function savePlaybackProgress(key: string, seconds: number): Promise<void> {
  return writeStore<PlaybackProgress>('progress', { key, seconds });
}
