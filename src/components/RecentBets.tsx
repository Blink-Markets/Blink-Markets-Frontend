import { FlashBet, CATEGORIES } from '../types/bet';
import { cn } from '../lib/utils';
import { CheckCircle2, XCircle, Clock, TrendingUp, Sparkles } from 'lucide-react';

interface RecentBetsProps {
    bets: FlashBet[];
}

export function RecentBets({ bets }: RecentBetsProps) {
    if (bets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                        background: 'linear-gradient(135deg, rgba(77, 162, 255, 0.1), rgba(0, 212, 255, 0.08))',
                        border: '1px solid rgba(77, 162, 255, 0.2)'
                    }}
                >
                    <Clock className="text-[#4DA2FF]" size={28} />
                    <div
                        className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                        style={{ background: 'rgba(77, 162, 255, 0.3)' }}
                    />
                </div>
                <p className="font-semibold text-foreground-secondary mb-1">No results yet</p>
                <p className="text-sm text-foreground-tertiary">
                    Completed markets will appear here
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {bets.map((bet, index) => {
                const category = CATEGORIES.find(c => c.id === bet.category);
                const winnerOption = bet.winner === 'A' ? bet.optionA : bet.optionB;
                const loserOption = bet.winner === 'A' ? bet.optionB : bet.optionA;

                return (
                    <div
                        key={bet.id}
                        className={cn(
                            'relative p-4 rounded-xl overflow-hidden',
                            'transition-all duration-300',
                            index === 0 && 'animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)]'
                        )}
                        style={{
                            background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.8) 0%, rgba(15, 31, 56, 0.6) 100%)',
                            border: '1px solid rgba(77, 162, 255, 0.1)'
                        }}
                    >
                        {/* New badge for latest result */}
                        {index === 0 && (
                            <div
                                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                    background: 'linear-gradient(90deg, rgba(0, 229, 160, 0.15), rgba(0, 212, 255, 0.1))',
                                    color: '#00E5A0',
                                    border: '1px solid rgba(0, 229, 160, 0.3)'
                                }}
                            >
                                <Sparkles size={10} />
                                New
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                {bet.imageUrl && (
                                    <div className="relative flex-shrink-0">
                                        <div className="w-9 h-9 rounded-lg overflow-hidden ring-1 ring-[#4DA2FF]/20">
                                            <img src={bet.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="font-medium text-sm text-foreground truncate mb-0.5">
                                        {bet.title}
                                    </div>
                                    <span
                                        className="text-xs font-medium"
                                        style={{ color: '#6B7C95' }}
                                    >
                                        {category?.icon} {category?.label}
                                    </span>
                                </div>
                            </div>
                            {index !== 0 && (
                                <span className="text-xs text-foreground-tertiary whitespace-nowrap">
                                    Just now
                                </span>
                            )}
                        </div>

                        {/* Result */}
                        <div className="flex items-center gap-2">
                            {/* Winner */}
                            <div
                                className="flex-1 flex items-center gap-2 p-2.5 rounded-lg"
                                style={{
                                    background: 'rgba(0, 229, 160, 0.1)',
                                    border: '1px solid rgba(0, 229, 160, 0.25)'
                                }}
                            >
                                <CheckCircle2 size={14} className="text-[#00E5A0] flex-shrink-0" />
                                <span className="text-sm font-medium text-[#00E5A0] truncate">
                                    {winnerOption?.label}
                                </span>
                                <span className="ml-auto text-xs font-mono font-bold text-[#00E5A0]">
                                    {winnerOption?.odds.toFixed(2)}x
                                </span>
                            </div>

                            {/* Loser */}
                            <div
                                className="flex-1 flex items-center gap-2 p-2.5 rounded-lg opacity-60"
                                style={{
                                    background: 'rgba(255, 77, 106, 0.08)',
                                    border: '1px solid rgba(255, 77, 106, 0.15)'
                                }}
                            >
                                <XCircle size={14} className="text-[#FF4D6A] flex-shrink-0" />
                                <span className="text-sm text-[#FF4D6A] truncate">
                                    {loserOption?.label}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div
                            className="flex items-center justify-between mt-3 pt-3"
                            style={{ borderTop: '1px solid rgba(77, 162, 255, 0.08)' }}
                        >
                            <div className="flex items-center gap-1.5 text-xs text-foreground-tertiary">
                                <TrendingUp size={12} />
                                <span>{bet.totalPool.toLocaleString()} SUI pool</span>
                            </div>
                            <span className="text-xs text-foreground-tertiary">
                                {bet.participants} participants
                            </span>
                        </div>

                        {/* Subtle gradient overlay on hover */}
                        <div
                            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                            style={{
                                background: 'radial-gradient(circle at 50% 0%, rgba(77, 162, 255, 0.05), transparent 60%)'
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
