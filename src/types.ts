export interface OrgProfile {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  description: string;
  bio?: string;
  location?: string;
}

export interface Album {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  defaultBranch: string;
  stars: number;
  watchers: number;
  title: string;
  date: string;
}

export interface Photo {
  path: string;
  name: string;
  sha: string;
  size: number;
  captureDate?: string;
  url: string;
  githubUrl: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
