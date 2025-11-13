import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance, FhevmAbortError } from "./internal/fhevm";

export type FhevmStatus = "idle" | "loading" | "ready" | "error";

export function useFhevm(params: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}) {
  const { provider, chainId, enabled = true, initialMockChains } = params;
  const [status, setStatus] = useState<FhevmStatus>("idle");
  const [instance, setInstance] = useState<FhevmInstance>();
  const [error, setError] = useState<Error>();

  const abortRef = useRef<AbortController | null>(null);
  const providerRef = useRef<typeof provider>();
  const chainRef = useRef<typeof chainId>();
  const mockRef = useRef(initialMockChains ? { ...initialMockChains } : undefined);

  const refresh = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    providerRef.current = provider;
    chainRef.current = chainId;
    setInstance(undefined);
    setError(undefined);
    setStatus("idle");
  }, [provider, chainId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setInstance(undefined);
      setStatus("idle");
      return;
    }
    if (!provider) {
      setInstance(undefined);
      setStatus("idle");
      return;
    }
    providerRef.current = provider;
    chainRef.current = chainId;

    if (!abortRef.current) {
      abortRef.current = new AbortController();
    }
    const thisAbort = abortRef.current;
    setStatus("loading");
    setError(undefined);

    createFhevmInstance({
      provider,
      mockChains: mockRef.current,
      signal: thisAbort.signal,
      onStatusChange: (s) => console.debug("[useFhevm] status", s)
    })
      .then((fheInstance) => {
        if (thisAbort.signal.aborted) return;
        setInstance(fheInstance);
        setStatus("ready");
      })
      .catch((err) => {
        if (thisAbort.signal.aborted) return;
        if (err instanceof FhevmAbortError) {
          return;
        }
        setError(err as Error);
        setStatus("error");
      });

    return () => {
      thisAbort.abort();
      abortRef.current = null;
    };
  }, [enabled, provider, chainId]);

  return { instance, status, error, refresh };
}

