/**
 * Robust IndexedDB wrapper for high-volume CRM storage (50,000+ leads)
 * Bypasses localStorage 5MB limit and provides fast, asynchronous local persistence.
 */

const DB_NAME = 'RuhitCRM_DB';
const DB_VERSION = 2;

export const STORES = {
  LEADS: 'leads',
  MEETINGS: 'meetings',
  USERS: 'users',
  CAMPAIGNS: 'campaigns',
  BRANDS: 'brands',
  ACCOUNTS: 'accounts',
  LISTS: 'lists',
  EMAIL_COPIES: 'email_copies',
  NOTES: 'notes',
  TASKS: 'tasks',
  SYNC_META: 'sync_meta',
} as const;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an entire collection to IndexedDB in a single transaction
 */
export async function saveCollection<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Clear existing records in store to maintain true mirror
      store.clear();

      items.forEach((item) => {
        store.put(item);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error saving to ${storeName}:`, err);
  }
}

/**
 * Load all items from a collection
 */
export async function loadCollection<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as T[]) || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error loading from ${storeName}:`, err);
    return [];
  }
}

/**
 * Save or update a single item in a collection
 */
export async function putItem<T extends { id: string }>(storeName: string, item: T): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put(item);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error putting item in ${storeName}:`, err);
  }
}

/**
 * Delete a single item by id
 */
export async function deleteItem(storeName: string, id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error deleting item ${id} from ${storeName}:`, err);
  }
}
