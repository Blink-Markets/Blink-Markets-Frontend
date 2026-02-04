import { FlashBet, CATEGORY_ICONS } from '../types/bet';
import { cn } from '../lib/utils';
import { CheckCircle2, Clock } from 'lucide-react';

interface RecentBetsProps {
    bets: FlashBet[];
}

export function RecentBets({ bets }: RecentBetsProps) {
    if (bets.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto mb-2 opacity-50" size={32} />
                <p>No recent bets yet</p>
                <p className="text-sm">Completed flash bets will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {bets.map((bet) => (
                <div
                    key={bet.id}
                    className={cn(
                        'flex items-center justify-between p-4 rounded-xl',
                        'bg-card/50 border border-border/50',
                        'animate-[slide-up_0.3s_ease-out]'
                    )}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{CATEGORY_ICONS[bet.category]}</span>
                        <div>
                            <div className="font-medium text-sm">{bet.title}</div>
                            <div className="text-xs text-muted-foreground">
                                {bet.optionA.label} vs {bet.optionB.label}
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div
                            className={cn(
                                'flex items-center gap-1 text-sm font-bold',
                                bet.winner === 'A' ? 'text-flash-green' : 'text-flash-orange'
                            )}
                        >
                            <CheckCircle2 size={14} />
                            {bet.winner === 'A' ? bet.optionA.label : bet.optionB.label}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                            {bet.totalPool.toLocaleString()} SUI pool
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
