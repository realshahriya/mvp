import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

interface RiskCardProps {
    type: "success" | "warning" | "danger" | "info";
    title: string;
    description: string;
}

export function RiskCard({ type, title, description }: RiskCardProps) {
    const styles = {
        success: { border: "border-green-500/20", bg: "bg-green-500/10", icon: CheckCircle, color: "text-green-500" },
        warning: { border: "border-yellow-500/20", bg: "bg-yellow-500/10", icon: AlertTriangle, color: "text-yellow-500" },
        danger: { border: "border-red-500/20", bg: "bg-red-500/10", icon: XCircle, color: "text-red-500" },
        info: { border: "border-blue-500/20", bg: "bg-blue-500/10", icon: Info, color: "text-blue-500" },
    };

    const config = styles[type];
    const Icon = config.icon;

    return (
        <div className={`p-4 rounded-xl border ${config.border} ${config.bg} flex items-start gap-4 transition-all hover:bg-opacity-20`}>
            <div className={`mt-0.5 p-1`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
                <h4 className={`text-sm font-bold ${config.color} uppercase tracking-wide font-sans mb-1`}>
                    {title}
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                    {description}
                </p>
            </div>
        </div>
    );
}
