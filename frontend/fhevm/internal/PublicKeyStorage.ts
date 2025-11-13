import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/bundle";

type FhevmInstanceConfigPublicKey =
  FhevmInstanceConfig["publicKey"];
type FhevmInstanceConfigPublicParams =
  FhevmInstanceConfig["publicParams"];

interface PublicParamsDB extends DBSchema {
  publicKeyStore: {
    key: `0x${string}`;
    value: {
      acl: `0x${string}`;
      value: FhevmInstanceConfigPublicKey;
    };
  };
  paramsStore: {
    key: `0x${string}`;
    value: {
      acl: `0x${string}`;
      value: FhevmInstanceConfigPublicParams;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<PublicParamsDB>> | undefined;

async function getDb(): Promise<IDBPDatabase<PublicParamsDB> | undefined> {
  if (dbPromise) return dbPromise;
  if (typeof window === "undefined") return undefined;

  dbPromise = openDB<PublicParamsDB>("animalcare-fhevm", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("publicKeyStore")) {
        db.createObjectStore("publicKeyStore", { keyPath: "acl" });
      }
      if (!db.objectStoreNames.contains("paramsStore")) {
        db.createObjectStore("paramsStore", { keyPath: "acl" });
      }
    }
  });

  return dbPromise;
}

export async function publicKeyStorageGet(acl: `0x${string}`): Promise<{
  publicKey?: FhevmInstanceConfigPublicKey;
  publicParams: FhevmInstanceConfigPublicParams | null;
}> {
  const db = await getDb();
  if (!db) return { publicParams: null };

  const storedKey = await db.get("publicKeyStore", acl);
  const storedParams = await db.get("paramsStore", acl);

  return {
    publicKey: storedKey?.value,
    publicParams: storedParams?.value ?? null
  };
}

export async function publicKeyStorageSet(
  acl: `0x${string}`,
  publicKey: FhevmInstanceConfigPublicKey | undefined,
  publicParams: FhevmInstanceConfigPublicParams | undefined
) {
  const db = await getDb();
  if (!db) return;
  if (publicKey) {
    await db.put("publicKeyStore", { acl, value: publicKey });
  }
  if (publicParams) {
    await db.put("paramsStore", { acl, value: publicParams });
  }
}

