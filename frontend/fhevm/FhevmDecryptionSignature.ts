import { ethers } from "ethers";
import type {
  EIP712Type,
  FhevmDecryptionSignatureType,
  FhevmInstance
} from "./fhevmTypes";
import type { GenericStringStorage } from "@/hooks/useInMemoryStorage";

function now(): number {
  return Math.floor(Date.now() / 1000);
}

class SignatureStorageKey {
  #key: string;

  constructor(
    instance: FhevmInstance,
    contractAddresses: string[],
    user: string,
    publicKey?: string
  ) {
    if (!ethers.isAddress(user)) {
      throw new TypeError(`Invalid address ${user}`);
    }
    const sorted = (contractAddresses as `0x${string}`[]).slice().sort();
    const blank = instance.createEIP712(
      publicKey ?? ethers.ZeroAddress,
      sorted,
      0,
      0
    );
    const hash = ethers.TypedDataEncoder.hash(
      blank.domain,
      { UserDecryptRequestVerification: blank.types.UserDecryptRequestVerification },
      blank.message
    );
    this.#key = `${user}:${hash}`;
  }

  get key() {
    return this.#key;
  }
}

export class FhevmDecryptionSignature {
  #publicKey: string;
  #privateKey: string;
  #signature: string;
  #startTimestamp: number;
  #durationDays: number;
  #userAddress: `0x${string}`;
  #contractAddresses: `0x${string}`[];
  #eip712: EIP712Type;

  private constructor(params: FhevmDecryptionSignatureType) {
    this.#publicKey = params.publicKey;
    this.#privateKey = params.privateKey;
    this.#signature = params.signature;
    this.#startTimestamp = params.startTimestamp;
    this.#durationDays = params.durationDays;
    this.#userAddress = params.userAddress;
    this.#contractAddresses = params.contractAddresses;
    this.#eip712 = params.eip712;
  }

  get publicKey() {
    return this.#publicKey;
  }
  get privateKey() {
    return this.#privateKey;
  }
  get signature() {
    return this.#signature;
  }
  get userAddress() {
    return this.#userAddress;
  }
  get contractAddresses() {
    return this.#contractAddresses;
  }
  get startTimestamp() {
    return this.#startTimestamp;
  }
  get durationDays() {
    return this.#durationDays;
  }

  isValid(): boolean {
    return now() < this.#startTimestamp + this.#durationDays * 24 * 3600;
  }

  toJSON(): FhevmDecryptionSignatureType {
    return {
      publicKey: this.#publicKey,
      privateKey: this.#privateKey,
      signature: this.#signature,
      startTimestamp: this.#startTimestamp,
      durationDays: this.#durationDays,
      userAddress: this.#userAddress,
      contractAddresses: this.#contractAddresses,
      eip712: this.#eip712
    };
  }

  static fromJSON(json: string | FhevmDecryptionSignatureType) {
    const data = typeof json === "string" ? (JSON.parse(json) as FhevmDecryptionSignatureType) : json;
    return new FhevmDecryptionSignature(data);
  }

  static async load(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    contracts: string[],
    user: string,
    publicKey?: string
  ) {
    const key = new SignatureStorageKey(instance, contracts, user, publicKey);
    const raw = await storage.getItem(key.key);
    if (!raw) return null;
    try {
      const sig = FhevmDecryptionSignature.fromJSON(raw);
      return sig.isValid() ? sig : null;
    } catch {
      return null;
    }
  }

  static async create(
    instance: FhevmInstance,
    contracts: string[],
    signer: ethers.Signer
  ) {
    const { publicKey, privateKey } = instance.generateKeypair();
    const userAddress = (await signer.getAddress()) as `0x${string}`;
    const startTimestamp = now();
    const durationDays = 365;
    const eip712 = instance.createEIP712(
      publicKey,
      contracts as `0x${string}`[],
      startTimestamp,
      durationDays
    );
    const signature = await signer.signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message
    );
    return new FhevmDecryptionSignature({
      publicKey,
      privateKey,
      contractAddresses: contracts as `0x${string}`[],
      startTimestamp,
      durationDays,
      signature,
      eip712: eip712 as EIP712Type,
      userAddress
    });
  }

  async save(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    cachePublicKey: boolean
  ) {
    const key = new SignatureStorageKey(
      instance,
      this.#contractAddresses,
      this.#userAddress,
      cachePublicKey ? this.#publicKey : undefined
    );
    try {
      await storage.setItem(key.key, JSON.stringify(this));
    } catch (error) {
      console.warn("Failed to persist FHEVM decrypt signature", error);
    }
  }

  static async loadOrCreate(options: {
    storage: GenericStringStorage;
    instance: FhevmInstance;
    contracts: string[];
    signer: ethers.Signer;
  }) {
    const { storage, instance, contracts, signer } = options;
    const user = await signer.getAddress();
    const cached = await FhevmDecryptionSignature.load(storage, instance, contracts, user);
    if (cached) return cached;
    const sig = await FhevmDecryptionSignature.create(instance, contracts, signer);
    await sig.save(storage, instance, false);
    return sig;
  }
}

