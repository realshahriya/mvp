"use client";

import { useState } from "react";
import { MessageCircle, Search, Send, ChevronDown } from "lucide-react";
import { useAccount } from "wagmi";

type Conversation = {
    id: string;
    title: string;
    handle: string;
    lastMessage: string;
    unread: number;
    time: string;
};

type Message = {
    id: string;
    fromSelf: boolean;
    content: string;
    time: string;
};

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: "1",
        title: "Risk Ops Squad",
        handle: "@risk-ops",
        lastMessage: "Share that new PEPE contract we flagged.",
        unread: 2,
        time: "2m",
    },
    {
        id: "2",
        title: "DeFi Research",
        handle: "@defi-research",
        lastMessage: "That wallet looks like a smart contract account.",
        unread: 0,
        time: "1h",
    },
    {
        id: "3",
        title: "Security Hotline",
        handle: "@alerts",
        lastMessage: "New report came in from Cencera UI.",
        unread: 0,
        time: "Yesterday",
    },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
    "1": [
        { id: "m1", fromSelf: false, content: "GM, any new risky wallets today?", time: "10:01" },
        { id: "m2", fromSelf: true, content: "Yes, a few memecoins with suspicious renounce patterns.", time: "10:03" },
        { id: "m3", fromSelf: false, content: "Share that new PEPE contract we flagged.", time: "10:04" },
    ],
    "2": [
        { id: "m4", fromSelf: true, content: "I think this address is a smart contract account.", time: "09:27" },
        { id: "m5", fromSelf: false, content: "Agree, nonce pattern looks like an account abstraction wallet.", time: "09:29" },
    ],
    "3": [
        { id: "m6", fromSelf: false, content: "New report came in from Cencera UI.", time: "Yesterday" },
    ],
};

