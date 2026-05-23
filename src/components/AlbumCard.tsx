import React from "react";
import { Calendar, Layers, Star, ExternalLink } from "lucide-react";
import { Album } from "../types";
import { motion } from "motion/react";

interface AlbumCardProps {
  album: Album;
  photoCount: number | null;
  isSelected: boolean;
  onSelect: () => void;
  loadingPhotos: boolean;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  photoCount,
  isSelected,
  onSelect,
  loadingPhotos,
}) => {
  return (
    <motion.div
      onClick={onSelect}
      className={`relative rounded-none overflow-hidden bg-[#121212] border p-6 cursor-pointer select-none transition-all duration-300 ${
        isSelected
          ? "border-white/80 bg-gradient-to-b from-[#161616] to-[#121212] shadow-2xl"
          : "border-white/5 hover:border-white/20 hover:bg-[#161616] shadow-md"
      }`}
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      {/* Editorial High Contrast Selection Indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-[2.5px] bg-white" />
      )}

      {/* Date metadata display */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-zinc-500" />
          <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-500 font-semibold">
            {album.date}
          </span>
        </div>
        {album.stars > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-330">
            <Star className="w-2.5 h-2.5 fill-zinc-400 text-zinc-400" />
            <span>{album.stars}</span>
          </div>
        )}
      </div>

      {/* Album Title with beautiful Editorial serif style */}
      <h3 className="text-lg font-serif italic text-zinc-100 tracking-tight mb-2 group-hover:text-white">
        {album.title}
      </h3>

      {/* Descriptive Paragraph */}
      <p className="text-xs text-zinc-400 font-sans leading-relaxed line-clamp-2 h-8 mb-6 tracking-wide font-light">
        {album.description || "An automated visual chronicle documenting the intersection of light, environment, and visual geometry."}
      </p>

      {/* Fine-crafted border separator */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto text-[10px] font-mono uppercase tracking-wider">
        <div className="flex items-center gap-2">
          {loadingPhotos && isSelected ? (
            <div className="flex items-center gap-1.5 text-white/80 animate-pulse">
              <span className="w-1 h-1 bg-white" />
              <span>SYNCING</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <Layers className="w-3 h-3 text-zinc-600" />
              <span>
                {photoCount !== null ? (
                  <span className="text-zinc-300 font-semibold">{photoCount} PLATES</span>
                ) : (
                  <span className="text-zinc-600">PENDING</span>
                )}
              </span>
            </div>
          )}
        </div>

        <a
          href={album.htmlUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
          title="Open source on GitHub"
        >
          <span>SOURCE</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </motion.div>
  );
};

export default AlbumCard;

