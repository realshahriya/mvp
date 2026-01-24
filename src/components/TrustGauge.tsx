"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TrustGaugeProps {
    score: number; // 0 to 100
    size?: number;
    showLabel?: boolean;
    safeThreshold?: number;
    riskThreshold?: number;
}

export function TrustGauge({ score, size = 200, showLabel = true, safeThreshold = 80, riskThreshold = 50 }: TrustGaugeProps) {
    const [displayScore, setDisplayScore] = useState(0);

    // Animate the number counting up
    useEffect(() => {
        const duration = 1500; // ms
        const steps = 60;
        const stepTime = duration / steps;
        const increment = score / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setDisplayScore(score);
                clearInterval(timer);
            } else {
                setDisplayScore(Math.floor(current));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [score]);

    // Determine color based on score
    const getColor = (s: number) => {
        if (s >= safeThreshold) return "text-trust-100"; // Green
        if (s >= riskThreshold) return "text-yellow-500"; // Amber
        return "text-red-500"; // Red
    };

    // SVG Config
    // SVG Config
    const strokeWidth = size < 100 ? 5 : 15; // Thinner stroke for small sizes
    const padding = 40; // Increased padding to prevent any shadow clipping
    const radius = (size - strokeWidth - padding) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const navColor = score >= safeThreshold
        ? "rgb(0, 255, 157)"
        : score >= riskThreshold
            ? "rgb(234, 179, 8)"
            : "rgb(239, 68, 68)";

    const shadowColor = score >= safeThreshold
        ? "rgba(0, 255, 157, 0.4)"
        : score >= riskThreshold
            ? "rgba(234, 179, 8, 0.4)"
            : "rgba(239, 68, 68, 0.4)";

    const currentState = score >= safeThreshold ? 'safe' : score >= riskThreshold ? 'risk' : 'danger';

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
            {/* Background Circle */}
            <svg className="absolute transform -rotate-90 w-full h-full">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-white/5"
                />
                {/* Progress Circle */}
                <motion.circle
                    key={currentState}
                    initial={{ stroke: navColor, filter: `drop-shadow(0px 0px 10px ${shadowColor})` }}
                    animate={{
                        strokeDashoffset: offset,
                        stroke: navColor,
                        filter: `drop-shadow(0px 0px 10px ${shadowColor})`
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                />
            </svg>

            {/* Score Text */}
            <div className="flex flex-col items-center z-10" style={{ transform: `scale(${size / 200})` }}>
                {/*
                    Using a scale transform is smoother for arbitrary sizes than breakpoints
                    Base size is 200px, so we scale relative to that.
                 */}
                <div className="flex flex-col items-center justify-center">
                    <span
                        className={`text-5xl font-bold tracking-tighter ${getColor(score)} transition-colors duration-300`}
                        style={{ textShadow: `0 0 20px ${shadowColor}` }}
                    >
                        {displayScore}
                    </span>
                    {showLabel && (
                        <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1 whitespace-nowrap">Trust Score</span>
                    )}
                </div>
            </div>
        </div>
    );
}