export default function MessagesPage() {
    const { address } = useAccount();
    const [selectedId, setSelectedId] = useState<string>("1");
    const [input, setInput] = useState("");
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const conversations = MOCK_CONVERSATIONS;
    const filteredConversations =
        filter === "unread" ? conversations.filter((conv) => conv.unread > 0) : conversations;
    const activeConversation =
        filteredConversations.find((conv) => conv.id === selectedId) ??
        filteredConversations[0] ??
        conversations[0];
    const messages = activeConversation ? MOCK_MESSAGES[activeConversation.id] ?? [] : [];

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet";

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 w-full mx-auto">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#E6E6E6] font-sans flex items-center gap-2">
                        Direct Messages
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full border border-[#2A2A2A] text-[#B0B0B0]">
                            Beta
                        </span>
                    </h1>
                    <p className="text-[#B0B0B0] text-sm">
                        Chat with collaborators and share wallets, contracts, and Cencera analysis links.
                    </p>
                </div>
                <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2A2A2A] bg-[#111111] hover:bg-[#181818] text-xs text-[#E6E6E6] font-medium transition-colors">
                    <ChevronDown className="w-3 h-3" />
                    Inbox
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,2fr)_minmax(0,1.4fr)] md:h-[70vh] xl:h-[78vh] 2xl:h-[82vh]">
                <div className="bg-[#111111]/90 border border-[#2A2A2A] rounded-2xl p-3 flex flex-col gap-3 min-h-[220px]">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-xs text-[#B0B0B0]">
                            <MessageCircle className="w-4 h-4 text-neon" />
                            Inbox
                        </div>
                        <span className="text-[10px] text-[#777777]">
                            {conversations.length} chats
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
                        <input
                            placeholder="Search DMs"
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#161616] border border-[#2A2A2A] text-xs text-[#E6E6E6] placeholder:text-[#666666] focus:outline-none focus:border-neon/40"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-1 text-[11px] text-[#8E8E8E]">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-2 py-1 rounded-lg border transition-colors ${
                                filter === "all"
                                    ? "border-neon/40 bg-neon/10 text-neon"
                                    : "border-transparent bg-transparent hover:bg-[#181818]"
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`px-2 py-1 rounded-lg border transition-colors ${
                                filter === "unread"
                                    ? "border-neon/40 bg-neon/10 text-neon"
                                    : "border-transparent bg-transparent hover:bg-[#181818]"
                            }`}
                        >
                            Unread
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {filteredConversations.map((conv) => {
                            const isActive = conv.id === activeConversation.id;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full text-left px-3 py-2 rounded-xl transition-all border ${
                                        isActive
                                            ? "bg-[#1F1F1F] border-neon/30"
                                            : "bg-transparent border-transparent hover:bg-[#181818] hover:border-[#2A2A2A]"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="truncate">
                                            <div className="text-xs font-semibold text-[#E6E6E6] truncate">
                                                {conv.title}
                                            </div>
                                            <div className="text-[11px] text-[#888888] truncate">
                                                {conv.handle}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-[#777777]">
                                                {conv.time}
                                            </span>
                                            {conv.unread > 0 && (
                                                <span className="min-w-[18px] px-1 h-[18px] flex items-center justify-center rounded-full bg-neon/20 text-neon text-[10px] font-mono">
                                                    {conv.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-1 text-[11px] text-[#9A9A9A] truncate">
                                        {conv.lastMessage}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-[#111111]/90 border border-[#2A2A2A] rounded-2xl flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
                        <div>
                            <div className="text-sm font-semibold text-[#E6E6E6]">
                                {activeConversation.title}
                            </div>
                            <div className="text-[11px] text-[#8E8E8E]">
                                {activeConversation.handle} • Private DM
                            </div>
                        </div>
                        <button className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#2A2A2A] text-[11px] text-[#E6E6E6] transition-colors">
                            View profile
                        </button>
                    </div>
                    <div className="px-4 pt-3 pb-2 border-b border-[#2A2A2A] flex flex-wrap gap-2 text-[11px]">
                        <button
                            onClick={() => {
                                const text = shortAddress === "Connect wallet" ? "" : `Check this wallet: ${shortAddress}`;
                                if (!text) return;
                                setInput((prev) => (prev ? `${prev} ${text}` : text));
                            }}
                            className="px-2 py-1 rounded-full border border-neon/30 bg-neon/10 text-neon hover:bg-neon/20 transition-colors"
                        >
                            Share my wallet
                        </button>
                        <button
                            onClick={() => {
                                const text = "Share analysis link: https://app.cencera.io/analysis/0x...";
                                setInput((prev) => (prev ? `${prev} ${text}` : text));
                            }}
                            className="px-2 py-1 rounded-full border border-[#2A2A2A] bg-[#181818] text-[#E6E6E6] hover:bg-[#202020] transition-colors"
                        >
                            Attach analysis
                        </button>
                        <button
                            onClick={() => {
                                const text = "Flag this address for deeper review.";
                                setInput((prev) => (prev ? `${prev} ${text}` : text));
                            }}
                            className="px-2 py-1 rounded-full border border-[#2A2A2A] bg-[#181818] text-[#E6E6E6] hover:bg-[#202020] transition-colors"
                        >
                            Request review
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.fromSelf ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                                        msg.fromSelf
                                            ? "bg-neon/20 text-[#0B0B0B]"
                                            : "bg-[#1A1A1A] text-[#E6E6E6] border border-[#2A2A2A]"
                                    }`}
                                >
                                    <div>{msg.content}</div>
                                    <div className={`mt-1 text-[10px] ${msg.fromSelf ? "text-[#134556]" : "text-[#777777]"}`}>
                                        {msg.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center text-xs text-[#777777]">
                                Start a conversation by sending the first message.
                            </div>
                        )}
                    </div>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (!input.trim()) return;
                            setInput("");
                        }}
                        className="border-t border-[#2A2A2A] px-4 py-3 flex items-center gap-3"
                    >
                        <div className="flex-1 relative">
                            <input
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Message..."
                                className="w-full px-3 py-2 pr-10 rounded-lg bg-[#161616] border border-[#2A2A2A] text-sm text-[#E6E6E6] placeholder:text-[#666666] focus:outline-none focus:border-neon/40"
                            />
                        </div>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-neon/20 hover:bg-neon/30 text-neon transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={!input.trim()}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                <div className="hidden xl:flex bg-[#111111]/90 border border-[#2A2A2A] rounded-2xl flex-col p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                        <div>
                            <div className="text-xs text-[#8E8E8E] uppercase tracking-[0.18em]">
                                Conversation context
                            </div>
                            <div className="text-sm text-[#B0B0B0]">
                                Share wallets, contracts and Cencera trust reports here.
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3 text-xs text-[#B0B0B0]">
                        <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-3 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-[0.16em] text-[#777777]">
                                    Current wallet
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-[#1F1F1F] border border-[#2A2A2A] text-[10px] font-mono">
                                    Live
                                </span>
                            </div>
                            <div className="mt-1 font-mono text-[#E6E6E6]">
                                {shortAddress}
                            </div>
                        </div>
                        <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-3 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-[0.16em] text-[#777777]">
                                    Suggested actions
                                </span>
                            </div>
                            <ul className="mt-1 space-y-1 list-disc list-inside">
                                <li>Paste addresses you want to analyze together.</li>
                                <li>Drop Cencera links instead of full screenshots.</li>
                                <li>Use “Request review” chip for critical cases.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
