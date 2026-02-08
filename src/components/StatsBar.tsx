import { Users, TrendingUp, Timer, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

interface StatsBarProps {
    activeBets: number;
    totalVolume: number;
    totalParticipants: number;
}

export function StatsBar({ activeBets, totalVolume, totalParticipants }: StatsBarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const stats = [
        {
            icon: Activity,
            label: 'Live Markets',
            value: activeBets.toString(),
            subValue: 'active now',
            gradient: 'from-[#00E5A0] to-[#00F5B8]',
            iconColor: 'text-[#00E5A0]',
            glowColor: 'rgba(0, 229, 160, 0.3)',
            borderColor: 'border-[#00E5A0]/20',
        },
        {
            icon: TrendingUp,
            label: 'Total Volume',
            value: `${(totalVolume / 1000).toFixed(1)}K`,
            subValue: 'SUI traded',
            gradient: 'from-[#4DA2FF] to-[#00D4FF]',
            iconColor: 'text-[#4DA2FF]',
            glowColor: 'rgba(77, 162, 255, 0.3)',
            borderColor: 'border-[#4DA2FF]/20',
        },
        {
            icon: Users,
            label: 'Active Users',
            value: totalParticipants > 0 ? totalParticipants.toLocaleString() : '1.2K',
            subValue: 'last 24h',
            gradient: 'from-[#00D4FF] to-[#00E5A0]',
            iconColor: 'text-[#00D4FF]',
            glowColor: 'rgba(0, 212, 255, 0.3)',
            borderColor: 'border-[#00D4FF]/20',
        },
        {
            icon: Timer,
            label: 'Avg Duration',
            value: '12s',
            subValue: 'per market',
            gradient: 'from-[#FFB84D] to-[#FFC870]',
            iconColor: 'text-[#FFB84D]',
            glowColor: 'rgba(255, 184, 77, 0.3)',
            borderColor: 'border-[#FFB84D]/20',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={stat.label}
                    className={cn(
                        'stat-card relative overflow-hidden',
                        'flex items-center gap-4 p-5 rounded-2xl',
                        'transition-all duration-500 ease-out',
                        'hover:scale-[1.02] hover:shadow-lg',
                        stat.borderColor,
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    )}
                    style={{
                        transitionDelay: `${index * 75}ms`,
                        background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.9) 0%, rgba(15, 31, 56, 0.7) 100%)',
                    }}
                >
                    {/* Animated top border gradient */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${stat.glowColor}, transparent)`,
                        }}
                    />

                    {/* Icon with glow */}
                    <div className="relative">
                        <div
                            className="absolute inset-0 blur-xl opacity-50 rounded-xl"
                            style={{ background: stat.glowColor }}
                        />
                        <div className={cn(
                            'relative flex-shrink-0 w-12 h-12 rounded-xl',
                            'flex items-center justify-center',
                            'bg-gradient-to-br',
                            stat.gradient
                        )}>
                            <stat.icon size={22} className="text-white" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <div className="text-xs text-foreground-tertiary font-medium uppercase tracking-wider mb-1">
                            {stat.label}
                        </div>
                        <div
                            className="text-2xl font-bold text-foreground leading-none mb-1 font-display"
                            style={{
                                background: `linear-gradient(90deg, #FFFFFF 0%, ${stat.glowColor.replace('0.3', '1')} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {stat.value}
                        </div>
                        <div className="text-xs text-foreground-tertiary">{stat.subValue}</div>
                    </div>

                    {/* Decorative glow in corner */}
                    <div
                        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                        style={{ background: stat.glowColor }}
                    />

                    {/* Subtle moving shimmer */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)',
                            backgroundSize: '300% 300%',
                            animation: 'shimmer 3s ease-in-out infinite',
                        }}
                    />
                </div>
            ))}
        </div>
    );
}
