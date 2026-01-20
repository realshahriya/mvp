"use client";

import { Key, Bell, Shield, CreditCard, Database, Moon, Globe, Mail, Lock, Eye, EyeOff, Copy, Trash2, Plus, Wallet, AlertTriangle } from "lucide-react";
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
                    <h1 className="text-2xl font-bold text-[#E6E6E6] font-sans">Connect Wallet</h1>
                    <p className="text-[#B0B0B0] text-sm">
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
            <div className="bg-neon/10 border border-neon/20 text-neon px-4 py-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Notice: Mock data is currently being used for demonstration purposes.</span>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#E6E6E6] mb-2 font-sans">Settings</h1>
                <p className="text-[#B0B0B0] text-sm">Manage your account and preferences</p>
            </div>


            {/* API Keys - Purple Accent */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <Key className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-[#E6E6E6]">API Keys</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-[#E6E6E6] mb-1">Production API Key</h3>
                            <p className="text-xs text-[#B0B0B0]">Use this key in your production environment</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#2A2A2A] rounded-lg text-[#E6E6E6] text-sm font-medium transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Key
                        </button>
                    </div>
                    <div className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1">
                                <code className="text-sm text-[#C7C7C7] font-mono">
                                    {showApiKey ? "cen_prod_1a2b3c4d5e6f7g8h9i0j" : "cen_prod_••••••••••••••••"}
                                </code>
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="text-[#B0B0B0] hover:text-[#E6E6E6] transition-colors"
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-white/5 rounded-lg text-[#B0B0B0] hover:text-[#E6E6E6] transition-colors">
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-white/5 rounded-lg text-[#B0B0B0] hover:text-neon transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#B0B0B0]">
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
                                <p className="text-[#B0B0B0] text-xs">Never share your API keys or commit them to version control. Rotate keys regularly for security.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notifications - Orange Accent */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <Bell className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Notifications</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 space-y-4">
                    {[
                        { key: "email", label: "Email Notifications", description: "Receive email alerts for important events" },
                        { key: "threats", label: "Threat Alerts", description: "Get notified when threats are detected" },
                        { key: "reports", label: "Weekly Reports", description: "Summary of your API usage and activity" },
                        { key: "updates", label: "Product Updates", description: "News about new features and improvements" },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-[#B0B0B0]" />
                                <div>
                                    <div className="text-sm font-medium text-[#E6E6E6] mb-1">{item.label}</div>
                                    <div className="text-xs text-[#B0B0B0]">{item.description}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-neon' : 'bg-[#2A2A2A]'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Security - Green Accent */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <Lock className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Security</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 space-y-4">
                    <div className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-[#E6E6E6] mb-1">Change Password</div>
                                <div className="text-xs text-[#B0B0B0]">Update your account password</div>
                            </div>
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#2A2A2A] rounded-lg text-[#E6E6E6] text-sm font-medium transition-colors">
                                Update
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-[#E6E6E6] mb-1">Two-Factor Authentication</div>
                                <div className="text-xs text-[#B0B0B0]">Add an extra layer of security</div>
                            </div>
                            <button className="px-4 py-2 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 text-neon text-sm font-medium rounded-lg transition-all">
                                Enable
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-[#E6E6E6] mb-1">Active Sessions</div>
                                <div className="text-xs text-[#B0B0B0]">Manage your logged-in devices</div>
                            </div>
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#2A2A2A] rounded-lg text-[#E6E6E6] text-sm font-medium transition-colors">
                                View
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Preferences - Cyan Primary */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <Globe className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Preferences</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Theme</label>
                        <select className="w-full md:w-64 px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors">
                            <option value="dark">Dark (Default)</option>
                            <option value="light">Light</option>
                            <option value="auto">System Default</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Default Chain</label>
                        <select className="w-full md:w-64 px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors">
                            <option value="ethereum">Ethereum Mainnet</option>
                            <option value="polygon">Polygon</option>
                            <option value="arbitrum">Arbitrum</option>
                            <option value="optimism">Optimism</option>
                            <option value="base">Base</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Language</label>
                        <select className="w-full md:w-64 px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors">
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
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <CreditCard className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Billing</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#E6E6E6] mb-1">Current Plan: Professional</h3>
                            <p className="text-sm text-[#B0B0B0]">$99/month • 10M requests included</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#2A2A2A] rounded-lg text-[#E6E6E6] text-sm font-medium transition-colors">
                            Upgrade Plan
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                            <div className="text-xs text-[#B0B0B0] mb-1">API Usage</div>
                            <div className="text-xl font-bold text-[#E6E6E6]">4.2M / 10M</div>
                            <div className="mt-2 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                                <div className="h-full bg-neon" style={{ width: '42%' }} />
                            </div>
                        </div>
                        <div className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                            <div className="text-xs text-[#B0B0B0] mb-1">Next Billing</div>
                            <div className="text-xl font-bold text-[#E6E6E6]">Feb 15, 2026</div>
                        </div>
                        <div className="p-4 bg-[#161616] rounded-lg border border-[#2A2A2A]">
                            <div className="text-xs text-[#B0B0B0] mb-1">Total Spent</div>
                            <div className="text-xl font-bold text-[#E6E6E6]">$297</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <Shield className="w-5 h-5 text-neon" />
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Danger Zone</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-[#E6E6E6] mb-1">Delete Account</div>
                            <div className="text-xs text-[#B0B0B0]">Permanently delete your account and all data</div>
                        </div>
                        <button className="px-4 py-2 bg-neon/10 hover:bg-neon/20 border border-neon/30 rounded-lg text-neon text-sm font-medium transition-colors">
                            Delete Account
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
