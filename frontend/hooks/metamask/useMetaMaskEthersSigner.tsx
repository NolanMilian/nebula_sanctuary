"use client";

import { ethers } from "ethers";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useMetaMask } from "./useMetaMaskProvider";

export interface MetaMaskEthersState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  connect: () => void;
  error: Error | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: React.MutableRefObject<(chainId: number | undefined) => boolean>;
  sameSigner: React.MutableRefObject<(signer: ethers.JsonRpcSigner | undefined) => boolean>;
  initialMockChains?: Readonly<Record<number, string>>;
}

const MetaMaskEthersContext = createContext<MetaMaskEthersState | undefined>(undefined);

export function MetaMaskEthersSignerProvider({
  children,
  initialMockChains
}: {
  children: ReactNode;
  initialMockChains?: Readonly<Record<number, string>>;
}) {
  const meta = useMetaMask();
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner>();
  const [readonlyProvider, setReadonlyProvider] = useState<ethers.ContractRunner>();
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider>();

  const chainIdRef = useRef<number>();
  const signerRef = useRef<ethers.JsonRpcSigner>();

  const sameChain = useRef((chainId: number | undefined) => chainId === chainIdRef.current);
  const sameSigner = useRef(
    (signer: ethers.JsonRpcSigner | undefined) => signer === signerRef.current
  );

  useEffect(() => {
    chainIdRef.current = meta.chainId;
  }, [meta.chainId]);

  useEffect(() => {
    if (
      !meta.provider ||
      !meta.chainId ||
      !meta.accounts ||
      meta.accounts.length === 0 ||
      !meta.isConnected
    ) {
      setEthersSigner(undefined);
      signerRef.current = undefined;
      setReadonlyProvider(undefined);
      setBrowserProvider(undefined);
      return;
    }

    const browser = new ethers.BrowserProvider(meta.provider);
    setBrowserProvider(browser);

    const mockRpc = initialMockChains?.[meta.chainId];
    if (mockRpc) {
      setReadonlyProvider(new ethers.JsonRpcProvider(mockRpc));
    } else {
      setReadonlyProvider(browser);
    }

    const signer = new ethers.JsonRpcSigner(browser, meta.accounts[0]);
    setEthersSigner(signer);
    signerRef.current = signer;
  }, [meta.provider, meta.chainId, meta.accounts, meta.isConnected, initialMockChains]);

  const value = useMemo<MetaMaskEthersState>(
    () => ({
      provider: meta.provider,
      chainId: meta.chainId,
      accounts: meta.accounts,
      isConnected: meta.isConnected,
      connect: meta.connect,
      error: meta.error,
      ethersSigner,
      ethersReadonlyProvider: readonlyProvider,
      sameChain,
      sameSigner,
      initialMockChains
    }),
    [
      meta.provider,
      meta.chainId,
      meta.accounts,
      meta.isConnected,
      meta.connect,
      meta.error,
      ethersSigner,
      readonlyProvider,
      initialMockChains
    ]
  );

  return (
    <MetaMaskEthersContext.Provider value={value}>
      {children}
    </MetaMaskEthersContext.Provider>
  );
}

export function useMetaMaskEthersSigner() {
  const ctx = useContext(MetaMaskEthersContext);
  if (!ctx) {
    throw new Error("useMetaMaskEthersSigner must be used within MetaMaskEthersSignerProvider");
  }
  return ctx;
}

