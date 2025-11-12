"use client";

import { LucideSparkles } from "lucide-react";
import { cn } from "@/lib/style";

export function WalletBanner({
  isConnected,
  address,
  onConnect
}: {
  isConnected: boolean;
  address?: string;
  onConnect: () => void;
}) {
  return (
    <div className="glass-card flex flex-col gap-5 border-white/10 p-6 md:p-8">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 shadow-aurora-ring">
          <LucideSparkles className="h-6 w-6 text-nebula-100" />
        </span>
        <div>
          <p className="font-heading text-lg text-starlight">Nebula Sanctuary Console</p>
          <p className="text-sm text-starlight/65">
            Connect your wallet to sync cards instantly. FHEVM keeps every vital encrypted on your device.
          </p>
        </div>
      </div>
      <button
        onClick={onConnect}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300",
          isConnected
            ? "border border-aurora-500/40 bg-aurora-500/10 text-aurora-100 hover:bg-aurora-500/20"
            : "bg-gradient-to-r from-nebula-500 via-plasma-500 to-aurora-500 text-starlight shadow-aurora-ring hover:shadow-glow-lg"
        )}
      >
        {isConnected
          ? `Connected · ${address?.slice(0, 6)}…${address?.slice(-4)}`
          : "Connect Wallet · Activate cards"}
      </button>
    </div>
  );
}

