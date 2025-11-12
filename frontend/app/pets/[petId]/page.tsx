"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ActivityIcon,
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon
} from "lucide-react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaSanctuary } from "@/hooks/useNebulaSanctuary";
import { NebulaStoryTimeline } from "@/components/NebulaStoryTimeline";


const EVENT_OPTIONS = [
  { value: 0, label: "Routine Care" },
  { value: 1, label: "Energy Training" },
  { value: 2, label: "Medical Check" },
  { value: 3, label: "Mood Update" },
  { value: 4, label: "Heartwarming Moment" }
];

export default function CompanionDetailPage() {
  const params = useParams();
  const companionId = Number(params.petId);

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

  const [storyDraft, setStoryDraft] = useState({
    note: "",
    eventType: 0,
    vital: "",
    media: "",
    location: ""
  });

  useEffect(() => {
    if (!Number.isNaN(companionId)) {
      actions.spotlightCompanion(companionId);
    }
  }, [companionId]);

  useEffect(() => {
    if (state.selectedCompanionId !== undefined) {
      actions.refreshCompanion(state.selectedCompanionId);
      actions.refreshStories(state.selectedCompanionId);
      actions.decryptCompanionOrbit(state.selectedCompanionId);
    }
  }, [state.selectedCompanionId]);

  const metadata = useMemo(() => {
    try {
      return state.companionSnapshot
        ? (JSON.parse(state.companionSnapshot.profileCID) as {
            name?: string;
            tagline?: string;
            note?: string;
            coverCID?: string;
            birthday?: string;
          })
        : {};
    } catch {
      return {};
    }
  }, [state.companionSnapshot]);

  const privacyLabel = useMemo(() => {
    if (!state.companionSnapshot) return "Unknown";
    return ["Public Card", "Shared Card", "Private Card"][state.companionSnapshot.privacyLevel] ?? "Unknown";
  }, [state.companionSnapshot]);

  const owners = state.companionSnapshot?.owners ?? [];

  const handleRecordStory = async () => {
    if (!state.selectedCompanionId) return;
    const payload = JSON.stringify({
      note: storyDraft.note,
      media: storyDraft.media || undefined,
      location: storyDraft.location || undefined,
      timestamp: Date.now()
    });
    const vital = storyDraft.vital ? parseInt(storyDraft.vital, 10) : undefined;
    await actions.recordStory(state.selectedCompanionId, payload, storyDraft.eventType, vital);
    setStoryDraft({
      note: "",
      eventType: 0,
      vital: "",
      media: "",
      location: ""
    });
  };

  if (!metamask.isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-cloud bg-white p-8 text-center shadow-glow">
          <p className="text-sm text-smoke">Connect your wallet to load this companion card.</p>
          <button onClick={metamask.connect} className="btn-primary mt-4 w-full">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!state.companionSnapshot) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-cloud bg-white p-8 text-center shadow-glow">
          <SparklesIcon className="mx-auto mb-3 h-8 w-8 animate-spin text-iris-400" />
          <p className="text-sm text-smoke">Loading companion details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header className="flex items-center justify-between text-sm text-smoke">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-cloud bg-white px-4 py-2 transition hover:border-iris-200 hover:text-iris-600"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Sanctuary
        </Link>
        <span className="uppercase tracking-[0.3em] text-smoke/70">
          Companion #{state.companionSnapshot.companionId.toString()}
        </span>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl border border-cloud bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-cloud bg-porcelain">
                {metadata.coverCID ? (
                  <img src={metadata.coverCID} alt={metadata.name ?? "Companion"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-iris-500">
                    <UsersIcon className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-heading text-2xl text-graphite sm:text-3xl">
                  {metadata.name ?? `Companion #${state.companionSnapshot.companionId}`}
                </h1>
                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-smoke">
                  {metadata.tagline ?? privacyLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-cloud bg-porcelain px-3 py-1 text-xs text-smoke">
                Created on {new Date(Number(state.companionSnapshot.createdAt) * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>

          {metadata.note && (
            <p className="mt-6 rounded-2xl border border-cloud bg-porcelain px-5 py-4 text-sm leading-relaxed text-smoke">
              {metadata.note}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <InfoStat
              icon={<ActivityIcon className="h-4 w-4 text-iris-500" />}
              label="Chronicle Entries"
              value={Number(state.companionSnapshot.storyCount).toString()}
              hint="Total stories anchored on-chain"
            />
            <InfoStat
              icon={<ShieldCheckIcon className="h-4 w-4 text-fern-600" />}
              label="Vital Aura"
              value={
                state.vitalOrbit
                  ? `${state.vitalOrbit.average.toFixed(2)} kg`
                  : state.companionSnapshot.hasVitalAura
                    ? "Awaiting decrypt"
                    : "Inactive"
              }
              hint="Encrypted Vital Summary"
            />
            <InfoStat
              icon={<CalendarIcon className="h-4 w-4 text-amber-500" />}
              label="Collaborators"
              value={`${owners.length}`}
              hint="Trusted guardians with access"
            />
          </div>
        </article>

        <aside className="space-y-4 rounded-3xl border border-cloud bg-white p-8 shadow-sm">
          <div>
            <h3 className="font-heading text-lg text-graphite">Collaborators</h3>
            <p className="text-xs text-smoke/70">Wallets authorised to view this card</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {owners.map((owner) => (
              <span
                key={owner}
                className="rounded-full border border-cloud bg-porcelain px-3 py-1 text-xs font-medium text-smoke"
              >
                {owner.slice(0, 6)}…{owner.slice(-4)}
              </span>
            ))}
          </div>
          <div className="rounded-2xl border border-cloud bg-porcelain px-4 py-4 text-sm text-smoke">
            <p>Privacy tier: {privacyLabel}</p>
            {metadata.birthday && <p className="mt-2">Birthday / Adoption: {metadata.birthday}</p>}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <NebulaStoryTimeline
          stories={state.stories}
          decryptedVitalMap={state.decryptedVitals}
          onDecryptVital={actions.decryptStoryVital}
          busy={state.isBusy}
        />

        <div className="rounded-3xl border border-cloud bg-white p-8 shadow-sm">
          <h3 className="font-heading text-lg text-graphite">Chronicle Composer</h3>
          <p className="mt-1 text-sm text-smoke">
            Log a new chronicle with optional encrypted vitals. Entries become immutable once posted.
          </p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-smoke">
              Chronicle type
              <select
                className="input-field mt-2 bg-white"
                value={storyDraft.eventType}
                onChange={(e) =>
                  setStoryDraft((prev) => ({
                    ...prev,
                    eventType: parseInt(e.target.value, 10)
                  }))
                }
              >
                {EVENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-smoke">
              Chronicle description
              <textarea
                className="input-field mt-2 bg-white"
                rows={4}
                value={storyDraft.note}
                onChange={(e) => setStoryDraft((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Capture today’s stellar moment…"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-smoke">
                Location tag
                <input
                  className="input-field mt-2 bg-white"
                  value={storyDraft.location}
                  onChange={(e) => setStoryDraft((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Home healing corner, Nebula Park"
                />
              </label>
              <label className="block text-sm font-medium text-smoke">
                Vital (grams, optional)
                <input
                  className="input-field mt-2 bg-white"
                  type="number"
                  value={storyDraft.vital}
                  onChange={(e) => setStoryDraft((prev) => ({ ...prev, vital: e.target.value }))}
                  placeholder="e.g. 5200"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-smoke">
              Media link (optional)
              <input
                className="input-field mt-2 bg-white"
                value={storyDraft.media}
                onChange={(e) => setStoryDraft((prev) => ({ ...prev, media: e.target.value }))}
                placeholder="IPFS / Arweave / media URL"
              />
            </label>
          </div>
          <button
            onClick={handleRecordStory}
            disabled={state.isBusy || storyDraft.note.trim().length === 0}
            className="btn-primary mt-6 w-full"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Publish Chronicle
          </button>
        </div>
      </section>

      {state.message && (
        <div className="rounded-3xl border border-fern-200 bg-fern-50 px-6 py-4 text-center text-sm text-fern-700 shadow-sm">
          {state.message}
        </div>
      )}
    </div>
  );
}

function InfoStat({
  icon,
  label,
  value,
  hint
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-cloud bg-porcelain p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-smoke">
        <span className="rounded-full border border-cloud bg-white p-2">{icon}</span>
        {label}
      </div>
      <p className="mt-3 font-heading text-2xl text-graphite">{value}</p>
      <p className="mt-2 text-xs text-smoke/70">{hint}</p>
    </div>
  );
}

