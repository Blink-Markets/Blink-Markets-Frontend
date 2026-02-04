import { Zap, Users, TrendingUp, Clock } from 'lucide-react';

interface StatsBarProps {
    activeBets: number;
    totalVolume: number;
    avgDuration: number;
}

export function StatsBar({ activeBets, totalVolume, avgDuration }: StatsBarProps) {
    const stats = [
        {
            icon: Zap,
            label: 'Live Bets',
            value: activeBets.toString(),
            color: 'text-flash-green',
        },
        {
            icon: TrendingUp,
            label: '24h Volume',
            value: `${(totalVolume / 1000).toFixed(1)}K SUI`,
            color: 'text-flash-blue',
        },
        {
            icon: Users,
            label: 'Active Users',
            value: '1.2K',
            color: 'text-flash-purple',
        },
        {
            icon: Clock,
            label: 'Avg Duration',
            value: `${avgDuration}s`,
            color: 'text-flash-orange',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
                >
                    <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                        <stat.icon size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                        <div className="text-lg font-bold">{stat.value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
