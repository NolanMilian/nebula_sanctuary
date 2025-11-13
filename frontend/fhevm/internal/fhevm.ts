import { Eip1193Provider, JsonRpcProvider, isAddress } from "ethers";
import type {
  FhevmInstance,
  FhevmInstanceConfig
} from "../fhevmTypes";
import {
  RelayerSDKLoader,
  isFhevmWindowType,
  type FhevmInitSDKOptions
} from "./RelayerSDKLoader";
import type { RelayerSDKWindow } from "./RelayerSDKLoader";
import {
  publicKeyStorageGet,
  publicKeyStorageSet
} from "./PublicKeyStorage";

export class FhevmReactError extends Error {
  code: string;
  constructor(code: string, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = "FhevmReactError";
  }
}

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

type ResolveResult =
  | { isMock: true; chainId: number; rpcUrl: string }
  | { isMock: false; chainId: number; rpcUrl?: string };

type Status =
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating";

async function getChainId(providerOrUrl: Eip1193Provider | string) {
  if (typeof providerOrUrl === "string") {
    const provider = new JsonRpcProvider(providerOrUrl);
    const network = await provider.getNetwork();
    return Number(network.chainId);
  }
  const chainIdHex = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainIdHex as string, 16);
}

async function resolve(
  providerOrUrl: Eip1193Provider | string,
  mockChains?: Record<number, string>
): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl);
  const mock: Record<number, string> = {
    31337: "http://localhost:8545",
    ...(mockChains ?? {})
  };

  if (Object.hasOwn(mock, chainId)) {
    const rpcUrl = mock[chainId] ?? (typeof providerOrUrl === "string" ? providerOrUrl : "");
    return { isMock: true, chainId, rpcUrl };
  }

  return {
    isMock: false,
    chainId,
    rpcUrl: typeof providerOrUrl === "string" ? providerOrUrl : undefined
  };
}

async function getWeb3ClientVersion(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    return (await rpc.send("web3_clientVersion", [])) as string;
  } finally {
    rpc.destroy();
  }
}

async function getRelayerMetadata(rpcUrl: string) {
  const provider = new JsonRpcProvider(rpcUrl);
  try {
    return await provider.send("fhevm_relayer_metadata", []);
  } catch (error) {
    throw new FhevmReactError(
      "RELAYER_METADATA_ERROR",
      `Unable to fetch FHEVM relayer metadata from ${rpcUrl}`,
      { cause: error }
    );
  } finally {
    provider.destroy();
  }
}

async function tryResolveMockMetadata(rpcUrl: string) {
  const version = await getWeb3ClientVersion(rpcUrl);
  if (!version.toLowerCase().includes("hardhat")) {
    return undefined;
  }
  try {
    const metadata = await getRelayerMetadata(rpcUrl);
    if (
      metadata &&
      typeof metadata === "object" &&
      "ACLAddress" in metadata &&
      "InputVerifierAddress" in metadata &&
      "KMSVerifierAddress" in metadata
    ) {
      return metadata as {
        ACLAddress: `0x${string}`;
        InputVerifierAddress: `0x${string}`;
        KMSVerifierAddress: `0x${string}`;
      };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function ensureAddress(value: unknown): asserts value is `0x${string}` {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error(`Invalid address: ${value as string}`);
  }
}

function isSdkInitialized() {
  if (!isFhevmWindowType(window)) {
    return false;
  }
  return window.relayerSDK.__initialized__ === true;
}

async function loadSdk() {
  if (!isFhevmWindowType(window)) {
    const loader = new RelayerSDKLoader({ trace: console.debug });
    await loader.load();
  }
}

async function initSdk(options?: FhevmInitSDKOptions) {
  if (!isFhevmWindowType(window)) {
    throw new Error("window.relayerSDK is unavailable");
  }
  const initialized = await window.relayerSDK.initSDK(options);
  window.relayerSDK.__initialized__ = initialized;
  if (!initialized) {
    throw new Error("relayerSDK.initSDK failed");
  }
}

export async function createFhevmInstance(parameters: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: Status) => void;
}): Promise<FhevmInstance> {
  const { provider, mockChains, signal, onStatusChange } = parameters;
  const throwIfAborted = () => {
    if (signal.aborted) throw new FhevmAbortError();
  };
  const notify = (status: Status) => {
    onStatusChange?.(status);
  };

  const result = await resolve(provider, mockChains);
  if (result.isMock) {
    const meta = await tryResolveMockMetadata(result.rpcUrl);
    if (meta) {
      notify("creating");
      const { fhevmMockCreateInstance } = await import("./mock/fhevmMock");
      const instance = await fhevmMockCreateInstance({
        rpcUrl: result.rpcUrl,
        chainId: result.chainId,
        metadata: meta
      });
      throwIfAborted();
      return instance;
    }
  }

  throwIfAborted();

  if (!isFhevmWindowType(window)) {
    notify("sdk-loading");
    await loadSdk();
    throwIfAborted();
    notify("sdk-loaded");
  }

  if (!isSdkInitialized()) {
    notify("sdk-initializing");
    await initSdk();
    throwIfAborted();
    notify("sdk-initialized");
  }

  const relayerSDK = (window as unknown as RelayerSDKWindow).relayerSDK;
  
  // v0.9: Try to get config from available sources
  let baseConfig: FhevmInstanceConfig | undefined;
  let aclAddress: string | undefined;
  
  // Try ZamaEthereumConfig first (v0.9), then fall back to SepoliaConfig (v0.8)
  if (typeof relayerSDK.ZamaEthereumConfig === 'object' && relayerSDK.ZamaEthereumConfig !== null) {
    baseConfig = relayerSDK.ZamaEthereumConfig as FhevmInstanceConfig;
    aclAddress = (baseConfig as Record<string, unknown>).aclContractAddress as string;
  } else if (typeof relayerSDK.SepoliaConfig === 'object' && relayerSDK.SepoliaConfig !== null) {
    baseConfig = relayerSDK.SepoliaConfig as FhevmInstanceConfig;
    aclAddress = (baseConfig as Record<string, unknown>).aclContractAddress as string;
  }
  
  if (!baseConfig || !aclAddress) {
    throw new FhevmReactError(
      "CONFIG_NOT_FOUND",
      "Unable to find FHEVM configuration (ZamaEthereumConfig or SepoliaConfig) in relayerSDK"
    );
  }
  
  ensureAddress(aclAddress);

  const cached = await publicKeyStorageGet(aclAddress);
  throwIfAborted();

  const config: FhevmInstanceConfig = {
    ...baseConfig,
    network: provider,
    publicKey: cached.publicKey,
    publicParams: cached.publicParams ?? undefined
  };

  notify("creating");
  const instance = (await relayerSDK.createInstance(config)) as FhevmInstance;
  {
    const pk = instance.getPublicKey();
    const publicKeyForConfig =
      pk == null
        ? undefined
        : ({ data: pk.publicKey, id: pk.publicKeyId } as FhevmInstanceConfig["publicKey"]);
    const publicParams = instance.getPublicParams(2048) as FhevmInstanceConfig["publicParams"] | undefined;
    await publicKeyStorageSet(aclAddress, publicKeyForConfig, publicParams);
  }
  throwIfAborted();

  return instance;
}

