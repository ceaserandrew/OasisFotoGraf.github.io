import { useState, useMemo } from "react";
import { Search, Grid, LayoutGrid, SlidersHorizontal, ImageOff, ZoomIn, Calendar } from "lucide-react";
import { Photo } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PhotoGridProps {
  photos: Photo[];
  loading: boolean;
  onPhotoSelect: (photo: Photo) => void;
  albumTitle: string;
}

export default function PhotoGrid({
  photos,
  loading,
  onPhotoSelect,
  albumTitle,
}: PhotoGridProps) {
  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<"large" | "medium" | "compact">("medium");
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name");

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    let result = [...photos];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "size") {
        return b.size - a.size; // Largest first
      } else if (sortBy === "date") {
        const dateA = a.captureDate || "";
        const dateB = b.captureDate || "";
        return dateB.localeCompare(dateA); // Newest first
      } else {
        return a.name.localeCompare(b.name); // Alphabetical
      }
    });

    return result;
  }, [photos, search, sortBy]);

  // Handle human-readable byte formats
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const densityClasses = {
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
    medium: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
    compact: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2",
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans">
      {/* Search and Control Rail */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 bg-[#0c0c0c] p-5 rounded-none z-20">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
          <h4 className="text-sm tracking-tight text-zinc-300 flex items-baseline gap-2">
            <span className="font-serif italic text-base font-semibold text-white">{albumTitle}</span>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold">({filteredPhotos.length} IMAGES)</span>
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="FILTER ARCHIVE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-none bg-[#121212] border border-white/5 focus:border-white/25 hover:border-white/10 text-[10px] uppercase tracking-wider font-mono text-zinc-200 focus:outline-hidden"
            />
          </div>

          {/* Sort By Controls */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-none bg-[#121212] border border-white/5 hover:border-white/20 text-[10px] uppercase tracking-wider font-mono text-zinc-400 focus:outline-hidden cursor-pointer"
          >
            <option value="name">SORT / ALPHABETICAL</option>
            <option value="size">SORT / FILE SIZE</option>
            <option value="date">SORT / CHRONOLOGICAL</option>
          </select>

          {/* Density Controls */}
          <div className="flex items-center p-0.5 rounded-none bg-[#121212] border border-white/5">
            <button
              onClick={() => setDensity("large")}
              className={`p-1.5 rounded-none cursor-pointer transition-colors ${
                density === "large" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-350"
              }`}
              title="Editorial Focus Mode"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDensity("medium")}
              className={`p-1.5 rounded-none cursor-pointer transition-colors ${
                density === "medium" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-350"
              }`}
              title="Standard Grid Mode"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDensity("compact")}
              className={`p-1.5 rounded-none cursor-pointer transition-colors ${
                density === "compact" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-350"
              }`}
              title="Compact Study Mode"
            >
              <Grid className="w-3.5 h-3.5 scale-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="border border-white/10 border-t-0 p-5 sm:p-8 bg-[#0A0A0A] rounded-none flex-1 min-h-[400px]">
        {loading ? (
          <div className="w-full h-80 flex flex-col items-center justify-center gap-4">
            <div className="w-6 h-6 rounded-none border border-zinc-700 border-t-white animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#737373]">ESTABLISHING HIGH-FIDELITY CONNECTION...</span>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="w-full h-80 flex flex-col items-center justify-center text-center gap-4">
            <ImageOff className="w-8 h-8 text-zinc-750" />
            <div>
              <p className="text-xs uppercase tracking-widest font-mono text-zinc-400">No plates found in this archive</p>
              <p className="text-[11px] text-zinc-600 mt-1 max-w-sm">Try using different characters, filenames or clear the filter query.</p>
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-[10px] font-mono tracking-widest uppercase text-white hover:underline cursor-pointer"
              >
                [ RESET FILTER ]
              </button>
            )}
          </div>
        ) : (
          <motion.div
            layout
            className={`grid ${densityClasses[density]} auto-rows-max`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="popLayout">
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  key={photo.sha || photo.path}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.15) }}
                  onClick={() => onPhotoSelect(photo)}
                  className="group relative rounded-none border border-white/5 bg-[#121212] overflow-hidden cursor-pointer aspect-square flex items-center justify-center transition-all duration-300 hover:border-white/35"
                >
                  {/* Real Image */}
                  <img
                    src={photo.url}
                    alt={photo.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102 filter grayscale hover:grayscale-0 transition-all"
                  />

                  {/* Desktop Hover overlay and detail panel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10 font-sans">
                    <div className="flex items-center justify-between gap-2 mb-1 border-b border-white/10 pb-1.5">
                      <span className="text-[10px] font-mono font-medium text-zinc-200 tracking-wider truncate flex-1">
                        {photo.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 shrink-0 select-none">
                        {formatBytes(photo.size)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                      {photo.captureDate ? (
                        <span className="flex items-center gap-1 text-zinc-400 tracking-wide uppercase">
                          <Calendar className="w-2.5 h-2.5 text-zinc-500" />
                          {photo.captureDate}
                        </span>
                      ) : (
                        <span className="text-zinc-650 uppercase tracking-widest">VERTICAL SPECIMEN</span>
                      )}
                      <span className="flex items-center gap-0.5 text-white underline uppercase tracking-widest group-hover:translate-x-0.5 transition-transform duration-300">
                        <ZoomIn className="w-3 h-3 text-white" />
                        VIEW
                      </span>
                    </div>
                  </div>

                  {/* Corner indicator if captureDate exists */}
                  {photo.captureDate && density !== "compact" && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#0A0A00]/80 backdrop-blur-md text-[8px] font-mono text-[#D1D1D1] border border-white/5 tracking-wider uppercase z-10 select-none max-w-full truncate pointer-events-none group-hover:opacity-0 transition-opacity">
                      {photo.captureDate}
                    </div>
                  )}

                  {/* Aesthetic index number overlay */}
                  <div className="absolute bottom-3 right-3 text-[9px] font-mono text-white/20 select-none pointer-events-none group-hover:opacity-0 transition-opacity">
                    {(index + 1).toString().padStart(3, "0")}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

