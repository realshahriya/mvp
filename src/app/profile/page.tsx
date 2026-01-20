export default function ProfilePage() {
    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-[#E6E6E6] mb-2 font-sans">Profile</h1>
                <p className="text-[#B0B0B0] text-sm">Manage your personal details and visibility settings</p>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Identity</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Display Name</label>
                            <input
                                type="text"
                                defaultValue="Cencera Analyst"
                                className="w-full px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Username</label>
                            <input
                                type="text"
                                defaultValue="analyst.cencera"
                                className="w-full px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Bio</label>
                        <textarea
                            rows={4}
                            defaultValue="Focused on wallet risk profiling, contract monitoring, and on-chain intelligence."
                            className="w-full px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Public Profile</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-[#E6E6E6] mb-1">Show activity summary</div>
                            <div className="text-xs text-[#B0B0B0]">Allow others to view your analysis volume</div>
                        </div>
                        <button className="relative w-12 h-6 rounded-full bg-neon transition-colors">
                            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full translate-x-6 transition-transform" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-[#E6E6E6] mb-1">Display verified badge</div>
                            <div className="text-xs text-[#B0B0B0]">Show your verification status</div>
                        </div>
                        <button className="relative w-12 h-6 rounded-full bg-[#2A2A2A] transition-colors">
                            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                    <h2 className="text-xl font-bold text-[#E6E6E6]">Security</h2>
                </div>
                <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-[#E6E6E6] mb-1">Sign-in alerts</div>
                            <div className="text-xs text-[#B0B0B0]">Get notified about new logins</div>
                        </div>
                        <button className="px-4 py-2 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 text-neon text-sm font-medium rounded-lg transition-all">
                            Configure
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-[#E6E6E6] mb-1">Active devices</div>
                            <div className="text-xs text-[#B0B0B0]">Review trusted devices</div>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#2A2A2A] rounded-lg text-[#E6E6E6] text-sm font-medium transition-colors">
                            View
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
