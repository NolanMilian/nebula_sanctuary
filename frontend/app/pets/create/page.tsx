"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LucideArrowLeft,
  LucideCamera,
  LucideFeather,
  LucideSparkles,
  LucideUploadCloud
} from "lucide-react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaSanctuary } from "@/hooks/useNebulaSanctuary";

export default function CreateCompanionPage() {
  const router = useRouter();
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

  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    note: "",
    coverCID: "",
    birthday: "",
    privacyLevel: 0
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      setForm((prev) => ({ ...prev, coverCID: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const payload = JSON.stringify({
      name: form.name,
      tagline: form.tagline,
      note: form.note,
      birthday: form.birthday,
      coverCID: form.coverCID
    });
    await actions.registerCompanion(payload, form.privacyLevel);
    setTimeout(() => {
      if (state.selectedCompanionId !== undefined) {
        router.push(`/pets/${state.selectedCompanionId}`);
      } else {
        router.push("/");
      }
    }, 800);
  };

  if (!metamask.isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-card border-white/10 p-8 text-center">
          <p className="text-starlight/70">Connect your wallet to create your first companion card.</p>
          <button onClick={metamask.connect} className="btn-primary mt-4">
            Connect Wallet
          </button>
        </div>
      </main>
    );
  }

  const steps = [
    {
      title: "Companion Identity",
      description: "Give them a resonant name and craft a stellar introduction.",
      content: (
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Card Name *">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nebula Neko"
              className="input-field bg-white/5"
            />
          </Field>
          <Field label="Orbit Title">
            <input
              value={form.tagline}
              onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
              placeholder="Light-speed Adventurer"
              className="input-field bg-white/5"
            />
          </Field>
          <Field label="Birthday / Adoption">
            <input
              type="date"
              value={form.birthday}
              onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))}
              className="input-field bg-white/5"
            />
          </Field>
          <Field label="Stellar Memoir">
            <textarea
              rows={4}
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Loves to chase stardust and awakens at 3 AM..."
              className="input-field bg-white/5"
            />
          </Field>
        </div>
      )
    },
    {
      title: "Cover Constellation",
      description: "Upload a radiant snapshot or stay with our default nebula gradient.",
      content: (
        <div className="flex flex-col gap-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-midnight to-void">
            {preview ? (
              <img src={preview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-starlight/60">
                <LucideCamera className="mb-3 h-10 w-10" />
                Upload cover portrait
              </div>
            )}
            <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
              <LucideUploadCloud className="h-6 w-6 text-starlight" />
              <span className="mt-2 text-xs text-starlight/80">Click to upload or drag & drop</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <p className="text-xs text-starlight/60">
            Supports PNG / JPG, 4:3 aspect recommended. A nebula gradient renders automatically if omitted.
          </p>
        </div>
      )
    },
    {
      title: "Privacy Orbit",
      description: "Decide who can view chronicles and vital signals.",
      content: (
        <div className="grid gap-3">
          {[
            {
              level: 0,
              title: "Public Card",
              desc: "Visible to everyone. Perfect for outreach stories or adoption drives."
            },
            {
              level: 1,
              title: "Shared Card",
              desc: "Invite guardians or clinics to collaborate with encrypted insights."
            },
            {
              level: 2,
              title: "Private Card",
              desc: "Only you can view it. Ideal for sensitive dossiers."
            }
          ].map((option) => (
            <button
              key={option.level}
              onClick={() => setForm((prev) => ({ ...prev, privacyLevel: option.level }))}
              className={cn(
                "flex items-start justify-between rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition",
                form.privacyLevel === option.level
                  ? "border-nebula-400/50 bg-nebula-500/10"
                  : "hover:border-nebula-400/30"
              )}
            >
              <div>
                <p className="font-heading text-lg text-starlight">{option.title}</p>
                <p className="mt-1 text-sm text-starlight/60">{option.desc}</p>
              </div>
              <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/20">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full bg-nebula-400 transition",
                    form.privacyLevel === option.level ? "opacity-100" : "opacity-0"
                  )}
                />
              </div>
            </button>
          ))}
        </div>
      )
    }
  ];

  return (
    <main className="min-h-screen px-4 pb-20 pt-12 md:px-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between text-sm text-haze">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:border-nebula-400/40 hover:text-starlight"
          >
            <LucideArrowLeft className="h-4 w-4" />
            Back to Sanctuary
          </Link>
          <span className="uppercase tracking-[0.35em] text-haze/70">Create Companion Card</span>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-white/10 p-8"
        >
          <div className="mb-8 space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-haze">Step {step + 1} / 3</p>
            <h1 className="font-heading text-2xl text-starlight">{steps[step].title}</h1>
            <p className="text-sm text-starlight/65">{steps[step].description}</p>
          </div>

          <div className="mb-10">{steps[step].content}</div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-2 w-12 rounded-full bg-white/10",
                    step >= idx ? "bg-nebula-500/50" : "bg-white/10"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep((prev) => prev - 1)} className="btn-secondary">
                  Previous
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep((prev) => prev + 1)}
                  disabled={step === 0 && form.name.trim().length === 0}
                  className="btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={state.isBusy || form.name.trim().length === 0}
                  className="btn-primary"
                >
                  {state.isBusy ? "Creating..." : "Mint Companion Card"}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {state.message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-2xl border border-aurora-500/30 bg-aurora-500/10 px-6 py-4 text-center text-sm text-aurora-100/90"
          >
            {state.message}
          </motion.div>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm text-starlight/70">
      <span className="font-medium text-starlight">{label}</span>
      {children}
    </label>
  );
}

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

