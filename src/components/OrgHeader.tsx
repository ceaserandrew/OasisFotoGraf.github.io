import { RefreshCw, Github, Layers } from "lucide-react";
import { OrgProfile } from "../types";

interface OrgHeaderProps {
  org: OrgProfile | null;
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function OrgHeader({ org, loading, onRefresh, refreshing }: OrgHeaderProps) {
  return (
    <header className="relative w-full border-b border-white/10 bg-[#0A0A0A] py-6 sm:py-8 px-4 sm:px-6 md:px-8 z-30 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-5">
        
        {/* Profile Info Block */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-4 sm:gap-6">
          {loading ? (
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-zinc-900 animate-pulse border border-white/10" />
          ) : (
            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 bg-white/10 opacity-30 blur-xs transition duration-300 group-hover:opacity-100" />
              <img
                src={org?.avatar_url || "https://avatars.githubusercontent.com/u/250237664?v=4"}
                alt="OasisFotoGraf Avatar"
                referrerPolicy="no-referrer"
                className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-none border border-white/10 object-cover shadow-2xl transition duration-300 group-hover:border-white/30"
              />
            </div>
          )}

          <div className="flex flex-col justify-center">
            {loading ? (
              <>
                <div className="h-6 w-48 bg-zinc-900 animate-pulse mb-2" />
                <div className="h-4 w-72 bg-zinc-900 animate-pulse" />
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-3 mb-1.5 justify-center sm:justify-start">
                  <span className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-55 text-zinc-400">
                    Collective / Open Source
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-white/5 border border-white/15 text-zinc-300 select-none">
                    Exhibition
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif italic tracking-tight text-[#EAEAEA] mb-2 font-medium">
                  {org?.name || "OasisFotoGraf"}
                </h1>
                <p className="text-xs text-zinc-400 max-w-2xl mb-3 leading-relaxed tracking-wide">
                  {org?.description || "Curating moments, travelogs, geometry, and high-fidelity environment captures."}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 sm:gap-4 text-[10px] uppercase tracking-[0.15em] font-medium text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-500" />
                    <strong className="text-zinc-300 font-semibold">{org?.public_repos || 7}</strong> Collections
                  </span>
                  <span className="w-1.5 h-1.5 bg-white/10" />
                  <a
                    href={org?.html_url || "https://github.com/OasisFotoGraf"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    OasisFotoGraf
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            disabled={refreshing || loading}
            className="flex items-center justify-center gap-2.5 px-4 sm:px-5 py-3 rounded-none bg-white text-black font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#D1D1D1] transition duration-200 cursor-pointer disabled:opacity-50 w-full sm:w-auto min-h-[44px]"
            title="Invalidate cache and fetch newest moments from GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Synching..." : "Sync Archive"}</span>
          </button>
        </div>

      </div>
    </header>
  );
}

