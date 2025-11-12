"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import {
  CalendarCheckIcon,
  CompassIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon
} from "lucide-react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaSanctuary, type CompanionSnapshot } from "@/hooks/useNebulaSanctuary";
import { cn } from "@/lib/style";

export default function HomePage() {
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
  const gallery = state.companionGallery;
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
  }, [state.contractAddress, metamask.accounts?.[0]]);

  useEffect(() => {
    if (!state.contractAddress || !metamask.isConnected) return;
    if (gallery.length > 0) {
      loadedRef.current = true;
      return;
    }
    if (!loadedRef.current) {
      loadAllCompanions();
      loadedRef.current = true;
    }
  }, [state.contractAddress, metamask.isConnected, gallery.length, loadAllCompanions]);

  const overview = useMemo(() => {
    const storyTotal = gallery.reduce((sum, c) => sum + Number(c.storyCount), 0);
    const auraEnabled = gallery.filter((c) => c.hasVitalAura).length;
    return {
      companions: gallery.length,
      stories: storyTotal,
      aura: auraEnabled
    };
  }, [gallery]);

  if (!metamask.isConnected) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-xl rounded-3xl border border-cloud bg-white p-10 text-center shadow-glow">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cloud bg-white shadow-halo">
            <SparklesIcon className="h-8 w-8 text-iris-500" />
          </div>
          <h1 className="font-heading text-3xl text-graphite">Welcome to Nebula Sanctuary</h1>
          <p className="mt-3 text-sm text-smoke">
            Connect your wallet to create encrypted companion cards and keep every story secure with FHE.
          </p>
          <button onClick={metamask.connect} className="btn-primary mt-8 w-full">
            Connect Wallet
          </button>
          <p className="mt-4 text-xs text-smoke/70">MetaMask or any EVM-compatible wallet is recommended.</p>
        </div>
      </div>
    );
  }

  if (!state.contractAddress) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-lg rounded-3xl border border-cloud bg-white p-10 text-center shadow-glow">
          <SparklesIcon className="mx-auto mb-4 h-10 w-10 text-iris-500" />
          <h2 className="font-heading text-2xl text-graphite">NebulaCareRegistry Not Found</h2>
          <p className="mt-2 text-sm text-smoke">
            Deploy the contract to your local Hardhat FHEVM node or target network and regenerate the ABI mapping.
          </p>
          <p className="mt-4 text-xs text-smoke/70">Current chain ID: {metamask.chainId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <article className="rounded-3xl border border-cloud bg-white p-10 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-cloud bg-porcelain px-3 py-1 text-xs uppercase tracking-[0.3em] text-smoke">
                <CompassIcon className="h-3.5 w-3.5" />
                Nebula Briefing
              </span>
              <h1 className="mt-6 font-heading text-3xl text-graphite sm:text-4xl">
                Welcome back, stellar guardian.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-smoke">
                Active wallet:
                <code className="mx-2 rounded-full bg-porcelain px-3 py-1 text-xs text-iris-600">
                  {metamask.accounts?.[0]?.slice(0, 6)}…{metamask.accounts?.[0]?.slice(-4)}
                </code>
                Sensitive vital signals stay encrypted on FHEVM and can only be decrypted by trusted parties.
              </p>
            </div>
            <Link href="/pets/create" className="btn-primary h-fit px-6 py-3 text-sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Companion Card
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Companions"
              highlight={`${overview.companions}`}
              footer="Encrypted dossiers recorded on-chain"
              tone="iris"
            />
            <StatCard
              title="Chronicles"
              highlight={`${overview.stories}`}
              footer="Tamper-proof logs anchored to the chain"
              tone="fern"
            />
            <StatCard
              title="Vital Aura"
              highlight={`${overview.aura}`}
              footer="Companions with encrypted vital tracking enabled"
              tone="amber"
            />
          </div>
        </article>

        <aside className="flex flex-col gap-6 rounded-3xl border border-cloud bg-white p-8 shadow-sm">
          <div>
            <h3 className="font-heading text-xl text-graphite">Today’s Checklist</h3>
            <p className="mt-2 text-sm text-smoke">
              Keep your companion orbit organised and your collaborators in sync with these quick actions.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-smoke">
            {[
              "Add cover art, keywords, and story tags on the companion card.",
              "Use the Chronicle Composer to record new care notes with optional encrypted vitals.",
              "Grant viewer permissions or invite professionals to issue an Aurora certification."
            ].map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-cloud bg-porcelain px-4 py-3 leading-relaxed"
              >
                <SparklesIcon className="mt-1 h-4 w-4 text-iris-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/certificates"
            className="inline-flex items-center justify-center rounded-2xl border border-iris-100 bg-iris-50/70 px-4 py-2 text-sm font-medium text-iris-600 transition hover:bg-iris-100/70"
          >
            View Aurora Certifications
          </Link>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-3xl border border-cloud bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl text-graphite">Companion Cards</h2>
              <p className="text-sm text-smoke">
                Cards are ordered by creation date. Open one to review the encrypted dossier and chronicle.
              </p>
            </div>
            <Link
              href="/pets"
              className="inline-flex items-center gap-2 rounded-full border border-cloud bg-porcelain px-4 py-2 text-sm font-medium text-smoke hover:border-iris-200 hover:text-iris-600"
            >
              View All
            </Link>
          </div>
          <CompanionList companions={gallery} />
        </article>

        <aside className="space-y-4 rounded-3xl border border-cloud bg-white p-8 shadow-sm">
          <h3 className="font-heading text-lg text-graphite">System Status</h3>
          <StatusItem
            title="FHEVM Node"
            description={
              fhevm.status === "ready"
                ? "Mock mode is ready. You can simulate encrypted submissions locally."
                : "Initialising FHEVM. Refresh or check the node if the status persists."
            }
            positive={fhevm.status === "ready"}
          />
          <StatusItem
            title="Signature Cache"
            description="The first decrypt request generates a permit; subsequent requests reuse it to avoid extra prompts."
            positive={Boolean(state.decryptedVitals && Object.keys(state.decryptedVitals).length)}
          />
          <StatusItem
            title="Companion Collaborators"
            description="Manage viewer permissions from the companion page to share records with family or professionals."
            positive={gallery.some((companion) => companion.owners.length > 1)}
          />
        </aside>
      </section>

      {fhevm.status === "loading" && (
        <div className="fixed bottom-24 right-6 rounded-2xl border border-cloud bg-white px-4 py-3 text-sm text-smoke shadow-glow">
          Waking up the FHEVM runtime...
        </div>
      )}

      {fhevm.status === "error" && (
        <div className="fixed bottom-24 right-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-sm">
          FHEVM initialisation failed. Please check your local node or browser environment.
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  highlight,
  footer,
  tone
}: {
  title: string;
  highlight: string;
  footer: string;
  tone: "iris" | "fern" | "amber";
}) {
  const tones: Record<typeof tone, { badge: string; text: string }> = {
    iris: { badge: "bg-iris-50 text-iris-600", text: "text-iris-500" },
    fern: { badge: "bg-fern-50 text-fern-600", text: "text-fern-600" },
    amber: { badge: "bg-amber-50 text-amber-600", text: "text-amber-600" }
  };
  const palette = tones[tone];

  return (
    <div className="rounded-2xl border border-cloud bg-porcelain p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-smoke">{title}</p>
      <p className={`mt-3 font-heading text-3xl ${palette.text}`}>{highlight}</p>
      <p className="mt-2 text-xs text-smoke/70">{footer}</p>
      <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs ${palette.badge}`}>
        Updated {new Date().toLocaleDateString("en-US")}
      </div>
    </div>
  );
}

function CompanionList({ companions }: { companions: CompanionSnapshot[] }) {
  if (companions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cloud bg-porcelain px-6 py-12 text-center text-sm text-smoke">
        No companion cards yet. Click “Create Companion Card” to register your first partner.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {companions.map((companion) => (
        <CompanionListItem key={companion.companionId.toString()} companion={companion} />
      ))}
    </div>
  );
}

function CompanionListItem({ companion }: { companion: CompanionSnapshot }) {
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
      className="group flex items-center gap-4 rounded-2xl border border-cloud bg-white px-4 py-4 transition hover:border-iris-200 hover:shadow-glow"
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-cloud bg-porcelain">
        {metadata.coverCID ? (
          <img src={metadata.coverCID} alt={metadata.name ?? "companion"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-iris-400">
            <UsersIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-lg text-graphite">
            {metadata.name ?? `Companion #${companion.companionId.toString()}`}
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-smoke">
            {metadata.tagline ?? `Vital Aura · ${privacyLabel}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-smoke/80">
          <span className="rounded-full border border-cloud px-3 py-1">
            Chronicles {Number(companion.storyCount)}
          </span>
          <span className="rounded-full border border-cloud px-3 py-1">
            Collaborators {companion.owners.length}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1",
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

function StatusItem({
  title,
  description,
  positive
}: {
  title: string;
  description: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-2xl border border-cloud bg-porcelain px-4 py-4 text-sm text-smoke">
      <div className="mb-2 flex items-center gap-2">
        <CalendarCheckIcon className={cn("h-4 w-4", positive ? "text-fern-500" : "text-amber-500")} />
        <span className="font-medium text-graphite">{title}</span>
      </div>
      <p className="text-xs leading-relaxed text-smoke/80">{description}</p>
    </div>
  );
}

