import React, { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot, Sparkles, Quote } from "lucide-react";
import { Album, ChatMessage } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AIPanelProps {
  album: Album | null;
  photosLength: number;
  photoNames: string[];
}

export default function AIPanel({ album, photosLength, photoNames }: AIPanelProps) {
  const [story, setStory] = useState("");
  const [loadingStory, setLoadingStory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentTab, setCurrentTab] = useState<"story" | "chat">("story");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-generate album background story on selecting an album
  useEffect(() => {
    if (!album) {
      setStory("");
      return;
    }

    const fetchStory = async () => {
      setLoadingStory(true);
      setStory("");
      try {
        const response = await fetch(`/api/repos/${album.name}/story`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: album.title,
            description: album.description,
            photosCount: photosLength,
            photoNames: photoNames,
          }),
        });
        const data = await response.json();
        if (data.story) {
          setStory(data.story);
        } else {
          setStory("No automatic narrative is configured for this specific collection series.");
        }
      } catch (err) {
        console.error("Failed to load story from server:", err);
        setStory("Error synchronizing with narrative core. Please check your configuration settings.");
      } finally {
        setLoadingStory(false);
      }
    };

    fetchStory();
  }, [album, photosLength, photoNames]);

  // Set up welcome message for the chat tab
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Greetings. I am the Oasis Curator. Every catalog compiled under OasisFotoGraf documents authentic moments, geometries, and natural light cycles. Ask me about custom years, camera profiles, or select an exhibit to generate a literary essay.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [messages]);

  // Handle chat window scrolling
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentTab === "chat") {
      scrollToBottom();
    }
  }, [messages, currentTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loadingChat) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoadingChat(true);

    try {
      const chatContext = {
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        currentRepo: album ? { title: album.title, name: album.name, photosLength } : null,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatContext),
      });

      const data = await response.json();
      if (data.content) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: "assistant",
            content: data.content,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("Chat API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: `Apologies, an execution error occurred: ${err.message || "request failed"}. Please check your configuration.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Dialogue purged. Ask me anything regarding the digital exhibition spaces.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  return (
    <div className="w-full bg-[#111] border border-white/10 rounded-none overflow-hidden shadow-2xl h-full flex flex-col font-sans">
      {/* Header bar panel */}
      <div className="bg-[#0A0A0A] border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] font-mono tracking-[0.25em] font-semibold text-zinc-200 uppercase">
            Oasis Curator / AI
          </span>
        </div>
        <div className="flex bg-white/5 border border-white/10 rounded-none p-0.5 text-[9px] font-mono tracking-wider">
          <button
            onClick={() => setCurrentTab("story")}
            className={`px-3 py-1 rounded-none transition-colors cursor-pointer uppercase ${
              currentTab === "story" ? "bg-white text-black font-semibold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            LITERARY
          </button>
          <button
            onClick={() => setCurrentTab("chat")}
            className={`px-3 py-1 rounded-none transition-colors cursor-pointer uppercase ${
              currentTab === "chat" ? "bg-white text-black font-semibold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            DIALOGUE
          </button>
        </div>
      </div>

      {/* Main Container Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-black/5">
        <AnimatePresence mode="wait">
          {currentTab === "story" ? (
            <motion.div
              key="story-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {loadingStory ? (
                <div className="w-full py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-5 h-5 rounded-none border border-zinc-700 border-t-white animate-spin" />
                  <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">GENERATING BACKGROUND STORY...</span>
                </div>
              ) : !album ? (
                <div className="text-center py-16 text-zinc-550">
                  <Bot className="w-6 h-6 mx-auto mb-3 text-zinc-700" />
                  <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 leading-relaxed mb-1">
                    [ SELECT EXHIBITION ]
                  </p>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Select a catalog year on the left to activate our curator engine and view automated curated logs.
                  </p>
                </div>
              ) : (
                <div className="prose prose-invert h-full">
                  <div className="flex items-center gap-1.5 mb-3 text-[9px] font-mono tracking-widest uppercase text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-none max-w-max">
                    <Bot className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Symphony Curator Engine</span>
                  </div>

                  {/* Poetic quote rendering block */}
                  <div className="text-xs text-zinc-300 font-serif italic leading-relaxed border-l border-zinc-650 pl-4 py-1.5 mb-5 space-y-2">
                    <Quote className="w-3.5 h-3.5 text-zinc-650 mb-1.5" />
                    <span className="whitespace-pre-line block text-[#CECECE] font-light md:text-sm tracking-wide leading-relaxed">{story}</span>
                  </div>

                  <p className="text-[10px] text-zinc-600 font-mono tracking-widest leading-relaxed uppercase pt-4 border-t border-white/5">
                    ARCHIVE RELIED ON: {photosLength} RAW SPECIMENS INDEXED UNDER "{album.title}".
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full space-y-4"
            >
              {/* Chat lists */}
              <div className="flex-1 space-y-4 pr-1 text-xs select-text">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-[90%] ${
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    {/* Role Tag */}
                    <div className="text-[8px] font-mono uppercase tracking-widest select-none pt-1 text-zinc-500 select-none">
                      {msg.role === "user" ? "USER" : "AI"}
                    </div>

                    {/* Content text */}
                    <div
                      className={`rounded-none px-4 py-3 leading-relaxed border ${
                        msg.role === "user"
                          ? "bg-[#181818] border-white/10 text-zinc-100"
                          : "bg-[#0c0c0c] border-white/5 text-zinc-300"
                      }`}
                    >
                      <p className="whitespace-pre-line font-sans tracking-wide text-xs">{msg.content}</p>
                      <span className="text-[8px] font-mono text-zinc-600 mt-2 block select-none text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                
                {loadingChat && (
                  <div className="flex items-start gap-3 mr-auto max-w-[85%] select-none">
                    <div className="text-[8px] font-mono uppercase tracking-widest text-zinc-500 pt-1">
                      AI
                    </div>
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-none px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-white rounded-none animate-bounce delay-100" />
                        <span className="w-1 h-1 bg-white rounded-none animate-bounce delay-200" />
                        <span className="w-1 h-1 bg-white rounded-none animate-bounce delay-300" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input panel block for chat */}
      {currentTab === "chat" && (
        <div className="p-4 bg-[#0A0A0A] border-t border-white/10 flex flex-col gap-3">
          {/* Action buttons (Clear chat) */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 text-[9px] font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer tracking-wider uppercase"
              title="Clear all chat history"
            >
              <Trash2 className="w-3 h-3" />
              <span>PURGE DIALOGUE</span>
            </button>
            {album && (
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                CONTEXT / {album.title}
              </span>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="ASK REGARDING SHADOWS AND LIGHT..."
              disabled={loadingChat}
              className="flex-1 bg-[#121212] border border-white/5 rounded-none px-3 py-2.5 text-xs text-zinc-200 focus:outline-hidden focus:border-white/20 select-text"
            />
            <button
              type="submit"
              disabled={loadingChat || !inputMessage.trim()}
              className="p-2.5 bg-white text-black hover:bg-[#D1D1D1] rounded-none transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
