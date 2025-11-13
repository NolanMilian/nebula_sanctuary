type Trace = (message?: unknown, ...optionalParams: unknown[]) => void;

type LoaderOptions = {
  trace?: Trace;
};

export type FhevmInitSDKOptions = {
  // 按需扩展；目前透传给 relayerSDK.initSDK
};

export type RelayerSDKWindow = Window &
  typeof globalThis & {
    relayerSDK: any & { __initialized__?: boolean };
  };

export function isFhevmWindowType(win: Window): win is RelayerSDKWindow {
  return typeof (win as RelayerSDKWindow).relayerSDK !== "undefined";
}

function loadScript(src: string, trace?: Trace) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.type = "text/javascript";
    // For COEP environments, prefer CORS if CDN is used
    if (src.startsWith("http")) {
      script.crossOrigin = "anonymous";
    }
    script.src = src;
    script.onload = () => {
      trace?.(`[RelayerSDKLoader] Loaded: ${src}`);
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

import { SDK_CDN_URL, SDK_LOCAL_URL } from "./constants";

export class RelayerSDKLoader {
  private readonly trace?: Trace;
  constructor(options?: LoaderOptions) {
    this.trace = options?.trace;
  }

  async load() {
    // Prefer local first to avoid COEP/CORS pitfalls, then fallback to CDN
    try {
      await loadScript(SDK_LOCAL_URL, this.trace);
      this.trace?.("[RelayerSDKLoader] Loaded from local");
      return;
    } catch {
      this.trace?.("[RelayerSDKLoader] Local load failed, trying CDN");
    }
    await loadScript(SDK_CDN_URL, this.trace);
    this.trace?.("[RelayerSDKLoader] Successfully loaded from CDN");
  }
}


