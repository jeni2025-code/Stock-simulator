"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMarketStore } from "@/store/useMarketStore";
import { Activity, BarChart2, Briefcase, Wifi, WifiOff } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { isConnected, cash, totalEquity } = useMarketStore();

  const links = [
    { href: "/", label: "Market", icon: BarChart2 },
    { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-surface-900/80 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-all">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight leading-none block">
              StockSim
            </span>
            <span className="text-brand-400 text-[10px] font-mono uppercase tracking-widest leading-none">
              Exchange
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Cash balance */}
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Cash</div>
            <div className="text-white font-mono font-semibold text-sm">
              ${cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Equity */}
          <div className="text-right hidden md:block">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Equity</div>
            <div className="text-brand-400 font-mono font-semibold text-sm">
              ${totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* WS Status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isConnected
                ? "bg-up/10 border-up/30 text-up"
                : "bg-down/10 border-down/30 text-down"
            }`}
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isConnected ? "Live" : "Offline"}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
