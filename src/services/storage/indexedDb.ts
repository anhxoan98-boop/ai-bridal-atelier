/**
 * Minimal promise wrapper around IndexedDB (no dependency).
 * Used for local mode (no Supabase) and for crash-safe draft autosave.
 */
const DB_NAME = 'ai-bridal-atelier'
const DB_VERSION = 1
export const IDB_STORES = ['projects', 'drafts', 'blobs'] as const
export type IdbStore = (typeof IDB_STORES)[number]

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const name of IDB_STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Could not open local storage'))
  })
  dbPromise.catch(() => {
    dbPromise = null
  })
  return dbPromise
}

function run<T>(store: IdbStore, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = fn(tx.objectStore(store))
        tx.oncomplete = () => resolve(req.result)
        tx.onerror = () => reject(tx.error ?? new Error('Local storage error'))
        tx.onabort = () => reject(tx.error ?? new Error('Local storage aborted'))
      }),
  )
}

export const idb = {
  get<T>(store: IdbStore, key: string): Promise<T | undefined> {
    return run<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>)
  },
  set(store: IdbStore, key: string, value: unknown): Promise<IDBValidKey> {
    return run(store, 'readwrite', (s) => s.put(value, key))
  },
  delete(store: IdbStore, key: string): Promise<undefined> {
    return run(store, 'readwrite', (s) => s.delete(key))
  },
  getAll<T>(store: IdbStore): Promise<T[]> {
    return run<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)
  },
  keys(store: IdbStore): Promise<IDBValidKey[]> {
    return run(store, 'readonly', (s) => s.getAllKeys())
  },
}
