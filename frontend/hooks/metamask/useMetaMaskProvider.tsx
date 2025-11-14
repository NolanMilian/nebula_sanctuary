"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { ethers } from "ethers";

type ProviderEventMap = {
  connect: (info: { chainId: string }) => void;
  chainChanged: (chainId: string) => void;
  accountsChanged: (accounts: string[]) => void;
  disconnect: (error: { code: number; message: string }) => void;
};

type ProviderEventKey = keyof ProviderEventMap;

type Eip1193ProviderWithEvents = ethers.Eip1193Provider & {
  on?: <K extends ProviderEventKey>(event: K, listener: ProviderEventMap[K]) => void;
  addListener?: <K extends ProviderEventKey>(event: K, listener: ProviderEventMap[K]) => void;
  off?: <K extends ProviderEventKey>(event: K, listener: ProviderEventMap[K]) => void;
  removeListener?: <K extends ProviderEventKey>(event: K, listener: ProviderEventMap[K]) => void;
};

export interface MetaMaskState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: () => void;
}

const MetaMaskContext = createContext<MetaMaskState | undefined>(undefined);

export function useMetaMask() {
  const ctx = useContext(MetaMaskContext);
  if (!ctx) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return ctx;
}

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<Eip1193ProviderWithEvents>();
  const [chainId, setChainId] = useState<number>();
  const [accounts, setAccounts] = useState<string[]>();
  const [error, setError] = useState<Error>();

  const listenersRef = useRef<{
    connect?: ProviderEventMap["connect"];
    chainChanged?: ProviderEventMap["chainChanged"];
    accountsChanged?: ProviderEventMap["accountsChanged"];
    disconnect?: ProviderEventMap["disconnect"];
  }>({});

  useEffect(() => {
    const ethProvider = (window as unknown as { ethereum?: Eip1193ProviderWithEvents }).ethereum;
    if (!ethProvider) {
      setProvider(undefined);
      setChainId(undefined);
      setAccounts(undefined);
      setError(new Error("MetaMask not detected. Install or enable your wallet."));
      return;
    }
    setProvider(ethProvider);
    setError(undefined);
  }, []);

  useEffect(() => {
    if (!provider) return;

    const connectListener: ProviderEventMap["connect"] = (info) => {
      setChainId(Number.parseInt(info.chainId, 16));
    };
    const disconnectListener: ProviderEventMap["disconnect"] = () => {
      setChainId(undefined);
      setAccounts(undefined);
    };
    const chainChangedListener: ProviderEventMap["chainChanged"] = (id) => {
      setChainId(Number.parseInt(id, 16));
    };
    const accountsChangedListener: ProviderEventMap["accountsChanged"] = (next) => {
      setAccounts(next);
    };

    listenersRef.current = {
      connect: connectListener,
      chainChanged: chainChangedListener,
      accountsChanged: accountsChangedListener,
      disconnect: disconnectListener
    };

    provider.on?.("connect", connectListener);
    provider.on?.("chainChanged", chainChangedListener);
    provider.on?.("accountsChanged", accountsChangedListener);
    provider.on?.("disconnect", disconnectListener);

    provider
      .request({ method: "eth_chainId" })
      .then((id) => setChainId(Number.parseInt(id as string, 16)))
      .catch(() => setChainId(undefined));

    provider
      .request({ method: "eth_accounts" })
      .then((list) => setAccounts(list as string[]))
      .catch(() => setAccounts(undefined));

    return () => {
      provider.off?.("connect", connectListener);
      provider.off?.("disconnect", disconnectListener);
      provider.off?.("accountsChanged", accountsChangedListener);
      provider.off?.("chainChanged", chainChangedListener);
    };
  }, [provider]);

  const connect = useCallback(() => {
    if (!provider) {
      setError(new Error("MetaMask is not ready yet."));
      return;
    }
    provider.request({ method: "eth_requestAccounts" }).catch((err) => {
      setError(err as Error);
    });
  }, [provider]);

  const value = useMemo<MetaMaskState>(
    () => ({
      provider,
      chainId,
      accounts,
      isConnected: Boolean(provider && accounts && accounts.length > 0 && chainId),
      error,
      connect
    }),
    [provider, chainId, accounts, error, connect]
  );

  return <MetaMaskContext.Provider value={value}>{children}</MetaMaskContext.Provider>;
}

