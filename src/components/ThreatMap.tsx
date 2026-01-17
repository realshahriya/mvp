"use client";

import { useEffect, useRef } from 'react';

interface Point {
    x: number;
    y: number;
    color: string;
    radius: number;
    life: number;
    vx: number;
    vy: number;
}

export function ThreatMap() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize
        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();

        // State
        const points: Point[] = [];
        const maxPoints = 50;
        let frame = 0;

        // Animation Loop
        const animate = () => {
            frame++;
            // Clear trails
            ctx.fillStyle = 'rgba(10, 10, 15, 0.2)'; // Fade out effect
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Spawn new points
            if (points.length < maxPoints && Math.random() < 0.1) {
                const isRisk = Math.random() < 0.3;
                points.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    color: isRisk ? '#ef4444' : '#22c55e', // Red or Green
                    radius: Math.random() * 2 + 1,
                    life: 1.0,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5
                });
            }

            // Draw World Grid (Static-ish background)
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
            }
            for (let i = 0; i < canvas.height; i += 40) {
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
            }
            ctx.stroke();

            // Update & Draw Points
            for (let i = points.length - 1; i >= 0; i--) {
                const p = points[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.005;

                if (p.life <= 0) {
                    points.splice(i, 1);
                    continue;
                }

                // Draw Point
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fill();

                // Draw Ping/Ripple
                if (frame % 60 === 0 || p.life > 0.9) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius * 4 * (1 - p.life), 0, Math.PI * 2);
                    ctx.strokeStyle = p.color;
                    ctx.stroke();
                }

                // Draw Connections
                points.forEach(other => {
                    const dx = p.x - other.x;
                    const dy = p.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = p.color;
                        ctx.globalAlpha = p.life * 0.1; // Reduced opacity
                        ctx.stroke();
                    }
                });

                ctx.globalAlpha = 1.0;
            }

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="w-full h-full relative bg-zinc-900/50 rounded-xl overflow-hidden group">
            <canvas ref={canvasRef} className="block opacity-60" />

            {/* Overlay UI */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Threat Map</h3>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 pointer-events-none text-right">
                <div className="text-xs font-mono text-zinc-400">
                    <span className="text-zinc-600">Nodes Active:</span> 8421
                </div>
                <div className="text-xs font-mono text-zinc-400">
                    <span className="text-zinc-600">Threats Detected:</span> 12
                </div>
            </div>
        </div>
    );
}
