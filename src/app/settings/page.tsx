"use client";

import { Key, Bell, Shield, User, CreditCard, Database, Moon, Globe, Mail, Lock, Eye, EyeOff, Copy, Trash2, Plus, Wallet, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAccount } from 'wagmi';
import { appKit } from '@/lib/walletConfig';

export default function SettingsPage() {
    const { isConnected } = useAccount();
    const [showApiKey, setShowApiKey] = useState(false);
    const [notifications, setNotifications] = useState({
        email: true,
        threats: true,
        reports: false,
        updates: true,
    });

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-2">
                    <Shield className="w-10 h-10 text-neon" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold text-white font-sans">Connect Wallet</h1>
                    <p className="text-zinc-400 text-sm">
                        You need to connect your wallet to manage your settings, API keys, and account preferences securely.
                    </p>
                </div>
                <button
                    onClick={() => appKit.open()}
                    className="flex items-center gap-2 px-6 py-3 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 rounded-xl text-neon font-mono font-bold transition-all"
                >
                    <Wallet className="w-5 h-5" />
                    Connect Access
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            {/* Warning Banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Notice: Mock data is currently being used for demonstration purposes.</span>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 font-sans">Settings</h1>
                <p className="text-zinc-400 text-sm">Manage your account and preferences</p>
            </div>

            {/* Account Settings - Cyan Primary */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <User className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-white">Account</h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                            <input
                                type="text"
                                defaultValue="John Doe"
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon/30 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                            <input
                                type="email"
                                defaultValue="john@example.com"
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon/30 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Organization</label>
                        <input
                            type="text"
                            defaultValue="ACME Corp"
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon/30 transition-colors"
                        />
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <button className="px-6 py-2.5 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 text-neon font-medium rounded-lg transition-all text-sm">
                            Save Changes
                        </button>
                    </div>
                </div>
            </section>

            {/* API Keys - Purple Accent */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <Key className="w-5 h-5 text-brand-purple" />
                    <h2 className="text-xl font-bold text-white">API Keys</h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-white mb-1">Production API Key</h3>
                            <p className="text-xs text-zinc-500">Use this key in your production environment</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Key
                        </button>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1">
                                <code className="text-sm text-zinc-300 font-mono">
                                    {showApiKey ? "cen_prod_1a2b3c4d5e6f7g8h9i0j" : "cen_prod_••••••••••••••••"}
                                </code>
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>Created 2 months ago</span>
                            <span>•</span>
                            <span>Last used 5 minutes ago</span>
                        </div>
                    </div>
                    <div className="p-4 bg-neon/5 border border-neon/10 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-neon flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="text-neon font-medium mb-1">Keep your API keys secure</p>
                                <p className="text-zinc-400 text-xs">Never share your API keys or commit them to version control. Rotate keys regularly for security.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notifications - Orange Accent */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <Bell className="w-5 h-5 text-brand-orange" />
                    <h2 className="text-xl font-bold text-white">Notifications</h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-4">
                    {[
                        { key: "email", label: "Email Notifications", description: "Receive email alerts for important events" },
                        { key: "threats", label: "Threat Alerts", description: "Get notified when threats are detected" },
                        { key: "reports", label: "Weekly Reports", description: "Summary of your API usage and activity" },
                        { key: "updates", label: "Product Updates", description: "News about new features and improvements" },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-zinc-400" />
                                <div>
                                    <div className="text-sm font-medium text-white mb-1">{item.label}</div>
                                    <div className="text-xs text-zinc-500">{item.description}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-neon' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Security - Green Accent */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <Lock className="w-5 h-5 text-brand-green" />
                    <h2 className="text-xl font-bold text-white">Security</h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-4">
                    <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-white mb-1">Change Password</div>
                                <div className="text-xs text-zinc-500">Update your account password</div>
                            </div>
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-colors">
                                Update
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-white mb-1">Two-Factor Authentication</div>
                                <div className="text-xs text-zinc-500">Add an extra layer of security</div>
                            </div>
                            <button className="px-4 py-2 bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/20 hover:border-brand-green/30 text-brand-green text-sm font-medium rounded-lg transition-all">
                                Enable
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-white mb-1">Active Sessions</div>
                                <div className="text-xs text-zinc-500">Manage your logged-in devices</div>
                            </div>
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-colors">
                                View
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Preferences - Cyan Primary */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <Globe className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-white">Preferences</h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Theme</label>
                        <select className="w-full md:w-64 px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon/30 transition-colors">
                            <option value="dark">Dark (Default)</option>
                            <option value="light">Light</option>
                            <option value="auto">System Default</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Default Chain</label>
                        <select className="w-full md:w-64 px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon/30 transition-colors">
                            <option value="ethereum">Ethereum Mainnet</option>
                            <option value="polygon">Polygon</option>
                            <option value="arbitrum">Arbitrum</option>
                            <option value="optimism">Optimism</option>
                            <option value="base">Base</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Language</label>
                        <select className="w-full md:w-64 px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon/30 transition-colors">
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Billing - Pink Accent */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <CreditCard className="w-5 h-5 text-brand-pink" />
                    <h2 className="text-xl font-bold text-white">Billing</h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Current Plan: Professional</h3>
                            <p className="text-sm text-zinc-400">$99/month • 10M requests included</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-colors">
                            Upgrade Plan
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                            <div className="text-xs text-zinc-500 mb-1">API Usage</div>
                            <div className="text-xl font-bold text-white">4.2M / 10M</div>
                            <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-neon" style={{ width: '42%' }} />
                            </div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                            <div className="text-xs text-zinc-500 mb-1">Next Billing</div>
                            <div className="text-xl font-bold text-white">Feb 15, 2026</div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                            <div className="text-xs text-zinc-500 mb-1">Total Spent</div>
                            <div className="text-xl font-bold text-white">$297</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-red-500/20">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h2 className="text-xl font-bold text-white">Danger Zone</h2>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-white mb-1">Delete Account</div>
                            <div className="text-xs text-zinc-500">Permanently delete your account and all data</div>
                        </div>
                        <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium transition-colors">
                            Delete Account
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
