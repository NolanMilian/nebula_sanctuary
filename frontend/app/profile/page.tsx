"use client";

import { motion } from "framer-motion";
import {
  LucideCircleCheck,
  LucideCopy,
  LucideGlobe,
  LucideLock,
  LucideLogOut,
  LucideSettings,
  LucideSparkles,
  LucideWallet
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { cn } from "@/lib/style";

export default function ProfilePage() {
  const metamask = useMetaMaskEthersSigner();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const address = metamask.accounts?.[0];
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!metamask.isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-card border-white/10 p-8 text-center">
          <p className="text-starlight/70">Connect your wallet to manage Nebula Sanctuary preferences.</p>
          <button onClick={metamask.connect} className="btn-primary mt-4">
            Connect Wallet
          </button>
        </div>
      </main>
    );
  }

  const address = metamask.accounts?.[0] ?? "";
  const networkLabel =
    metamask.chainId === 31337
      ? "Hardhat Mock Network"
      : metamask.chainId === 11155111
        ? "Sepolia Testnet"
        : `Chain ID ${metamask.chainId}`;

  return (
    <main className="min-h-screen px-4 pb-20 pt-12 md:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-eclipse to-void p-8 shadow-glow"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-haze">Nebula Sanctuary</p>
              <h1 className="mt-2 font-heading text-3xl text-starlight">Command Center</h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-starlight/70 hover:border-nebula-400/40"
            >
              <LucideSparkles className="h-4 w-4" />
              Back to Sanctuary
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10">
                  <LucideWallet className="h-6 w-6 text-nebula-100" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-haze/70">Wallet</p>
                  <p className="font-heading text-lg text-starlight">Connection Status</p>
                </div>
              </div>
              <div className="space-y-4 text-sm text-starlight/80">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-haze/60">Current Address</p>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <code className="flex-1 break-all text-starlight/80">{address}</code>
                    <button
                      onClick={handleCopy}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-haze hover:border-nebula-400/40"
                    >
                      {copied ? <LucideCircleCheck className="h-4 w-4 text-aurora-100" /> : <LucideCopy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-haze/60">Network</p>
                  <div className="mt-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <span>{networkLabel}</span>
                    <span className="rounded-full border border-aurora-500/40 bg-aurora-500/10 px-3 py-1 text-xs font-medium text-aurora-100">
                      Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10">
                  <LucideLock className="h-6 w-6 text-aurora-100" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-haze/70">FHE Protection</p>
                  <p className="font-heading text-lg text-starlight">Privacy Aura</p>
                </div>
              </div>
              <ul className="space-y-3 text-xs text-starlight/70">
                <li className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <div>
                    <p className="font-medium text-starlight/80">Vital Cipher Cache</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-haze/60">Mock FHEVM Local</p>
                  </div>
                  <span className="rounded-full border border-nebula-400/50 bg-nebula-500/15 px-3 py-1 text-[11px] uppercase text-nebula-100">
                    Active
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <div>
                    <p className="font-medium text-starlight/80">Authorisation Signatures</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-haze/60">EIP-712 Permit</p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase text-haze/70">
                    Pending
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border-white/10 p-6 md:p-8"
        >
          <h2 className="mb-4 font-heading text-lg text-starlight">Control Panel</h2>
          <div className="space-y-3">
            <ActionButton
              icon={<LucideGlobe className="h-5 w-5 text-nebula-100" />}
              title="View on Block Explorer"
              description="Open the active network’s explorer to inspect transactions and deployments."
            />
            <ActionButton
              icon={<LucideSettings className="h-5 w-5 text-haze/80" />}
              title="Advanced Settings"
              description="Configure relayers, FHE decrypt timeouts, and auto-authorisation policies."
            />
          </div>
          <div className="mt-6 text-center">
            <button className="inline-flex items-center gap-2 text-sm text-haze/70 transition hover:text-plasma-100">
              <LucideLogOut className="h-4 w-4" />
              Disconnect Wallet
            </button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function ActionButton({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-nebula-400/40 hover:bg-nebula-500/10">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10">{icon}</span>
      <div>
        <p className="text-sm font-medium text-starlight">{title}</p>
        <p className="text-xs text-starlight/60">{description}</p>
      </div>
    </button>
  );
}

