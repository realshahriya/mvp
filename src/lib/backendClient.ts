const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface AgentStatus {
    agentId: string;
    owner: string;
    innovationScore: string;
    memoryHash: string;
    status: string;
    chain: string;
}

export const backendClient = {
    async getAgentStatus(id: string = "CENCERA_GLOBAL"): Promise<AgentStatus | null> {
        if (!BACKEND_URL) return null;

        try {
            const res = await fetch(`${BACKEND_URL}/agent/status?id=${id}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (error) {
            console.error("Failed to fetch agent status:", error);
            return null;
        }
    },

    async sendChat(message: string, agentId: string, walletAddress: string): Promise<string | null> {
        if (!BACKEND_URL) return null;

        try {
            const res = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, agentId, walletAddress })
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.reply;
        } catch (error) {
            console.error("Failed to send chat:", error);
            return null;
        }
    }
};
