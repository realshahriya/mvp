"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { backendClient } from "@/lib/backendClient";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Greetings. I am CenceraAI. How can I assist you with on-chain trust analysis today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    const reply = await backendClient.sendChat(
      userMsg,
      "CENCERA_WEB_WIDGET",
      "0x0000000000000000000000000000000000000000" // Mock wallet
    );

    if (reply) {
      setChat(prev => [...prev, { role: "bot", text: reply }]);
    } else {
      setChat(prev => [...prev, { role: "bot", text: "I am currently offline or transitioning between memory states. Please try again in 60 seconds." }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96 h-[500px] bg-[#0A0A0A] border border-[#222] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-brand-primary/10 border-b border-brand-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                <span className="text-xs font-mono font-bold text-brand-primary uppercase tracking-widest">CenceraAI Live</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#666] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs font-mono leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-brand-primary text-black rounded-tr-none" 
                      : "bg-[#181818] text-[#E6E6E6] border border-[#2A2A2A] rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#181818] text-[#666] border border-[#2A2A2A] rounded-2xl rounded-tl-none p-3">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#222] bg-[#0D0D0D]">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask Cencera..."
                  className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl py-2.5 pl-4 pr-12 text-xs font-mono text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-primary rounded-lg text-black hover:bg-brand-primary/80 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-primary rounded-full shadow-[0_0_20px_rgba(153,246,228,0.3)] flex items-center justify-center text-black relative z-[101]"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
