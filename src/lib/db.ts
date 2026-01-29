import mongoose, { Schema } from "mongoose";

type GlobalMongooseCache = {
    __cenceraMongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const globalCache = globalThis as typeof globalThis & GlobalMongooseCache;
const cached = globalCache.__cenceraMongoose || (globalCache.__cenceraMongoose = { conn: null, promise: null });

export async function dbConnect() {
    if (cached.conn) return cached.conn;
    const uri = (process.env.DB_CONNECTION || process.env.MONGODB_URI || "").trim();
    if (!uri) {
        throw new Error("DB_CONNECTION or MONGODB_URI is not configured");
    }
    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, { bufferCommands: false }).then((m) => m);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export type ApiKeyRecordDb = {
    walletAddress: string;
    keyId: string;
    name: string;
    key: string;
    createdAt: Date;
    lastUsedAt: Date | null;
};

const ApiKeySchema = new Schema<ApiKeyRecordDb>(
    {
        walletAddress: { type: String, required: true, lowercase: true, index: true },
        keyId: { type: String, required: true },
        name: { type: String, required: true },
        key: { type: String, required: true },
        createdAt: { type: Date, required: true },
        lastUsedAt: { type: Date, default: null },
    },
    { collection: "api_keys" }
);

ApiKeySchema.index({ walletAddress: 1, keyId: 1 }, { unique: true });

export const ApiKeyModel =
    (mongoose.models.ApiKey as mongoose.Model<ApiKeyRecordDb>) ||
    mongoose.model<ApiKeyRecordDb>("ApiKey", ApiKeySchema);

export type FeedbackReportDb = {
    type: string;
    severity: string;
    content: string;
    address?: string;
    chain?: string;
    createdAt: Date;
};

const FeedbackReportSchema = new Schema<FeedbackReportDb>(
    {
        type: { type: String, required: true },
        severity: { type: String, required: true },
        content: { type: String, required: true },
        address: { type: String },
        chain: { type: String },
        createdAt: { type: Date, required: true },
    },
    { collection: "feedback_reports" }
);

export const FeedbackReportModel =
    (mongoose.models.FeedbackReport as mongoose.Model<FeedbackReportDb>) ||
    mongoose.model<FeedbackReportDb>("FeedbackReport", FeedbackReportSchema);

export type AnalysisReportDb = {
    reason: string;
    details: string;
    address?: string;
    chain?: string;
    createdAt: Date;
};

const AnalysisReportSchema = new Schema<AnalysisReportDb>(
    {
        reason: { type: String, required: true },
        details: { type: String, required: true },
        address: { type: String },
        chain: { type: String },
        createdAt: { type: Date, required: true },
    },
    { collection: "analysis_reports" }
);

export const AnalysisReportModel =
    (mongoose.models.AnalysisReport as mongoose.Model<AnalysisReportDb>) ||
    mongoose.model<AnalysisReportDb>("AnalysisReport", AnalysisReportSchema);

export type ScanResultDb = {
    address: string;
    chain: string;
    score: number;
    riskLevel: string;
    scannedBy?: string; // Wallet address of the user who initiated the scan
    createdAt: Date;
    summary?: string;
};

const ScanResultSchema = new Schema<ScanResultDb>(
    {
        address: { type: String, required: true, lowercase: true, index: true },
        chain: { type: String, required: true },
        score: { type: Number, required: true },
        riskLevel: { type: String, required: true },
        scannedBy: { type: String, lowercase: true, index: true },
        createdAt: { type: Date, required: true, default: Date.now },
        summary: { type: String },
    },
    { collection: "scan_results" }
);

export const ScanResultModel =
    (mongoose.models.ScanResult as mongoose.Model<ScanResultDb>) ||
    mongoose.model<ScanResultDb>("ScanResult", ScanResultSchema);

export type CreditDb = {
    walletAddress: string;
    balance: number;
    plan: 'free' | 'basic' | 'pro';
    billingCycleStart: Date;
    billingPeriod: 'monthly' | 'annual';
    planExpiresAt?: Date | null;
    updatedAt: Date;
};

const CreditSchema = new Schema<CreditDb>(
    {
        walletAddress: { type: String, required: true, lowercase: true, unique: true },
        balance: { type: Number, required: true, default: 0, min: 0 },
        plan: { type: String, required: true, default: 'free', enum: ['free', 'basic', 'pro'] },
        billingCycleStart: { type: Date, required: true, default: Date.now },
        billingPeriod: { type: String, required: true, default: 'monthly', enum: ['monthly', 'annual'] },
        planExpiresAt: { type: Date, default: null },
        updatedAt: { type: Date, default: Date.now },
    },
    { collection: "user_credits" }
);

export const CreditModel =
    (mongoose.models.Credit as mongoose.Model<CreditDb>) ||
    mongoose.model<CreditDb>("Credit", CreditSchema);

export type CreditTransactionDb = {
    walletAddress: string;
    amount: number;
    type: 'usage' | 'purchase' | 'bonus' | 'refund' | 'plan_reset' | 'plan_change';
    description?: string;
    createdAt: Date;
    metadata?: Record<string, unknown>;
};

const CreditTransactionSchema = new Schema<CreditTransactionDb>(
    {
        walletAddress: { type: String, required: true, lowercase: true, index: true },
        amount: { type: Number, required: true },
        type: { type: String, required: true, enum: ['usage', 'purchase', 'bonus', 'refund', 'plan_reset', 'plan_change'] },
        description: { type: String },
        createdAt: { type: Date, required: true, default: Date.now },
        metadata: { type: Schema.Types.Mixed },
    },
    { collection: "credit_transactions" }
);

export const CreditTransactionModel =
    (mongoose.models.CreditTransaction as mongoose.Model<CreditTransactionDb>) ||
    mongoose.model<CreditTransactionDb>("CreditTransaction", CreditTransactionSchema);
