"use client";

import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CertificatesPage() {
  // Placeholder for NFT/SBT certificates
  const certificates: any[] = [];

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
              <Award className="h-5 w-5 text-nebula-100" />
              <span className="text-sm font-medium text-starlight">Aurora Certificate Archive</span>
            </div>
            <h1 className="mb-3 font-heading text-3xl text-starlight md:text-4xl">
              My Nebula Certifications
            </h1>
            <p className="text-starlight/65">
              Track Aurora attestations issued by verifiers to memorialise your companion’s milestones.
            </p>
          </motion.div>
        </header>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card flex flex-col items-center justify-center border-white/10 p-16 text-center"
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/10">
              <Shield className="h-12 w-12 text-aurora-100" />
            </div>
            <h3 className="mb-3 font-heading text-2xl text-starlight">
              No Aurora certifications yet
            </h3>
            <p className="mb-8 max-w-md text-starlight/65">
              When guardians verify vaccinations, health screenings, or adoption events, certificates will light up here.
            </p>
            <Link href="/" className="btn-primary">
              Back to Overview
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert, index) => (
              <CertificateCard key={index} cert={cert} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CertificateCard({ cert, index }: { cert: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card group overflow-hidden border-white/10"
    >
      {/* Certificate Visual */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-nebula-500/15 via-plasma-500/10 to-aurora-500/10 p-8">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-aurora-ring">
            <Award className="h-8 w-8 text-nebula-100" />
          </div>
          <h3 className="mb-2 font-heading text-xl text-starlight">
            {cert.type ?? "Health Attestation"}
          </h3>
          <p className="text-sm text-starlight/70">{cert.petName ?? "—"}</p>
        </div>

        {/* Verified Badge */}
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-aurora-500/40 bg-aurora-500/20 px-3 py-1 text-xs font-medium text-aurora-100">
          <Shield className="h-3 w-3" />
          Verified
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="mb-4 space-y-2 text-xs text-starlight/70">
          <div className="flex justify-between">
            <span>Certificate ID</span>
            <span className="font-mono">#{cert.tokenId ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Issued On</span>
            <span>{cert.issuedAt ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Verifier</span>
            <span className="font-mono">
              {cert.verifier ? `${cert.verifier.slice(0, 6)}...` : "—"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="btn-secondary flex-1 text-xs">
            <Download className="mr-1 h-4 w-4" />
            Download
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/15 bg-white/10 transition-all hover:border-nebula-400/40 hover:bg-nebula-500/10">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

