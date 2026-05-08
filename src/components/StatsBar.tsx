import { Users, TrendingUp, Timer, Activity } from "lucide-react";
import { cn } from "../lib/utils";
import { useEffect, useState } from "react";

interface StatsBarProps {
  activeBets: number;
  totalVolume: number;
  totalParticipants: number;
}

export function StatsBar({
  activeBets,
  totalVolume,
  totalParticipants,
}: StatsBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      icon: Activity,
      label: "Live Markets",
      value: activeBets.toString(),
      subValue: "active now",
      accentColor: "oklch(72% 0.19 155)",
    },
    {
      icon: TrendingUp,
      label: "Total Volume",
      value: `${(totalVolume / 1000).toFixed(1)}K`,
      subValue: "SUI traded",
      accentColor: "oklch(72% 0.19 195)",
    },
    {
      icon: Users,
      label: "Active Users",
      value:
        totalParticipants > 0 ? totalParticipants.toLocaleString() : "1.2K",
      subValue: "last 24h",
      accentColor: "oklch(72% 0.19 195)",
    },
    {
      icon: Timer,
      label: "Avg Duration",
      value: "12s",
      subValue: "per market",
      accentColor: "oklch(75% 0.16 85)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            "stat-card relative overflow-hidden",
            "flex items-center gap-4 p-5",
            "transition-all duration-500 ease-out",
            "hover:translate-y-[-2px]",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
          style={{
            transitionDelay: `${index * 75}ms`,
            borderRadius: "8px",
            cursor: "default",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = stat.accentColor;
            e.currentTarget.style.boxShadow = `0 4px 24px -4px ${stat.accentColor} / 0.2, 0 0 1px ${stat.accentColor} / 0.4)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "oklch(25% 0.03 270)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Icon — neon accent colored */}
          <div
            className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center"
            style={{
              borderRadius: "4px",
              background: `color-mix(in oklch, ${stat.accentColor} 12%, transparent)`,
            }}
          >
            <stat.icon
              size={20}
              style={{ color: stat.accentColor }}
              strokeWidth={2}
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="micro-label mb-1">{stat.label}</div>
            <div
              className="text-2xl font-display leading-none mb-1"
              style={{
                fontWeight: 400,
                color: "oklch(93% 0.01 270)",
              }}
            >
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: "oklch(55% 0.02 270)" }}>
              {stat.subValue}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
