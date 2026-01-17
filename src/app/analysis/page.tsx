import { Suspense } from 'react';
import AnalysisView from '@/components/AnalysisView';

export default function AnalysisPage() {
    return (
        <div className="p-6 relative z-10 overflow-y-auto flex-1 h-full">
            <div className="max-w-7xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Trust Analysis Engine</h1>
                    <p className="text-zinc-400">Deep dive into on-chain data and reputation signals.</p>
                </div>

                <Suspense fallback={<div className="text-center pt-20 text-zinc-500">Initializing Analysis Engine...</div>}>
                    <AnalysisView />
                </Suspense>
            </div>
        </div>
    );
}
