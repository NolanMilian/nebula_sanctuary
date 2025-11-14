import { useEffect, useState } from "react";
import type { EIP6963ProviderDetail } from "./Eip6963Types";

export function useEip6963() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAnnounce = (event: CustomEvent<EIP6963ProviderDetail>) => {
      setProviders((prev) => {
        const exists = prev.some((p) => p.info.uuid === event.detail.info.uuid);
        if (exists) return prev;
        return [...prev, event.detail];
      });
    };

    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnounce as EventListener
    );

    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnounce as EventListener
      );
    };
  }, []);

  return { providers, error };
}

