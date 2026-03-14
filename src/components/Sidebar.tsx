"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, X, BarChart3, Settings, Zap, MessageSquare } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        { name: "Overview", href: "/", icon: LayoutDashboard },
        { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
        { name: "Plans", href: "/plans", icon: Zap },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    const NavLinks = () => (
        <>
            {links.map((link, index) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                    <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                    >
                        <Link
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out group relative overflow-hidden font-mono text-sm ${
                                isActive
                                    ? "text-zinc-100 bg-white/10 border border-white/10 shadow-lg shadow-white/5"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
                            }`}
                            onClick={() => setIsOpen(false)}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-neon/10 to-transparent opacity-50"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? "text-white" : "group-hover:scale-110"}`} />
                            <span className="font-medium relative">{link.name}</span>
                        </Link>
                    </motion.div>
                );
            })}
        </>
    );

    const Footer = () => (
        <div className="p-4 border-t border-subtle bg-black/20 space-y-3">
            <a
                href="https://cencera.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 font-mono text-xs transition-colors"
            >
                <MessageSquare className="w-4 h-4" />
                cencera.xyz
            </a>
            <div className="text-[10px] text-amber-300 text-center font-mono uppercase tracking-[0.25em]">
                Demo Showcase
            </div>
            <div className="text-xs text-zinc-500 text-center font-mono">
                <b>CenceraAI v1.0</b>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle */}
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 glass-panel rounded-lg text-white hover:bg-white/10 transition-all duration-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed inset-y-0 left-0 z-40 w-64 glass-panel">
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-subtle bg-gradient-to-r from-neon/5 to-transparent">
                        <Image src="/logo.png" alt="Cencera Logo" width={32} height={32} className="mr-3" priority />
                        <span className="text-xl font-bold tracking-tight text-white font-sans">CENCERA</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        <NavLinks />
                    </nav>

                    <Footer />
                </div>
            </div>

            {/* Mobile Sidebar */}
            <motion.div
                initial={false}
                animate={{ x: isOpen ? 0 : -256 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                className="md:hidden fixed inset-y-0 left-0 z-40 w-64 glass-panel"
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-subtle bg-gradient-to-r from-neon/5 to-transparent">
                        <Image src="/logo.png" alt="Cencera Logo" width={32} height={32} className="mr-3" priority />
                        <span className="text-xl font-bold tracking-tight text-white font-sans">CENCERA</span>
                    </div>
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out group relative overflow-hidden font-mono text-sm ${
                                        isActive
                                            ? "text-zinc-100 bg-white/10 border border-white/10"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
                                    }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-neon/10 to-transparent opacity-50" />}
                                    <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? "text-white" : "group-hover:scale-110"}`} />
                                    <span className="font-medium relative">{link.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <Footer />
                </div>
            </motion.div>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
