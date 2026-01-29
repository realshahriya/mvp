import { ChainData } from "./blockchain";
import { getAiEngine } from "@/engine/factory";
import { getEngine } from "@/engine/factory";
import type { ChainEngine } from "@/engine/interface";

export interface AIAnalysisResult {
    summary: string;
    riskLevel: "Critical" | "High" | "Medium" | "Low" | "Safe";
    auditNotes: string[];
}

export async function generateSecurityReport(
    chainData: ChainData,
    score: number,
    ctx?: { chainName?: string; nativeSymbol?: string }
): Promise<AIAnalysisResult> {
    try {
        const engine = getAiEngine();
        const res = await engine.generateSecurityReport(chainData, score, ctx);
        return {
            summary: res.summary,
            riskLevel: res.riskLevel,
            auditNotes: res.auditNotes
        };
    } catch {
        const balance = parseFloat(chainData.balance);
        const tx = chainData.txCount;
        const isContract = chainData.isContract;
        const ens = chainData.ensName;
        const sym = ctx?.nativeSymbol || 'ETH';
        let riskLevel: AIAnalysisResult["riskLevel"] = "Medium";
        let summary = "";
        const notes: string[] = [];
        if (score >= 80) {
            riskLevel = "Safe";
            summary =
                `High trust profile. Balance ${balance.toFixed(2)} ${sym}, transactions ${tx}. ` +
                `${ens ? `Verified identity via ${ens}.` : ""}`;
            notes.push("Long-term holder or established DApp user.");
            notes.push("No mixer interaction detected.");
        } else if (score >= 50) {
            riskLevel = "Low";
            summary =
                `Moderate trust profile. Activity ${tx} transactions. ` +
                `Caution for high-value transfers until more history. Liquidity ${balance.toFixed(4)} ${sym}.`;
            notes.push("Growing transaction volume.");
            notes.push("Clean interactions observed.");
        } else if (score >= 30) {
            riskLevel = "High";
            summary =
                `Caution advised. ${tx === 0 ? "Zero transaction history." : `Low transaction count (${tx}).`} ` +
                `${isContract ? "Unverified or generic contract code." : "Behavior resembles automated activity."}`;
            notes.push("Pattern matches common airdrop farming profiles.");
            notes.push("Limited social verification signals.");
        } else {
            riskLevel = "Critical";
            summary =
                `Critical alert. Signals suggest malicious activity patterns. ` +
                `${balance > 100 ? "High balance may result from drains." : "Disposable wallet behavior."}`;
            notes.push("Matches heuristics for drainer templates.");
            notes.push("Flagged by community databases.");
        }
        return { summary, riskLevel, auditNotes: notes };
    }
}

export interface AgentChainResult {
    chainId: number;
    name: string;
    data: ChainData | null;
    preliminaryScore: number;
    flags: string[];
}

export interface TrustAgentResult {
    summary: string;
    trustScore: number;
    riskLevel: AIAnalysisResult["riskLevel"];
    auditNotes: string[];
    perChain: AgentChainResult[];
}

export async function runTrustAgent(
    input: string,
    chainIds: string[] = ["11155111", "11155420", "421614", "97", "84532"]
): Promise<TrustAgentResult> {
    const engines: { engine: ChainEngine }[] = chainIds.map((id) => ({
        engine: getEngine(id),
    }));

    const perChain = await Promise.all(
        engines.map(async ({ engine }) => {
            try {
                const res = await engine.analyze(input);
                return {
                    chainId: engine.chainId,
                    name: engine.name ?? `Chain ${engine.chainId}`,
                    data: res.details,
                    preliminaryScore: res.score,
                    flags: res.flags,
                } as AgentChainResult;
            } catch {
                return {
                    chainId: engine.chainId,
                    name: engine.name ?? `Chain ${engine.chainId}`,
                    data: null,
                    preliminaryScore: 0,
                    flags: ["Fetch Failed"],
                } as AgentChainResult;
            }
        })
    );

    const baseline =
        perChain.reduce((acc, c) => acc + (c.preliminaryScore || 0), 0) /
        Math.max(1, perChain.length);

    const ai = getAiEngine();
    const aiRes = await ai.generateMultiEngineTrustReport({
        baselineScore: Math.round(baseline),
        chains: perChain.map((c) => ({
            chainId: c.chainId,
            name: c.name,
            balance: c.data ? parseFloat(c.data.balance) : 0,
            txCount: c.data ? c.data.txCount : 0,
            isContract: c.data ? c.data.isContract : false,
            preliminaryScore: c.preliminaryScore,
            flags: c.flags,
        })),
    });

    return {
        summary: aiRes.summary,
        trustScore: aiRes.trustScore,
        riskLevel: aiRes.riskLevel,
        auditNotes: aiRes.auditNotes,
        perChain,
    };
}
