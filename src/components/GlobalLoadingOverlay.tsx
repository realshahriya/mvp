"use client";

import { useEffect, useState } from "react";

export function GlobalLoadingOverlay() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => setVisible(false), 800);
        return () => clearTimeout(timeout);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-neon/30 border-t-neon animate-spin" />
                <div className="text-xs font-mono tracking-[0.25em] uppercase text-[#B0B0B0]">
                    Loading Cencera
                </div>
            </div>
        </div>
    );
}
