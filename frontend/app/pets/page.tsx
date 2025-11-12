"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { BookOpenCheckIcon, Layers3Icon, PlusIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/style";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaSanctuary, type CompanionSnapshot } from "@/hooks/useNebulaSanctuary";

export default function CompanionGalleryPage() {
  const metamask = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();

  const fhevm = useFhevm({
    provider: metamask.provider,
    chainId: metamask.chainId,
    initialMockChains: metamask.initialMockChains,
    enabled: metamask.isConnected
  });

  const { state, actions } = useNebulaSanctuary({
    chainState: metamask,
    fhevmInstance: fhevm.instance,
    storage
  });

  const { loadAllCompanions } = actions;
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
  }, [state.contractAddress, metamask.accounts?.[0]]);

  useEffect(() => {
    if (!state.contractAddress || !metamask.isConnected) return;
    if (state.companionGallery.length > 0) {
      loadedRef.current = true;
      return;
    }
    if (!loadedRef.current) {
      loadAllCompanions();
      loadedRef.current = true;
    }
  }, [state.contractAddress, metamask.isConnected, state.companionGallery.length, loadAllCompanions]);

  const galleryMeta = useMemo(() => {
    const aggregated = state.companionGallery.reduce(
      (acc, entry) => {
        acc.totalStories += Number(entry.storyCount);
        if (entry.hasVitalAura) acc.auraEnabled += 1;
        return acc;
      },
      { totalStories: 0, auraEnabled: 0 }
    );
    return aggregated;
  }, [state.companionGallery]);

  if (!metamask.isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-cloud bg-white p-8 text-center shadow-glow">
          <p className="text-sm text-smoke">Connect your wallet to explore the companion gallery.</p>
          <button onClick={metamask.connect} className="btn-primary mt-4 w-full">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header className="rounded-3xl border border-cloud bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-smoke">Companion Gallery</p>
            <h1 className="mt-2 font-heading text-3xl text-graphite">Card Archive Overview</h1>
            <p className="mt-2 text-sm text-smoke">
              Companion cards are ordered chronologically and showcase cover art, collaborators, and Vital Aura status.
            </p>
          </div>
          <Link href="/pets/create" className="btn-primary">
            <PlusIcon className="mr-2 h-5 w-5" />
            Create Companion Card
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricCard
            icon={<Layers3Icon className="h-5 w-5 text-iris-500" />}
            label="Companions"
            value={state.companionGallery.length.toString()}
          />
          <MetricCard
            icon={<BookOpenCheckIcon className="h-5 w-5 text-fern-600" />}
            label="Chronicles"
            value={galleryMeta.totalStories.toString()}
          />
          <MetricCard
            icon={<SparklesIcon className="h-5 w-5 text-amber-500" />}
            label="Vital Aura Online"
            value={galleryMeta.auraEnabled.toString()}
          />
        </div>
      </header>

      <section>
        {state.companionGallery.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-cloud bg-porcelain px-8 py-16 text-center text-sm text-smoke">
            No companion cards yet. Use “Create Companion Card” to launch your first encrypted chronicle.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {state.companionGallery.map((companion) => (
              <GalleryCard key={companion.companionId.toString()} companion={companion} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-cloud bg-porcelain p-5">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-smoke">
        <span className="rounded-full border border-cloud bg-white p-2">{icon}</span>
        {label}
      </div>
      <p className="mt-3 font-heading text-3xl text-graphite">{value}</p>
    </div>
  );
}

function GalleryCard({ companion }: { companion: CompanionSnapshot }) {
  const metadata = (() => {
    try {
      return JSON.parse(companion.profileCID) as {
        name?: string;
        tagline?: string;
        coverCID?: string;
        note?: string;
      };
    } catch {
      return {};
    }
  })();

  const privacyLabel = ["Public", "Shared", "Private"][companion.privacyLevel] ?? "Unknown";

  return (
    <Link
      href={`/pets/${companion.companionId.toString()}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-cloud bg-white shadow-sm transition hover:border-iris-200 hover:shadow-glow"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-porcelain">
        {metadata.coverCID ? (
          <img src={metadata.coverCID} alt={metadata.name ?? "Companion"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-iris-400">
            <SparklesIcon className="h-8 w-8" />
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full border border-cloud bg-white/90 px-3 py-1 text-xs text-smoke">
          #{companion.companionId.toString()}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-5">
        <div>
          <h3 className="font-heading text-lg text-graphite">
            {metadata.name ?? `Companion #${companion.companionId.toString()}`}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-smoke">
            {metadata.tagline ?? `Vital Aura · ${privacyLabel}`}
          </p>
        </div>
        {metadata.note && (
          <p className="line-clamp-2 text-sm text-smoke/80">{metadata.note}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-smoke/80">
          <span className="rounded-full border border-cloud px-3 py-1">
            Chronicles {Number(companion.storyCount)}
          </span>
          <span className="rounded-full border border-cloud px-3 py-1">
            Collaborators {companion.owners.length}
          </span>
          <span
            className={cn(
              "rounded-full border px-3 py-1",
              companion.hasVitalAura ? "border-fern-200 bg-fern-50 text-fern-600" : "border-cloud bg-porcelain"
            )}
          >
            {companion.hasVitalAura ? "Aura Online" : "Aura Offline"}
          </span>
        </div>
      </div>
    </Link>
  );
}

