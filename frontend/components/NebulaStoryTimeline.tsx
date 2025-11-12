"use client";

import type { StoryView } from "@/hooks/useNebulaSanctuary";
import { motion } from "framer-motion";
import {
  LucideCamera,
  LucideCheckCircle2,
  LucideCloudLightning,
  LucideDroplet,
  LucideFeather,
  LucideFlame,
  LucideHeart,
  LucideLock,
  LucideUnlock
} from "lucide-react";
import { cn } from "@/lib/style";

const STORY_EVENT_MAP: Record<
  number,
  { icon: React.ComponentType<{ className?: string }>; label: string; accent: string }
> = {
  0: { icon: LucideFeather, label: "Routine Care", accent: "from-iris-100/70 to-iris-50/60" },
  1: { icon: LucideFlame, label: "Energy Training", accent: "from-blush-100/70 to-blush-50/60" },
  2: { icon: LucideDroplet, label: "Medical Check", accent: "from-fern-100/70 to-fern-50/60" },
  3: { icon: LucideCloudLightning, label: "Mood Update", accent: "from-amber-100/70 to-amber-50/60" },
  4: { icon: LucideHeart, label: "Heartwarming Moment", accent: "from-iris-100/70 to-blush-50/60" }
};

type NebulaStoryTimelineProps = {
  stories: StoryView[];
  decryptedVitalMap: Record<string, bigint>;
  onDecryptVital: (storyId: number) => Promise<void>;
  busy: boolean;
};

export function NebulaStoryTimeline({
  stories,
  decryptedVitalMap,
  onDecryptVital,
  busy
}: NebulaStoryTimelineProps) {
  if (!stories.length) {
    return (
      <div className="rounded-3xl border border-cloud bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cloud bg-porcelain">
          <LucideHeart className="h-10 w-10 text-iris-400" />
        </div>
        <h3 className="mb-2 font-heading text-xl text-graphite">No Chronicles Yet</h3>
        <p className="text-sm text-smoke">Use the Chronicle Composer to record the first on-chain story.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cloud bg-white p-6 shadow-sm md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl text-graphite">Chronicle Timeline</h2>
          <p className="text-xs uppercase tracking-[0.3em] text-smoke/70">Stellar Chronicle Timeline</p>
        </div>
        <span className="text-sm text-smoke/80">{stories.length} entries</span>
      </div>

      <div className="relative pl-6 md:pl-10">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-iris-200 via-iris-50 to-transparent md:left-3" />

        <div className="space-y-8">
          {stories.map((story, index) => {
            const config = STORY_EVENT_MAP[story.eventType] ?? STORY_EVENT_MAP[0];
            const Icon = config.icon;
            const metadata = (() => {
              try {
                return JSON.parse(story.logCID) as {
                  note?: string;
                  media?: string;
                  timestamp?: number;
                  location?: string;
                };
              } catch {
                return {};
              }
            })();
            const decrypted = decryptedVitalMap[story.storyId.toString()];
            const timestamp = metadata.timestamp
              ? new Date(metadata.timestamp)
              : new Date(Number(story.timestamp) * 1000);

            return (
              <motion.div
                key={story.storyId.toString()}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                className="relative pl-10 md:pl-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.06 + 0.1, type: "spring", stiffness: 200, damping: 12 }}
                  className="absolute left-[-0.2rem] top-2 flex h-10 w-10 items-center justify-center rounded-full border border-cloud bg-white shadow-halo md:left-[-0.1rem] md:h-12 md:w-12"
                >
                  <Icon className="h-5 w-5 text-iris-500" />
                </motion.div>

                <div className="rounded-[28px] border border-cloud bg-porcelain p-6 shadow-sm transition-all hover:shadow-glow">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border border-cloud px-3 py-1 text-xs uppercase tracking-[0.25em] text-graphite",
                            "bg-gradient-to-r",
                            config.accent
                          )}
                        >
                          {config.label}
                        </span>
                        {story.verified && (
                          <span className="flex items-center gap-1 rounded-full border border-fern-200 bg-fern-50 px-3 py-1 text-xs font-medium text-fern-600">
                            <LucideCheckCircle2 className="h-3.5 w-3.5" />
                            Aurora Attested
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-smoke">
                        {timestamp.toLocaleString("en-US", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {metadata.location ? ` · ${metadata.location}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-smoke/70">#{story.storyId.toString()}</span>
                  </div>

                  {metadata.note && (
                    <p className="mb-4 text-sm leading-relaxed text-smoke">{metadata.note}</p>
                  )}

                  {metadata.media && (
                    <a
                      href={metadata.media}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-4 inline-flex items-center gap-2 rounded-full border border-cloud bg-white px-4 py-2 text-xs font-medium text-iris-500 transition-colors hover:border-iris-200 hover:text-iris-600"
                    >
                      <LucideCamera className="h-4 w-4" />
                      Open Media Trace
                    </a>
                  )}

                  {story.verified && story.verifier && (
                    <div className="mb-4 rounded-2xl border border-fern-200 bg-fern-50 p-4 text-xs text-fern-700">
                      <p className="font-semibold tracking-wide">Verified by aurora guardian</p>
                      <p className="mt-1 text-fern-600">
                        {story.verifier.slice(0, 6)}...{story.verifier.slice(-4)}
                      </p>
                      {story.verifyCID && (
                        <p className="mt-2 text-fern-500">Verification Log: {story.verifyCID}</p>
                      )}
                    </div>
                  )}

                  {story.hasEncryptedVital && (
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cloud bg-gradient-to-r from-iris-50 via-blush-50 to-fern-50 p-4">
                      <div className="flex items-center gap-3">
                        {decrypted !== undefined ? (
                          <LucideUnlock className="h-5 w-5 text-fern-600" />
                        ) : (
                          <LucideLock className="h-5 w-5 text-iris-500" />
                        )}
                        <div>
                          <p className="text-xs font-medium text-smoke">
                            {decrypted !== undefined ? "Decrypted Vital" : "Encrypted Vital Pending"}
                          </p>
                          {decrypted !== undefined && (
                            <p className="text-lg font-semibold text-fern-600">
                              {(Number(decrypted) / 1000).toFixed(2)} kg
                            </p>
                          )}
                        </div>
                      </div>
                      {decrypted === undefined && (
                        <button
                          onClick={() => onDecryptVital(Number(story.storyId))}
                          disabled={busy}
                          className="btn-secondary text-xs"
                        >
                          {busy ? "Decrypting..." : "Decrypt Vital"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

