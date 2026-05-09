import { FlashBet, CATEGORIES } from "../types/bet";
import { cn } from "../lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface RecentBetsProps {
  bets: FlashBet[];
}

export function RecentBets({ bets }: RecentBetsProps) {
  if (bets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 flex items-center justify-center mb-5 border"
          style={{
            borderRadius: "4px",
            background: "oklch(20% 0.02 270)",
            borderColor: "oklch(25% 0.03 270)",
          }}
        >
          <Clock size={28} style={{ color: "oklch(55% 0.02 270)" }} />
        </div>
        <p
          className="font-medium mb-1"
          style={{ color: "oklch(78% 0.01 270)" }}
        >
          No results yet
        </p>
        <p className="text-sm" style={{ color: "oklch(55% 0.02 270)" }}>
          Completed markets will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map((bet, index) => {
        const category = CATEGORIES.find((c) => c.id === bet.category);
        const winnerOption = bet.winner === "A" ? bet.optionA : bet.optionB;
        const loserOption = bet.winner === "A" ? bet.optionB : bet.optionA;

        return (
          <div
            key={bet.id}
            className={cn(
              "relative p-4 overflow-hidden border",
              "transition-all duration-300",
              index === 0 &&
                "animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)]",
            )}
            style={{
              borderRadius: "4px",
              background: "oklch(18% 0.02 270)",
              borderColor: "oklch(25% 0.03 270)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 12px -2px oklch(72% 0.19 195 / 0.1)";
              e.currentTarget.style.borderColor = "oklch(30% 0.03 270)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "oklch(25% 0.03 270)";
            }}
          >
            {/* New badge for latest result — neon */}
            {index === 0 && (
              <div
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  borderRadius: "2px",
                  background: "oklch(72% 0.19 195)",
                  color: "oklch(10% 0.02 270)",
                  fontFamily: '"JetBrains Mono", monospace',
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
                    <div
                      className="w-9 h-9 overflow-hidden border"
                      style={{
                        borderRadius: "2px",
                        borderColor: "oklch(25% 0.03 270)",
                      }}
                    >
                      <img
                        src={bet.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="min-w-0">
                  <div
                    className="font-medium text-sm truncate mb-0.5"
                    style={{ color: "oklch(93% 0.01 270)" }}
                  >
                    {bet.title}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "oklch(55% 0.02 270)" }}
                  >
                    {category?.icon} {category?.label}
                  </span>
                </div>
              </div>
              {index !== 0 && (
                <span
                  className="text-xs whitespace-nowrap"
                  style={{ color: "oklch(55% 0.02 270)" }}
                >
                  Just now
                </span>
              )}
            </div>

            {/* Result — dark with neon accents */}
            <div className="flex items-center gap-2">
              {/* Winner */}
              <div
                className="flex-1 flex items-center gap-2 p-2.5 border"
                style={{
                  borderRadius: "2px",
                  background: "oklch(20% 0.04 155)",
                  borderColor: "oklch(30% 0.06 155)",
                }}
              >
                <CheckCircle2
                  size={14}
                  className="flex-shrink-0"
                  style={{ color: "oklch(72% 0.19 155)" }}
                />
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "oklch(72% 0.08 155)" }}
                >
                  {winnerOption?.label}
                </span>
                <span
                  className="ml-auto text-xs font-bold"
                  style={{
                    color: "oklch(72% 0.19 155)",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {winnerOption?.odds.toFixed(2)}x
                </span>
              </div>

              {/* Loser */}
              <div
                className="flex-1 flex items-center gap-2 p-2.5 border opacity-60"
                style={{
                  borderRadius: "2px",
                  background: "oklch(20% 0.03 25)",
                  borderColor: "oklch(28% 0.04 25)",
                }}
              >
                <XCircle
                  size={14}
                  className="flex-shrink-0"
                  style={{ color: "oklch(62% 0.22 25)" }}
                />
                <span
                  className="text-sm truncate"
                  style={{ color: "oklch(55% 0.04 25)" }}
                >
                  {loserOption?.label}
                </span>
              </div>
            </div>

            {/* Footer — hairline divider */}
            <div
              className="flex items-center justify-between mt-3 pt-3"
              style={{ borderTop: "1px solid oklch(25% 0.03 270)" }}
            >
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "oklch(55% 0.02 270)" }}
              >
                <TrendingUp size={12} />
                <span>{bet.totalPool.toLocaleString()} SUI pool</span>
              </div>
              <span
                className="text-xs"
                style={{ color: "oklch(55% 0.02 270)" }}
              >
                {bet.participants} participants
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
