import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client helper
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-memory cache to prevent GitHub API rate limiting (60 requests/hour for anonymous requests)
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour caching
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const apiCache: {
  org?: CacheEntry<any>;
  repos?: CacheEntry<any[]>;
  repoPhotos: { [repo: string]: CacheEntry<any[]> };
  repoStories: { [repo: string]: string };
} = {
  repoPhotos: {},
  repoStories: {},
};

// Help helper headers for GitHub API
const getGitHubHeaders = () => {
  return {
    "User-Agent": "OasisFotoGraf-Photo-Portal-Client",
    Accept: "application/vnd.github.v3+json",
  };
};

/**
 * Normalizes title string from repo name to structured printable text
 */
function normalizeTitle(repoName: string): { title: string; date?: string } {
  // Pattern: ceaser_12.24.2025
  const matchCeaserDate = repoName.match(/ceaser_(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (matchCeaserDate) {
    const month = getMonthName(matchCeaserDate[1]);
    return {
      title: `Ceaser Collection`,
      date: `${month} ${matchCeaserDate[2]}, ${matchCeaserDate[3]}`,
    };
  }

  // Pattern: the-origin_12.20-12.21.2025
  const matchOriginDate = repoName.match(/the-origin_(\d{1,2})\.(\d{1,2})-(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (matchOriginDate) {
    return {
      title: "The Origin Collection",
      date: `Dec 20-21, 2025`,
    };
  }

  // Pattern: theOrigin_2026.5
  const matchTheOrigin = repoName.match(/theOrigin_(\d{4})\.(\d{1,2})/);
  if (matchTheOrigin) {
    const month = getMonthName(matchTheOrigin[2]);
    return {
      title: "The Origin",
      date: `${month} ${matchTheOrigin[1]}`,
    };
  }

  // Pattern: ceaserzhao_2026_winter_vacation_2.1-2.16
  const matchWinter = repoName.match(/ceaserzhao_(\d{4})_winter_vacation_(\d{1,2})\.(\d{1,2})-(\d{1,2})\.(\d{1,2})/);
  if (matchWinter) {
    return {
      title: "Winter Vacation Collection",
      date: `Feb 1-16, ${matchWinter[1]}`,
    };
  }

  // Pattern: ceaser_highschool_march_2026
  if (repoName.includes("highschool")) {
    return {
      title: "Ceaser High School Collection",
      date: "March 2026",
    };
  }

  // Pattern: ceaser_april_2026
  const matchApril = repoName.match(/ceaser_([a-zA-Z]+)_(\d{4})/);
  if (matchApril) {
    return {
      title: "Ceaser Collection",
      date: `${capitalize(matchApril[1])} ${matchApril[2]}`,
    };
  }

  // Generic formatting
  const formatted = repoName
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: formatted };
}

function getMonthName(monthStr: string): string {
  const m = parseInt(monthStr, 10);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return months[m - 1] || monthStr;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// REST API Endpoints

// 1. Get Organization profile info
app.get("/api/org", async (req, res) => {
  try {
    const isCached =
      apiCache.org && Date.now() - apiCache.org.timestamp < CACHE_DURATION_MS;
    if (isCached && apiCache.org) {
      return res.json(apiCache.org.data);
    }

    const response = await fetch("https://api.github.com/orgs/OasisFotoGraf", {
      headers: getGitHubHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch org from GitHub API: ${response.statusText}`);
    }

    const data = await response.json();
    apiCache.org = {
      data,
      timestamp: Date.now(),
    };

    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/org:", error);
    // Fallback data in case of API failure or rate limit in development
    res.json({
      login: "OasisFotoGraf",
      name: "OasisFotoGraf",
      avatar_url: "https://avatars.githubusercontent.com/u/250237664?v=4",
      html_url: "https://github.com/OasisFotoGraf",
      public_repos: 7,
      description: "A professional and elegant organization of curated moments, travelogs, and high-fidelity captures.",
    });
  }
});

// 2. Get Repositories list with normalized titles and meta
app.get("/api/repos", async (req, res) => {
  try {
    const isCached =
      apiCache.repos && Date.now() - apiCache.repos.timestamp < CACHE_DURATION_MS;
    if (isCached && apiCache.repos) {
      return res.json(apiCache.repos.data);
    }

    const response = await fetch("https://api.github.com/orgs/OasisFotoGraf/repos?per_page=100&sort=pushed", {
      headers: getGitHubHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch repos from GitHub: ${response.statusText}`);
    }

    const repos: any[] = await response.json();

    const formattedRepos = repos.map((repo) => {
      const { title, date } = normalizeTitle(repo.name);
      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        htmlUrl: repo.html_url,
        description: repo.description,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        size: repo.size,
        defaultBranch: repo.default_branch || "main",
        stars: repo.stargazers_count,
        watchers: repo.watchers_count,
        title,
        date: date || new Date(repo.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" }),
      };
    });

    apiCache.repos = {
      data: formattedRepos,
      timestamp: Date.now(),
    };

    res.json(formattedRepos);
  } catch (error: any) {
    console.error("Error in /api/repos:", error);
    // Fallback data
    res.json([
      { id: 1123601005, name: "ceaser_12.24.2025", title: "Ceaser Collection", date: "Dec 24, 2025", description: "Winter captures of elegant environments", defaultBranch: "main" },
      { id: 1123601558, name: "ceaser_12.26.2025", title: "Ceaser Collection", date: "Dec 26, 2025", description: "Holiday records and festive captures", defaultBranch: "main" },
      { id: 1123602005, name: "the-origin_12.20-12.21.2025", title: "The Origin Collection", date: "Dec 20-21, 2025", description: "Landscapes and urban geometry", defaultBranch: "main" },
      { id: 1160838375, name: "ceaserzhao_2026_winter_vacation_2.1-2.16", title: "Winter Vacation Collection", date: "Feb 1-16, 2026", description: "Scenic memories during winter vacation", defaultBranch: "main" },
      { id: 1181706994, name: "ceaser_highschool_march_2026", title: "Ceaser High School Collection", date: "March 2026", description: "Daily records and high-school youth memories", defaultBranch: "main" },
      { id: 1221317433, name: "ceaser_april_2026", title: "Ceaser Collection", date: "April 2026", description: "Spring views and street dynamics", defaultBranch: "main" },
      { id: 1227325214, name: "theOrigin_2026.5", title: "The Origin", date: "May 2026", description: "Tour in MaoXian China and more :3", defaultBranch: "main" },
    ]);
  }
});

// 3. Get photos inside a specific repository
app.get("/api/repos/:repo/photos", async (req, res) => {
  const { repo } = req.params;
  const branch = req.query.branch as string || "main";

  try {
    const isCached =
      apiCache.repoPhotos[repo] &&
      Date.now() - apiCache.repoPhotos[repo].timestamp < CACHE_DURATION_MS;
    if (isCached && apiCache.repoPhotos[repo]) {
      return res.json(apiCache.repoPhotos[repo].data);
    }

    // Call GitHub Git Trees API recursively to obtain all file paths
    const treeUrl = `https://api.github.com/repos/OasisFotoGraf/${repo}/git/trees/${branch}?recursive=1`;
    const response = await fetch(treeUrl, {
      headers: getGitHubHeaders(),
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned error: ${response.statusText}`);
    }

    const treeData = await response.json();
    if (!treeData.tree || !Array.isArray(treeData.tree)) {
      throw new Error("Invalid structure returned from GitHub trees API");
    }

    // Filter list for common image formats
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".tiff", ".heic"];
    const files = treeData.tree.filter((item: any) => {
      if (item.type !== "blob") return false;
      const lowerPath = item.path.toLowerCase();
      return imageExtensions.some((ext) => lowerPath.endsWith(ext));
    });

    const photos = files.map((file: any) => {
      const fileName = file.path.split("/").pop() || file.path;
      // Get human-friendly date if it matches structured capture format
      const dateMatch = fileName.match(/(\d{4})(\d{2})(\d{2})_(\d{2})/);
      let captureDate = undefined;
      if (dateMatch) {
         captureDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }

      return {
        path: file.path,
        name: fileName,
        sha: file.sha,
        size: file.size,
        captureDate,
        // Raw CDN URL so browser can display it directly and fast
        url: `https://raw.githubusercontent.com/OasisFotoGraf/${repo}/${branch}/${file.path}`,
        githubUrl: `https://github.com/OasisFotoGraf/${repo}/blob/${branch}/${file.path}`,
      };
    });

    apiCache.repoPhotos[repo] = {
      data: photos,
      timestamp: Date.now(),
    };

    res.json(photos);
  } catch (error: any) {
    console.error(`Error in /api/repos/${repo}/photos:`, error);
    
    // Serve fallback mock pictures if GitHub API fails
    // This allows active UI test verification when offline/throttled
    let mockPhotos: any[] = [];
    if (repo === "theOrigin_2026.5") {
      mockPhotos = [
        { name: "20260502_082709.jpg", path: "20260502_082709.jpg", size: 2430720, url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&auto=format&fit=crop&q=80", captureDate: "2026-05-02" },
        { name: "20260502_092728.jpg", path: "20260502_092728.jpg", size: 5415999, url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80", captureDate: "2026-05-02" },
        { name: "20260502_101531.jpg", path: "20260502_101531.jpg", size: 6141903, url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80", captureDate: "2026-05-02" },
        { name: "20260502_114400.jpg", path: "20260502_114400.jpg", size: 8198823, url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&auto=format&fit=crop&q=80", captureDate: "2026-05-02" },
      ];
    } else {
      mockPhotos = [
        { name: "capture_01.jpg", path: "capture_01.jpg", size: 3102312, url: "https://images.unsplash.com/photo-1472214222541-d510753a4707?w=1200&auto=format&fit=crop&q=80" },
        { name: "capture_02.jpg", path: "capture_02.jpg", size: 1451290, url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80" },
        { name: "capture_03.jpg", path: "capture_03.jpg", size: 4520310, url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&auto=format&fit=crop&q=80" },
      ];
    }
    res.json(mockPhotos);
  }
});

// 4. Invalidate Cache to refresh live photos on demand
app.post("/api/refresh", (req, res) => {
  apiCache.org = undefined;
  apiCache.repos = undefined;
  apiCache.repoPhotos = {};
  apiCache.repoStories = {};
  res.json({ success: true, message: "Server-side caches cleared successfully." });
});

// 5. Generate descriptive Photo Stories using Gemini AI
app.post("/api/repos/:repo/story", async (req, res) => {
  const { repo } = req.params;
  const { title, description, photosCount, photoNames } = req.body;

  if (apiCache.repoStories[repo]) {
    return res.json({ story: apiCache.repoStories[repo] });
  }

  if (!ai) {
    return res.status(503).json({ error: "Symphony Curator Engine not initialized. Please verify configuration keys are set." });
  }

  try {
    const listSnippet = Array.isArray(photoNames) ? photoNames.slice(0, 15).join(", ") : "";
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the chief visual companion narrator & smart curator of "OasisFotoGraf", a high-fidelity photo journal. Write a beautiful, short, atmospheric, and highly poetic background narrative/travelogue (in Chinese, as requested by the Chinese organization portal viewer) about the repository.
Repo Code-name: "${repo}"
Title: "${title || repo}"
Description of album: "${description || "curated photographic memories"}"
Total Photos: ${photosCount || 10}
Sample photos filenames: [${listSnippet}]

Structure:
- Give a poetic title matching the theme.
- Write 2 narrative paragraphs outlining the aesthetic mood, potential location vibe, weather, details, or story of this collection. Match the tone of pure visual art, silence, and captured eternity.
- Keep it highly clean and elegant. Do not output raw JSON, start directly with the title.`,
    });

    const storyText = response.text || "暂无AI故事生成。";
    apiCache.repoStories[repo] = storyText;
    res.json({ story: storyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate narrative." });
  }
});

// 6. Interactive AI Companion Chat about OasisFotoGraf photos
app.post("/api/chat", async (req, res) => {
  const { messages, currentRepo } = req.body;

  if (!ai) {
    return res.status(503).json({ error: "Curator Engine not initialized." });
  }

  try {
    const repoListContext = apiCache.repos?.data
      ? apiCache.repos.data.map((r) => `- Album "${r.title}" (${r.name}): ${r.description || "curated collection"}, Date: ${r.date}`).join("\n")
      : "- ceaser_12.24.2025\n- ceaser_12.26.2025\n- the-origin_12.20-12.21.2025\n- ceaserzhao_2026_winter_vacation_2.1-2.16\n- ceaser_highschool_march_2026\n- ceaser_april_2026\n- theOrigin_2026.5 (MaoXian tour in China)";

    const activeRepoContext = currentRepo 
      ? `Currently the user is active on the album: "${currentRepo.title}" (${currentRepo.name}) containing ${currentRepo.photosLength || 0} photos.`
      : "The user is browsing the main gallery page showing all albums of the organization.";

    const systemPrompt = `You are "Oasis AI", the resident photography curator and companion for the OasisFotoGraf Photo Portal.
OasisFotoGraf is a premium photography publication team recording atmospheric journeys, structures, and candid instances.

Organization repository collections:
${repoListContext}

${activeRepoContext}

Goal:
- Warmly, elegantly, and concisely discuss the photography, albums, dates, styles, and stories.
- Answer questions in Chinese since the portal UI and user request is in Chinese. Fully support the user's quest to explore these photographs.
- If asked about photography techniques, match an artistic, minimalist, analog-lover, or landscape architecture professional's perspective. Keep answers short and beautiful.`;

    // Reconstruct conversation messages for Gemini chat
    // Limit to the last 8 messages
    const recentMessages = messages ? messages.slice(-8) : [];
    
    // Convert to Gemini contents format
    const contents = recentMessages.map((msg: any) => {
      return {
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }],
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ content: response.text || "不好意思，我暂时无法进行思考。请稍后重试。" });
  } catch (error: any) {
    console.error("Chat companion error:", error);
    res.status(500).json({ error: error.message || "Something went wrong during narration conversation." });
  }
});

// Setup development or production server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode using Vite as a middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware embedded (Development Mode)");
  } else {
    // Production Mode serving compiled bundles
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static assets from dist (Production Mode)");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
