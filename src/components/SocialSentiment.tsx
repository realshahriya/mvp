"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SentimentPoint } from "@/lib/mockData";
import { TrendingUp } from "lucide-react";

export function SocialSentiment({ data }: { data: SentimentPoint[] }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-zinc-900/85 rounded-2xl border border-white/10 p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Social Sentiment 24h
            </h3>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[-100, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6, fill: '#fff' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
