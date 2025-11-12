"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GaugeIcon,
  Layers3Icon,
  AwardIcon,
  UserRoundIcon,
  WalletIcon
} from "lucide-react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { cn } from "@/lib/style";

const NAV_LINKS = [
  { href: "/", label: "Overview", description: "Sanctuary", icon: GaugeIcon },
  { href: "/pets", label: "Companions", description: "Atlas", icon: Layers3Icon },
  { href: "/certificates", label: "Aurora Desk", description: "Certification", icon: AwardIcon },
  { href: "/profile", label: "Profile", description: "Pilot", icon: UserRoundIcon }
];

export function Navigation() {
  const pathname = usePathname();
  const metamask = useMetaMaskEthersSigner();

  const activeIndex = useMemo(
    () => NAV_LINKS.findIndex((item) => item.href === pathname),
    [pathname]
  );

  const address = metamask.accounts?.[0];

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-cloud bg-white/90 backdrop-blur lg:flex">
        <Link href="/" className="flex items-center gap-3 px-6 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cloud bg-white shadow-halo">
            <GaugeIcon className="h-6 w-6 text-iris-500" />
          </div>
          <div>
            <p className="font-heading text-lg text-graphite">Nebula Sanctuary</p>
            <p className="text-xs uppercase tracking-[0.4em] text-smoke">Companion Orbit</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-2 px-4">
          {NAV_LINKS.map((item, index) => {
            const Icon = item.icon;
            const active = index === activeIndex;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
                  active
                    ? "border-iris-200 bg-iris-50 text-iris-600 shadow-sm"
                    : "border-transparent bg-white text-graphite hover:border-iris-100 hover:bg-iris-50/60"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border transition",
                    active
                      ? "border-iris-200 bg-white text-iris-500"
                      : "border-cloud bg-porcelain text-smoke group-hover:border-iris-200 group-hover:text-iris-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-smoke/70">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-cloud px-4 py-6">
          <div className="rounded-2xl border border-cloud bg-porcelain px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cloud bg-white text-iris-500">
                <WalletIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-smoke">Wallet</p>
                <p className="font-medium text-graphite">
                  {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Disconnected"}
                </p>
              </div>
            </div>
            <button
              onClick={() => metamask.connect()}
              className={cn(
                "w-full rounded-xl px-4 py-2 text-sm font-medium transition",
                address
                  ? "border border-fern-200 bg-fern-50 text-fern-600"
                  : "bg-gradient-to-r from-iris-500 to-blush-500 text-white shadow-glow hover:shadow-glow-lg"
              )}
            >
              {address ? "Connected" : "Connect Wallet"}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cloud bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
          {NAV_LINKS.map((item, index) => {
            const Icon = item.icon;
            const active = index === activeIndex;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 text-xs font-medium transition",
                  active ? "text-iris-600" : "text-smoke hover:text-iris-500"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border transition",
                    active ? "border-iris-200 bg-iris-50" : "border-cloud bg-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="h-20 lg:hidden" />
    </>
  );
}

