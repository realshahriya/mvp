"use client";
 
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { CheckCircle2, CircleHelp } from "lucide-react";
import { AppKitAccountButton } from "@reown/appkit/react";
import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";
 
const USER_DATA_CONTRACT = (
    process.env.NEXT_PUBLIC_CENCERA_USERDATA_CONTRACT_BSC_TESTNET ||
    "0x0905f23783dba6A844C31870Ef272dC2E6b99B4b"
).trim();

const USER_DATA_ABI = [
    {
        type: "function",
        name: "getUserData",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [
            { name: "isRegistered", type: "bool" },
            { name: "isVerified", type: "bool" },
            { name: "name", type: "string" },
            { name: "username", type: "string" },
            { name: "bio", type: "string" },
            { name: "joinedAt", type: "uint64" },
            { name: "lastActive", type: "uint64" },
        ],
    },
    {
        type: "function",
        name: "updateProfile",
        stateMutability: "nonpayable",
        inputs: [
            { name: "_name", type: "string" },
            { name: "_username", type: "string" },
            { name: "_bio", type: "string" },
        ],
        outputs: [],
    },
] as const;

const bscTestnetPublicClient = createPublicClient({ chain: bscTestnet, transport: http() });

function normalizeUsername(value: string) {
    return value.trim().toLowerCase();
}

function validateUsername(value: string) {
    const u = normalizeUsername(value);
    if (!u) return { ok: true, value: u, error: "" };
    if (u.length < 3) return { ok: false, value: u, error: "Username must be at least 3 characters" };
    if (u.length > 32) return { ok: false, value: u, error: "Username must be 32 characters or less" };
    if (!/^[a-z0-9._]+$/.test(u)) return { ok: false, value: u, error: "Only a-z, 0-9, . and _ allowed" };
    return { ok: true, value: u, error: "" };
}

