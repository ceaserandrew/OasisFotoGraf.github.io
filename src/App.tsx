import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import OrgHeader from "./components/OrgHeader";
import AlbumCard from "./components/AlbumCard";
import PhotoGrid from "./components/PhotoGrid";
import Lightbox from "./components/Lightbox";
import AIPanel from "./components/AIPanel";
import { OrgProfile, Album, Photo } from "./types";

export default function App() {
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // Background photo counts for all albums
  const [photoCounts, setPhotoCounts] = useState<{ [repo: string]: number }>({});
  
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Security and Rate Limit Status Banners
  const [syncStatus, setSyncStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityKeyInput, setSecurityKeyInput] = useState("");

  // Auto clear sync notifications
  useEffect(() => {
    if (syncStatus) {
      const timer = setTimeout(() => {
        setSyncStatus(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Fetch organization profile data
  const fetchOrg = async () => {
    setLoadingOrg(true);
    try {
      const resp = await fetch("/api/org");
      if (resp.ok) {
        const data = await resp.json();
        setOrg(data);
      }
    } catch (err) {
      console.error("Failed to fetch organisation profile:", err);
    } finally {
      setLoadingOrg(false);
    }
  };

  // Fetch repo albums lists
  const fetchAlbums = async () => {
    setLoadingAlbums(true);
    try {
      const resp = await fetch("/api/repos");
      if (resp.ok) {
        const data: Album[] = await resp.json();
        setAlbums(data);
        
        // Auto-select the first album (theOrigin_2026.5 or standard) or latest
        if (data.length > 0) {
          const defaultAlbum = data[0]; // Active selection
          setSelectedAlbum(defaultAlbum);
          fetchPhotos(defaultAlbum.name, defaultAlbum.defaultBranch);
        }

        // Trigger background fetch of photo counts for all repositories
        data.forEach((album) => {
          fetchBackgroundPhotoCount(album.name, album.defaultBranch);
        });
      }
    } catch (err) {
      console.error("Failed to load album repositories:", err);
    } finally {
      setLoadingAlbums(false);
    }
  };

  // Fetch photos of a specific album
  const fetchPhotos = async (repoName: string, branch: string) => {
    setLoadingPhotos(true);
    setPhotos([]);
    try {
      const resp = await fetch(`/api/repos/${repoName}/photos?branch=${branch}`);
      if (resp.ok) {
        const data: Photo[] = await resp.json();
        setPhotos(data);
        // Also update background count state
        setPhotoCounts((prev) => ({ ...prev, [repoName]: data.length }));
      }
    } catch (err) {
      console.error(`Failed to fetch photos of album ${repoName}:`, err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Fetch specific counts for the sidebar display background counter
  const fetchBackgroundPhotoCount = async (repoName: string, branch: string) => {
    try {
      const resp = await fetch(`/api/repos/${repoName}/photos?branch=${branch}`);
      if (resp.ok) {
        const data: Photo[] = await resp.json();
        setPhotoCounts((prev) => ({ ...prev, [repoName]: data.length }));
      }
    } catch (err) {
      console.error(`Failed background count for ${repoName}:`, err);
    }
  };

  // Completely wipe server-side cache and reload newest
  const handleFullSyncRefresh = async (enteredKey?: string) => {
    setRefreshing(true);
    try {
      const keyToUse = enteredKey || localStorage.getItem("oasis_sync_key") || "";
      const syncResp = await fetch("/api/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sync-key": keyToUse,
        }
      });

      const resData = await syncResp.json();

      if (syncResp.status === 401) {
        setSecurityModalOpen(true);
        setSyncStatus({ type: "error", message: "ACCESS REJECTED: Security lock configured. passphrase required." });
      } else if (syncResp.status === 429) {
        setSyncStatus({ type: "error", message: resData.message || "COOLDOWN: Rate limit exceeded." });
      } else if (syncResp.ok) {
        if (enteredKey) {
          localStorage.setItem("oasis_sync_key", enteredKey);
        }
        setSecurityModalOpen(false);
        setSyncStatus({ type: "success", message: "ARCHIVE STACK CLEARED & COPIED FRESH FROM GITHUB" });
        // Redownload state
        await fetchOrg();
        await fetchAlbums();
      } else {
        setSyncStatus({ type: "error", message: resData.message || "Failed to synchronize remote archive." });
      }
    } catch (err) {
      console.error("Error during server sync refresh:", err);
      setSyncStatus({ type: "error", message: "CRITICAL: Connection dropped during archive syncing." });
    } finally {
      setRefreshing(false);
    }
  };

  // Triggered on page load
  useEffect(() => {
    fetchOrg();
    fetchAlbums();
  }, []);

  // Selection trigger
  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    fetchPhotos(album.name, album.defaultBranch);
  };

  // Lightbox carousel controllers
  const handleNextPhoto = () => {
    if (!selectedPhoto || photos.length === 0) return;
    const currIdx = photos.findIndex((p) => p.sha === selectedPhoto.sha);
    const nextIdx = (currIdx + 1) % photos.length;
    setSelectedPhoto(photos[nextIdx]);
  };

  const handlePrevPhoto = () => {
    if (!selectedPhoto || photos.length === 0) return;
    const currIdx = photos.findIndex((p) => p.sha === selectedPhoto.sha);
    const prevIdx = (currIdx - 1 + photos.length) % photos.length;
    setSelectedPhoto(photos[prevIdx]);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#eaeaea] font-sans flex flex-col selection:bg-white selection:text-black">
      
      {/* Editorial aesthetic subtle alignment gridlines */}
      <div className="fixed inset-y-0 left-12 w-[1px] bg-white/[0.02] pointer-events-none z-0 hidden lg:block" />
      <div className="fixed inset-y-0 right-12 w-[1px] bg-white/[0.02] pointer-events-none z-0 hidden lg:block" />

      {/* Header bar component */}
      <OrgHeader
        org={org}
        loading={loadingOrg}
        onRefresh={() => handleFullSyncRefresh()}
        refreshing={refreshing}
      />

      {/* Dynamic Security/Status Informer Banner */}
      {syncStatus && (
        <div className={`w-full py-3 px-4 text-center text-[10px] font-mono uppercase tracking-[0.25em] border-b select-none transition-all duration-300 ${
          syncStatus.type === "success" 
            ? "bg-emerald-950/80 text-emerald-300 border-white/5" 
            : syncStatus.type === "error"
            ? "bg-rose-950/85 text-rose-300 border-white/5"
            : "bg-zinc-900 text-zinc-300 border-white/5"
        }`}>
          [ {syncStatus.message} ]
        </div>
      )}

      {/* Primary body view layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 flex flex-col lg:flex-row gap-10 z-10 relative">
        
        {/* Left column - Album grid lists and main photo photoGrid viewport */}
        <main className="flex-1 flex flex-col gap-10 min-w-0">
          
          {/* Albums catalog cards block */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-zinc-400" />
                <h2 className="text-xl font-serif italic text-white tracking-wide">
                  Exhibition Categories
                </h2>
              </div>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500 font-semibold">
                Sorted by Commit Timeline / Real-Time Data
              </span>
            </div>

            {loadingAlbums ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-44 rounded-none bg-[#121111] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    photoCount={photoCounts[album.name] ?? null}
                    isSelected={selectedAlbum?.id === album.id}
                    onSelect={() => handleSelectAlbum(album)}
                    loadingPhotos={loadingPhotos}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Active moments thumbnail viewport grid */}
          <section className="flex-1 flex flex-col">
            <PhotoGrid
              photos={photos}
              loading={loadingPhotos}
              onPhotoSelect={(p) => setSelectedPhoto(p)}
              albumTitle={selectedAlbum ? selectedAlbum.title : "PLATES"}
            />
          </section>

        </main>

        {/* Right column - AI Companion Panel for curation narrative */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 h-auto lg:h-[calc(100vh-14rem)] sticky top-28 z-20">
          <AIPanel
            album={selectedAlbum}
            photosLength={photos.length}
            photoNames={photos.map((p) => p.name)}
          />
        </aside>

      </div>

      {/* Footer copyright */}
      <footer className="w-full border-t border-white/10 py-8 text-xs font-mono text-zinc-500 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500">
          <span className="tracking-widest uppercase text-[10px]">OasisFotoGraf Exhibition &copy; 2026</span>
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider">
            Curator Engine: <strong className="text-zinc-300 font-semibold tracking-widest">Oasis Intelligent Curator</strong> / GitHub API Integrated
          </span>
        </div>
      </footer>

      {/* Custom Admin Security Override Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-[#111] border border-white/10 p-8 max-w-md w-full rounded-none shadow-2xl space-y-6">
            <h4 className="text-white text-sm font-mono tracking-[0.2em] uppercase border-b border-white/15 pb-3">
              [ SECURE KEY LOCK CHASSIS ]
            </h4>
            
            <p className="text-zinc-400 text-xs leading-relaxed tracking-wide font-light">
              This digital exhibition portal is protected under an administrator secure sync lock to prevent GitHub API threshold exhaustion. Please enter the curation passkey to authorize this operations.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleFullSyncRefresh(securityKeyInput);
            }} className="space-y-4">
              <input
                type="password"
                placeholder="ENTER SECURE PASSCODE..."
                value={securityKeyInput}
                onChange={(e) => setSecurityKeyInput(e.target.value)}
                className="w-full bg-[#161616] border border-white/5 focus:border-white/20 p-3 text-xs text-white uppercase font-mono tracking-wider focus:outline-hidden"
                autoFocus
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSecurityModalOpen(false)}
                  className="px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  [ CANCEL ]
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black font-mono text-[9px] uppercase tracking-widest font-bold hover:bg-[#D1D1D1] transition-color text-center inline-block"
                >
                  AUTHORIZE SYNC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immersive lightbox view modal */}
      <Lightbox
        photo={selectedPhoto}
        photos={photos}
        onClose={() => setSelectedPhoto(null)}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
      />

    </div>
  );
}
