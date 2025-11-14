import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState
} from "react";

export interface GenericStringStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

class GenericStringInMemoryStorage implements GenericStringStorage {
  #store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, value);
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }
}

type StorageContextState = {
  storage: GenericStringStorage;
};

const StorageContext = createContext<StorageContextState | undefined>(undefined);

export function useInMemoryStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useInMemoryStorage must be used within InMemoryStorageProvider");
  }
  return ctx;
}

export function InMemoryStorageProvider({ children }: { children: ReactNode }) {
  const [storage] = useState(() => new GenericStringInMemoryStorage());
  const value = useMemo(() => ({ storage }), [storage]);
  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