export default function ProfilePage() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [displayName, setDisplayName] = useState("Cencera Analyst");
    const [username, setUsername] = useState("analyst.cencera");
    const [bio, setBio] = useState("Focused on wallet risk profiling, contract monitoring, and on-chain intelligence.");
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(displayName);
    const [draftUsername, setDraftUsername] = useState(username);
    const [draftBio, setDraftBio] = useState(bio);
    const [isVerified, setIsVerified] = useState(false);
    const [loadingOnchain, setLoadingOnchain] = useState(false);
    const [savingOnchain, setSavingOnchain] = useState(false);
    const [onchainError, setOnchainError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const bioWordLimit = 100;
    const bioWordCount = useMemo(() => {
        const trimmed = draftBio.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).filter((word) => word.length > 0).length;
    }, [draftBio]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isConnected) {
            router.push("/");
        }
    }, [mounted, isConnected, router]);

    useEffect(() => {
        const run = async () => {
            if (!isConnected || !address) return;
            if (!USER_DATA_CONTRACT) return;
            setLoadingOnchain(true);
            setOnchainError(null);
            try {
                const res = await bscTestnetPublicClient.readContract({
                    address: USER_DATA_CONTRACT as `0x${string}`,
                    abi: USER_DATA_ABI,
                    functionName: "getUserData",
                    args: [address],
                });
                const [isRegistered, verified, name, uname, about] = res;
                setIsVerified(Boolean(verified));
                if (isRegistered) {
                    if (name) setDisplayName(name);
                    if (uname) setUsername(uname);
                    if (about) setBio(about);
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                setOnchainError(msg);
            } finally {
                setLoadingOnchain(false);
            }
        };
        run();
    }, [isConnected, address]);

    const effectiveAddress = mounted ? address : undefined;
    const effectiveConnected = mounted && isConnected;

    const avatarUrl = useMemo(() => {
        const seed = effectiveAddress || "0x0000000000000000000000000000000000000000";
        return `https://api.dicebear.com/9.x/croodles-neutral/svg?seed=${encodeURIComponent(seed)}&size=120&radius=20&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`;
    }, [effectiveAddress]);

    const displayAddress = effectiveAddress ? `${effectiveAddress.slice(0, 6)}...${effectiveAddress.slice(-4)}` : "Not connected";
    const contractDisplay = USER_DATA_CONTRACT ? `${USER_DATA_CONTRACT.slice(0, 6)}...${USER_DATA_CONTRACT.slice(-4)}` : "Not configured";
    const canWrite = Boolean(mounted && USER_DATA_CONTRACT && walletClient && address);

    return (
        <div className="p-4 md:p-6 space-y-6 md:space-y-10 w-full mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#E6E6E6] font-sans">Profile</h1>
                <p className="text-[#B0B0B0] text-sm">Manage your personal details and visibility settings</p>
            </div>

            <section className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
                <div className="bg-[#121212]/80 border border-[#2A2A2A] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl border border-neon/30 bg-[#0E0E0E] overflow-hidden flex items-center justify-center">
                            <Image src={avatarUrl} alt="Profile avatar" width={70} height={70} className="w-full h-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="text-xl font-bold text-white">{displayName}</div>
                                <button
                                    type="button"
                                    aria-label={isVerified ? "Verified profile" : "Unverified profile"}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-[#2A2A2A] bg-[#111111]"
                                >
                                    {isVerified ? (
                                        <CheckCircle2 className="w-3 h-3 text-neon" />
                                    ) : (
                                        <CircleHelp className="w-3 h-3 text-[#B0B0B0]" />
                                    )}
                                </button>
                            </div>
                            <div className="text-xs text-[#8E8E8E]">@{username}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-[#6F6F6F]">Wallet</div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#2A2A2A] bg-[#0F0F0F]">
                            <span suppressHydrationWarning className="text-sm text-[#E6E6E6] font-mono">
                                {displayAddress}
                            </span>
                            <span className={`text-[10px] px-2 py-1 rounded-full ${effectiveConnected ? "bg-neon/20 text-neon" : "bg-white/10 text-[#B0B0B0]"}`}>
                                {effectiveConnected ? "Connected" : "Offline"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#2A2A2A] bg-[#0F0F0F]">
                            <span className="text-xs uppercase tracking-[0.2em] text-[#6F6F6F]">BNB Testnet Contract</span>
                            <span className="text-sm text-[#E6E6E6] font-mono">{contractDisplay}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#2A2A2A] bg-[#0F0F0F]">
                            <span className="text-xs uppercase tracking-[0.2em] text-[#6F6F6F]">Account</span>
                            {mounted ? <AppKitAccountButton balance="hide" /> : <span className="text-xs text-[#8E8E8E]">…</span>}
                        </div>
                        {loadingOnchain && (
                            <div className="text-xs text-[#8E8E8E]">Loading profile from BNB Testnet…</div>
                        )}
                        {onchainError && (
                            <div className="text-xs text-red-400">{onchainError}</div>
                        )}
                        {txHash && (
                            <a
                                href={`https://testnet.bscscan.com/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-neon underline underline-offset-4"
                            >
                                View last transaction
                            </a>
                        )}
                    </div>
                    <div className="rounded-xl border border-[#2A2A2A] bg-[#0F0F0F] p-4 space-y-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-[#6F6F6F]">Status</div>
                        <div className="text-sm text-[#CFCFCF]">{bio}</div>
                    </div>
                    <button
                        onClick={() => {
                            setDraftName(displayName);
                            setDraftUsername(username);
                            setDraftBio(bio);
                            setIsEditing(true);
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-neon/20 bg-neon/10 hover:bg-neon/20 text-neon text-sm font-medium transition-colors"
                    >
                        Edit Profile
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                            <h2 className="text-sm font-bold text-[#E6E6E6] uppercase tracking-[0.18em]">
                                Profile Details
                            </h2>
                            <span className="text-xs text-[#8E8E8E] font-mono">Public</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-xs text-[#8E8E8E] mb-1">Display name</div>
                                <div className="font-medium text-[#E6E6E6]">{displayName}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[#8E8E8E] mb-1">Username</div>
                                <div className="font-mono text-[#E6E6E6]">@{username}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[#8E8E8E] mb-1">Wallet</div>
                                <div className="font-mono text-[#E6E6E6]">{displayAddress}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-xs text-[#8E8E8E] mb-1">Trust sessions</div>
                                <div className="font-medium text-[#E6E6E6]">Active</div>
                            </div>
                            <div>
                                <div className="text-xs text-[#8E8E8E] mb-1">Messages</div>
                                <div className="font-medium text-[#E6E6E6]">DMs enabled</div>
                            </div>
                            <div>
                                <div className="text-xs text-[#8E8E8E] mb-1">Joined</div>
                                <div className="font-medium text-[#E6E6E6]">Alpha v0.1</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                            <h2 className="text-sm font-bold text-[#E6E6E6] uppercase tracking-[0.18em]">
                                Activity Summary
                            </h2>
                            <span className="text-xs text-[#8E8E8E]">Last 7 days</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-4 space-y-1">
                                <div className="text-xs text-[#8E8E8E]">Analyses run</div>
                                <div className="text-xl font-bold text-[#E6E6E6]">12</div>
                            </div>
                            <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-4 space-y-1">
                                <div className="text-xs text-[#8E8E8E]">Wallets reviewed</div>
                                <div className="text-xl font-bold text-[#E6E6E6]">8</div>
                            </div>
                            <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-4 space-y-1">
                                <div className="text-xs text-[#8E8E8E]">Contracts inspected</div>
                                <div className="text-xl font-bold text-[#E6E6E6]">5</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                        <h2 className="text-xl font-bold text-[#E6E6E6]">Public Profile</h2>
                    </div>
                    <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-[#E6E6E6] mb-1">Show activity summary</div>
                                <div className="text-xs text-[#B0B0B0]">Allow others to view your analysis volume</div>
                            </div>
                            <button className="relative w-12 h-6 rounded-full bg-neon transition-colors">
                                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full translate-x-6 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A]">
                        <h2 className="text-xl font-bold text-[#E6E6E6]">Security</h2>
                    </div>
                    <div className="bg-[#1A1A1A]/80 border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
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
                </div>
            </section>
            {isEditing && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-sm text-[#B0B0B0] hover:text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={draftName}
                                    onChange={(event) => setDraftName(event.target.value)}
                                    className="w-full px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Username</label>
                                <input
                                    type="text"
                                    value={draftUsername}
                                    onChange={(event) => setDraftUsername(normalizeUsername(event.target.value))}
                                    className="w-full px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#C7C7C7] mb-2">Bio</label>
                                <textarea
                                    rows={4}
                                    value={draftBio}
                                    onChange={(event) => setDraftBio(event.target.value)}
                                    className="w-full px-4 py-3 bg-[#161616] border border-[#2A2A2A] rounded-lg text-[#E6E6E6] focus:outline-none focus:border-neon/30 transition-colors"
                                />
                                <div className={`mt-1 text-xs ${bioWordCount > bioWordLimit ? "text-red-400" : "text-[#8E8E8E]"}`}>
                                    {bioWordCount} / {bioWordLimit} words
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 rounded-xl border border-[#2A2A2A] bg-white/5 hover:bg-white/10 text-[#E6E6E6] text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (bioWordCount > bioWordLimit) return;
                                    const nextName = draftName.trim();
                                    const usernameCheck = validateUsername(draftUsername);
                                    if (!usernameCheck.ok) {
                                        setOnchainError(usernameCheck.error);
                                        return;
                                    }
                                    const nextUsername = usernameCheck.value;
                                    const nextBio = draftBio.trim();
                                    setDisplayName(nextName || displayName);
                                    setUsername(nextUsername || username);
                                    setBio(nextBio || bio);

                                    if (!USER_DATA_CONTRACT) {
                                        setOnchainError("Missing NEXT_PUBLIC_CENCERA_USERDATA_CONTRACT_BSC_TESTNET");
                                        setIsEditing(false);
                                        return;
                                    }
                                    if (!walletClient) {
                                        setOnchainError("Wallet client not available");
                                        setIsEditing(false);
                                        return;
                                    }
                                    if (!address) {
                                        setOnchainError("Wallet address not available");
                                        setIsEditing(false);
                                        return;
                                    }
                                    const chainId = walletClient.chain?.id;
                                    if (chainId !== 97) {
                                        setOnchainError("Switch your wallet network to BNB Testnet (chainId 97)");
                                        setIsEditing(false);
                                        return;
                                    }

                                    setSavingOnchain(true);
                                    setOnchainError(null);
                                    try {
                                        const hash = await walletClient.writeContract({
                                            address: USER_DATA_CONTRACT as `0x${string}`,
                                            abi: USER_DATA_ABI,
                                            functionName: "updateProfile",
                                            args: [nextName, nextUsername, nextBio],
                                            account: address,
                                        });
                                        setTxHash(hash);
                                        await bscTestnetPublicClient.waitForTransactionReceipt({ hash });
                                    } catch (e: unknown) {
                                        const msg = e instanceof Error ? e.message : String(e);
                                        setOnchainError(msg);
                                    } finally {
                                        setSavingOnchain(false);
                                    }

                                    setIsEditing(false);
                                }}
                                className="px-4 py-2 rounded-xl border border-neon/20 bg-neon/10 hover:bg-neon/20 text-neon text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={bioWordCount > bioWordLimit || savingOnchain || !canWrite}
                            >
                                {savingOnchain ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
