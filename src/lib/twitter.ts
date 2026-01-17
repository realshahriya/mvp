export interface TwitterHypeData {
    score: number; // 0-100
    mentions: number;
    trending: boolean;
}

/**
 * Twitter API Service
 * 
 * In production:
 * 1. Fetch `https://api.twitter.com/2/tweets/counts/recent?query=${entity}`
 * 2. Calculate velocity based on 24h volume.
 */
export async function checkHype(query: string, score: number): Promise<TwitterHypeData> {

    // Check for Environment Variable
    // const token = process.env.TWITTER_BEARER_TOKEN;
    const token = null; // Forced simulation for demo

    if (token) {
        // Real API Call would go here
        return { score: 0, mentions: 0, trending: false };
    }

    // --- FALLBACK SIMULATION ---
    // We correlate "Hype" with the "Trust Score" and random volatility for the demo.

    // Base mentions on score (Better score = more people talking usually, or huge scam = lots of talking)
    let baseMentions = 0;

    if (score > 80) baseMentions = Math.floor(Math.random() * 500) + 200; // 200-700
    else if (score < 30) baseMentions = Math.floor(Math.random() * 2000) + 500; // Infamous/Scam viral
    else baseMentions = Math.floor(Math.random() * 50); // Unknown

    // Hype Score calculation
    const hypeScore = Math.min(100, Math.floor(baseMentions / 10));

    return {
        score: hypeScore,
        mentions: baseMentions,
        trending: hypeScore > 70
    };
}
