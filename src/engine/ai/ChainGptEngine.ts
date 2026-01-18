import { ChainData } from '@/lib/blockchain';
import type { AggregatedSearchData } from '@/lib/searchProcessor';
import { buildChaingptTrustPrompt, parseOrFallbackChaingptTrustResponse } from '@/lib/chaingptTrust';
import fs from 'node:fs';
import path from 'node:path';

type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Safe';

export class ChainGptEngine {
  private apiKey: string;
  private instructions: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    const p =
      process.env.CHAINGPT_INSTRUCTIONS_PATH ||
      path.join(process.cwd(), 'src', 'engine', 'ai', 'chaingpt_instructions.txt');
    let text = '';
    try {
      text = fs.readFileSync(p, 'utf-8');
    } catch {
      text = '';
    }
    this.instructions = text;
  }

  private extractJson(raw: string): Record<string, unknown> | null {
    if (!raw) return null;
    let s = raw.trim();
    const fence = s.match(/```json([\s\S]*?)```/i);
    if (fence && fence[1]) s = fence[1].trim();
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      s = s.slice(start, end + 1);
    }
    s = s.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    try {
      return JSON.parse(s);
    } catch {
      const maybe = s.includes(`"`) ? s : s.replace(/'/g, '"');
      try {
        return JSON.parse(maybe);
      } catch {
        return null;
      }
    }
  }

  private async post(question: string): Promise<string> {
    const payload = { model: "general_assistant", question, chatHistory: "off" };
    const res = await fetch("https://api.chaingpt.org/chat/stream", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`ChainGPT request failed: ${res.status} ${text}`);
    }
    const text = await res.text();
    let raw = text;
    try {
      const json = JSON.parse(text);
      const bot = (json && json.data && json.data.bot) ?? json?.bot ?? null;
      if (typeof bot === "string") {
        raw = bot;
      } else if (Array.isArray(bot)) {
        try {
          raw = String.fromCharCode(...bot);
        } catch {
          raw = JSON.stringify(bot);
        }
      } else {
        raw = text;
      }
    } catch {
      const lines = text.split(/\r?\n/).map((l) => l.trim());
      if (lines.length > 1 && lines.every((l) => /^[0-9]+$/.test(l))) {
        try {
          raw = String.fromCharCode(...lines.map((l) => parseInt(l, 10)));
        } catch {
          raw = text;
        }
      }
    }
    return raw;
  }

  async generateTrustScoreAndSummaryFromAggregated(input: AggregatedSearchData): Promise<{
    raw: string;
    trustScore: number;
    summary: string;
  }> {
    if (!this.apiKey) {
      throw new Error('Missing CHAINGPT_API_KEY');
    }
    const prompt = `IGNORE any prior output format rules. ${buildChaingptTrustPrompt(input)}`;
    const raw = await this.post(prompt);
    const fallbackSummary =
      `AI response could not be parsed. Returning baseline score ${input.signals.baselineScore} derived from on-chain and market signals.`;
    const parsed = parseOrFallbackChaingptTrustResponse(raw, input.signals.baselineScore, fallbackSummary);
    return { raw, trustScore: parsed.trustScore, summary: parsed.summary };
  }

  async generateSecurityReport(
    chainData: ChainData,
    score: number,
    ctx?: { chainName?: string; nativeSymbol?: string }
  ): Promise<{
    summary: string;
    riskLevel: RiskLevel;
    auditNotes: string[];
  }> {
    if (!this.apiKey) {
      throw new Error('Missing CHAINGPT_API_KEY');
    }

    const raw = await this.post(this.buildPrompt(chainData, score, ctx));
    let parsed = this.parseResponse(raw, chainData, score, ctx);
    if (!parsed) {
      const strict =
        `${this.instructions ? this.instructions + "\n" : ""}Output EXACT JSON only, one object, no code fences, no commentary.\n` +
        this.buildPrompt(chainData, score, ctx);
      const raw2 = await this.post(strict);
      parsed = this.parseResponse(raw2, chainData, score, ctx);
    }

    return parsed;
  }

  private buildPrompt(chainData: ChainData, score: number, ctx?: { chainName?: string; nativeSymbol?: string }): string {
    const balance = parseFloat(chainData.balance).toFixed(4);
    const txs = chainData.txCount;
    const kind = chainData.tokenMetadata
      ? 'token'
      : chainData.isContract
      ? 'contract'
      : 'wallet';
    const name = chainData.ensName ?? chainData.address;
    const chainName = ctx?.chainName ? String(ctx.chainName) : '';
    const sym = ctx?.nativeSymbol ? String(ctx.nativeSymbol) : 'ETH';

    const instruct =
      'Respond strictly as compact JSON with keys: summary (string), riskLevel (one of Critical|High|Medium|Low|Safe), auditNotes (array of strings). No markdown, no extra text.';

    const context =
      `Analyze ${kind} ${name}${chainName ? ` on ${chainName}` : ''}. Balance ${balance} ${sym}, txCount ${txs}, isContract ${chainData.isContract}. ` +
      (chainData.tokenMetadata
        ? `Token ${chainData.tokenMetadata.name} (${chainData.tokenMetadata.symbol}), decimals ${chainData.tokenMetadata.decimals}. `
        : '') +
      `Preliminary trust score ${score}.`;

    return `${this.instructions ? this.instructions + '\n' : ''}${instruct}\n${context}`;
  }

  private parseResponse(
    raw: string,
    chainData: ChainData,
    score: number,
    ctx?: { chainName?: string; nativeSymbol?: string }
  ): { summary: string; riskLevel: RiskLevel; auditNotes: string[] } {
    const obj = this.extractJson(raw);
    if (obj) {
      const risk = this.normalizeRisk(obj.riskLevel);
      const notes = Array.isArray(obj.auditNotes) ? obj.auditNotes : [];
      const summary = typeof obj.summary === "string" ? obj.summary : "";
      if (summary && risk) {
        return { summary, riskLevel: risk, auditNotes: notes };
      }
    }

    const fallbackRisk = this.scoreToRisk(score);
    const balance = parseFloat(chainData.balance);
    const sym = ctx?.nativeSymbol ? String(ctx.nativeSymbol) : 'ETH';
    const summary =
      `AI analysis failed to return JSON. Using fallback classification. ` +
      `Entity holds ${balance.toFixed(4)} ${sym} with ${chainData.txCount} transactions.`;
    return { summary, riskLevel: fallbackRisk, auditNotes: [] };
  }

  private normalizeRisk(r: unknown): RiskLevel {
    const s = String(r || '').toLowerCase();
    if (s.includes('critical')) return 'Critical';
    if (s.includes('high')) return 'High';
    if (s.includes('medium')) return 'Medium';
    if (s.includes('low')) return 'Low';
    if (s.includes('safe')) return 'Safe';
    return 'Medium';
  }

  private scoreToRisk(score: number): RiskLevel {
    if (score >= 80) return 'Safe';
    if (score >= 60) return 'Low';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'High';
    return 'Critical';
  }

  async generateMultiEngineTrustReport(input: {
    baselineScore: number;
    chains: Array<{
      chainId: number;
      name: string;
      balance: number;
      txCount: number;
      isContract: boolean;
      preliminaryScore: number;
      flags: string[];
    }>;
  }): Promise<{ summary: string; trustScore: number; riskLevel: RiskLevel; auditNotes: string[] }> {
    if (!this.apiKey) {
      throw new Error('Missing CHAINGPT_API_KEY');
    }

    const instruct =
      'Respond strictly as compact JSON: { "summary": string, "trustScore": number (0-100), "riskLevel": "Critical|High|Medium|Low|Safe", "auditNotes": string[] }. No markdown.';

    const lines = input.chains.map(
      (c) =>
        `Chain ${c.name} (#${c.chainId}): bal ${c.balance.toFixed(6)}, tx ${c.txCount}, isContract ${c.isContract}, prelim ${c.preliminaryScore}, flags [${c.flags.join(
          ', '
        )}]`
    );

    const prompt =
      `${this.instructions ? this.instructions + '\n' : ''}${instruct}\nAggregate cross-chain entity analysis.\nBaseline score: ${input.baselineScore}.\n` +
      lines.join('\n') +
      `\nReturn a unified trustScore with rationale reflecting cross-chain behavior consistency and risk.`;

    const raw = await this.post(prompt);

    try {
      const obj = JSON.parse(raw);
      const risk = this.normalizeRisk(obj.riskLevel);
      const notes = Array.isArray(obj.auditNotes) ? obj.auditNotes : [];
      const summary = typeof obj.summary === 'string' ? obj.summary : '';
      const ts =
        typeof obj.trustScore === 'number'
          ? Math.min(100, Math.max(0, Math.round(obj.trustScore)))
          : undefined;
      if (summary && risk && typeof ts === 'number') {
        return { summary, trustScore: ts, riskLevel: risk, auditNotes: notes };
      }
    } catch {}

    const salvage = this.extractJson(raw);
    if (salvage) {
      const risk = this.normalizeRisk(salvage.riskLevel);
      const notes = Array.isArray(salvage.auditNotes) ? salvage.auditNotes : [];
      const summary = typeof salvage.summary === 'string' ? salvage.summary : '';
      const ts =
        typeof salvage.trustScore === 'number'
          ? Math.min(100, Math.max(0, Math.round(salvage.trustScore)))
          : undefined;
      if (summary && risk && typeof ts === 'number') {
        return { summary, trustScore: ts, riskLevel: risk, auditNotes: notes };
      }
    }

    const raw2 = await this.post(`${this.instructions ? this.instructions + "\n" : ""}Output EXACT JSON only, one object, no code fences, no commentary.\n${prompt}`);
    const salvage2 = this.extractJson(raw2);
    if (salvage2) {
      const risk = this.normalizeRisk(salvage2.riskLevel);
      const notes = Array.isArray(salvage2.auditNotes) ? salvage2.auditNotes : [];
      const summary = typeof salvage2.summary === 'string' ? salvage2.summary : '';
      const ts =
        typeof salvage2.trustScore === 'number'
          ? Math.min(100, Math.max(0, Math.round(salvage2.trustScore)))
          : undefined;
      if (summary && risk && typeof ts === 'number') {
        return { summary, trustScore: ts, riskLevel: risk, auditNotes: notes };
      }
    }

    const fallbackRisk = this.scoreToRisk(input.baselineScore);
    return {
      summary:
        'AI aggregation failed to parse JSON. Returning baseline score derived from cross-chain prelim metrics.',
      trustScore: input.baselineScore,
      riskLevel: fallbackRisk,
      auditNotes: [],
    };
  }
}
