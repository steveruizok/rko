// From https://github.com/jakearchibald/idb-keyval/blob/main/src/index.ts
import safariFix from 'safari-14-idb-fix'

export function promisifyRequest<T = undefined>(
  request: IDBRequest<T> | IDBTransaction
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // @ts-ignore - file size hacks
    request.oncomplete = request.onsuccess = () => resolve(request.result)
    // @ts-ignore - file size hacks
    request.onabort = request.onerror = () => reject(request.error)
  })
}

export function createStore(dbName: string, storeName: string): UseStore {
  const dbp = safariFix().then(() => {
    const request = indexedDB.open(dbName)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    return promisifyRequest(request)
  })

  return (txMode, callback) =>
    dbp.then((db) =>
      callback(db.transaction(storeName, txMode).objectStore(storeName))
    )
}

export type UseStore = <T>(
  txMode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => T | PromiseLike<T>
) => Promise<T>

let defaultGetStoreFunc: UseStore | undefined

function defaultGetStore() {
  if (!defaultGetStoreFunc) {
    defaultGetStoreFunc = createStore('keyval-store', 'keyval')
  }
  return defaultGetStoreFunc
}

/**
 * Get a value by its key.
 *
 * @param key
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export function get<T = any>(
  key: IDBValidKey,
  customStore = defaultGetStore()
): Promise<T | undefined> {
  return customStore('readonly', (store) => promisifyRequest(store.get(key)))
}

export function set(
  key: IDBValidKey,
  value: any,
  customStore = defaultGetStore()
): Promise<void> {
  return customStore('readwrite', (store) => {
    store.put(value, key)
    return promisifyRequest(store.transaction)
  })
}
