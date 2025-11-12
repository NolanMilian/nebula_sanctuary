"use client";

import { motion } from "framer-motion";
import { LucideSparkles } from "lucide-react";

export function LoadingAnimation({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-nebula-500 via-plasma-500 to-aurora-500 shadow-aurora-ring"
      >
        <LucideSparkles className="h-10 w-10 text-starlight" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-sm text-starlight/70"
      >
        {message ?? "Loading..."}
      </motion.p>

      <div className="mt-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -8, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15
            }}
            className="h-2 w-2 rounded-full bg-nebula-500/40"
          />
        ))}
      </div>
    </div>
  );
}

