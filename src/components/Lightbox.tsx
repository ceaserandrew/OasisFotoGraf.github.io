import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, Github, Calendar, Info, FileCode, Maximize2 } from "lucide-react";
import { Photo } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LightboxProps {
  photo: Photo | null;
  photos: Photo[];
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Lightbox({
  photo,
  photos,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const [showMeta, setShowMeta] = useState(true);

  // Install keyboard listeners for pure navigation comfort
  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photo, onClose, onNext, onPrev]);

  if (!photo) return null;

  const currentIndex = photos.findIndex((p) => p.sha === photo.sha);

  // Help format byte sizes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1012;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090909]/95 [backdrop-filter:blur(8px)] select-none font-sans">
        
        {/* Background Click to Dismiss */}
        <div className="absolute inset-0 z-0 cursor-default" onClick={onClose} />

        {/* Floating Top Bar Control Console */}
        <div className="absolute top-0 left-0 w-full p-3 sm:p-5 flex items-start sm:items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none gap-2">
          <div className="text-zinc-400 text-[10px] font-mono tracking-[0.15em] uppercase pointer-events-auto flex items-center gap-2 bg-[#121212]/90 px-3 sm:px-4.5 py-2 border border-white/15">
            <span>SPECIMEN:</span>
            <span className="text-white font-bold font-mono">{(currentIndex + 1).toString().padStart(3, "0")}</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-550">{photos.length.toString().padStart(3, "0")}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto flex-wrap justify-end">
            {/* Show Meta toggle */}
            <button
              onClick={() => setShowMeta(!showMeta)}
              className={`p-2.5 sm:p-3 rounded-none border transition-colors cursor-pointer min-h-[44px] min-w-[44px] ${
                showMeta
                  ? "bg-white text-black border-white"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
              }`}
              title="Toggle File Meta Infomation"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* View Original raw CDN button */}
            <a
              href={photo.url}
              download={photo.name}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 sm:p-3 rounded-none bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors cursor-pointer min-h-[44px] min-w-[44px] hidden sm:flex"
              title="Download Original Capture Image"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>

            {/* View on GitHub file source */}
            <a
              href={photo.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 sm:p-3 rounded-none bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] hidden sm:flex"
              title="Open GitHub source"
            >
              <Github className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>

            {/* Close Lightbox */}
            <button
              onClick={onClose}
              className="p-2.5 sm:p-3 rounded-none bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Left side tap area */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-0 top-0 w-1/3 h-full z-20 sm:hidden"
          aria-label="Previous image"
        />
        
        {/* Mobile Navigation - Right side tap area */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-0 top-0 w-1/3 h-full z-20 sm:hidden"
          aria-label="Next image"
        />

        {/* Carousel Prev Navigation Pin Left - Desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-none bg-[#121212]/80 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 z-30 transition-all cursor-pointer min-h-[56px] min-w-[56px] flex sm:flex"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Main Immersive Canvas Area */}
        <div className="relative w-full h-full max-w-5xl max-h-[70%] sm:max-h-[80%] flex items-center justify-center p-3 sm:p-5 z-20">
          <motion.img
            key={photo.sha || photo.path}
            src={photo.url}
            alt={photo.name}
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="max-w-full max-h-full object-contain pointer-events-auto rounded-none border border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.9)]"
            onClick={(e) => {
              // Click image directly triggers Next for comfortable gallery view experience
              e.stopPropagation();
              onNext();
            }}
          />
        </div>

        {/* Carousel Next Navigation Pin Right - Desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-none bg-[#121212]/80 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 z-30 transition-all cursor-pointer min-h-[56px] min-w-[56px] flex sm:flex"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Floating details slide up modal at bottom */}
        <AnimatePresence>
          {showMeta && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-3 sm:px-5 z-30 pointer-events-none"
            >
              <div className="relative bg-[#111]/95 border border-white/10 rounded-none p-4 sm:p-5 shadow-2xl backdrop-blur-md pointer-events-auto">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <h5 className="text-zinc-100 text-xs font-serif italic tracking-wide truncate pr-4">
                      {photo.name}
                    </h5>
                    <span className="text-[8px] bg-white/5 text-zinc-400 font-mono tracking-widest px-2.5 py-0.5 rounded-none border border-white/10">
                      RAW JPEG
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[9px] font-mono tracking-wider uppercase text-zinc-450">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <FileCode className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-zinc-600 block text-[8px] tracking-widest font-mono">LOCATION</span>
                        <span className="text-zinc-300 truncate block select-all">{photo.path}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Maximize2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <div>
                        <span className="text-zinc-600 block text-[8px] tracking-widest font-mono">CAPACITY</span>
                        <span className="text-zinc-300 block select-all">{formatBytes(photo.size)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <div>
                        <span className="text-zinc-600 block text-[8px] tracking-widest font-mono">TEMPORAL</span>
                        <span className="text-zinc-300 block select-all">
                          {photo.captureDate || "DETERMINED"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#CECECE]">
                      <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-zinc-600 block text-[8px] tracking-widest font-mono">SPECIMEN HASH</span>
                        <span className="text-zinc-400 truncate max-w-40 block select-all" title={photo.sha}>
                          {photo.sha ? photo.sha.slice(0, 12) : "NO HASH"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Swipe Left/Right Hint overlay */}
        <div className="absolute bottom-4 left-5 text-[9px] font-mono uppercase tracking-widest text-zinc-600 hidden max-sm:block select-none">
          tap edges of display to navigate
        </div>

      </div>
    </AnimatePresence>
  );
}
