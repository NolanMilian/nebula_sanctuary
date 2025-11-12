"use client";

import { AlertTriangleIcon, PlugIcon } from "lucide-react";
import { cn } from "@/lib/style";

export function EnvironmentAlert({
  hasContract,
  supportsFhevm
}: {
  hasContract: boolean;
  supportsFhevm: boolean;
}) {
  if (hasContract && supportsFhevm) return null;
  return (
    <div
      className={cn(
        "rounded-3xl border px-5 py-4 text-sm backdrop-blur",
        hasContract
          ? "border-aurora-500/40 bg-aurora-500/10 text-aurora-100"
          : "border-plasma-500/40 bg-plasma-500/10 text-plasma-100"
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        {hasContract ? (
          <PlugIcon className="h-4 w-4" />
        ) : (
          <AlertTriangleIcon className="h-4 w-4" />
        )}
        <span>Environment Notice</span>
      </div>
      <p className="mt-2 leading-6">
        {!hasContract
          ? "NebulaCareRegistry is missing. Deploy it on your local FHE Hardhat node, run scripts/genabi to sync ABI and addresses, then refresh."
          : "Running in Mock FHEVM mode. Encrypted flows work locally; switching to Sepolia will enable the relayer SDK and real decrypt operations."}
      </p>
    </div>
  );
}

