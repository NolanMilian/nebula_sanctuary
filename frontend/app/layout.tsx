"use client";

import "./globals.css";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { Navigation } from "@/components/Navigation";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hans">
      <head>
        <title>Nebula Sanctuary · FHE Companion Archive</title>
        <meta
          name="description"
          content="Nebula Sanctuary combines FHEVM and Web3 to create a privacy-first companion log where stories and health signals remain encrypted and verifiable."
        />
      </head>
      <body>
        <Providers>
          <div className="relative min-h-screen bg-gradient-to-br from-mist via-white to-porcelain lg:pl-64">
            <Navigation />
            <AnimatePresence mode="wait">
              <motion.main
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45 }}
                className="px-4 pb-28 pt-10 sm:px-8 lg:px-12 lg:pb-16"
              >
                {children}
              </motion.main>
            </AnimatePresence>
          </div>
        </Providers>
      </body>
    </html>
  );
}

