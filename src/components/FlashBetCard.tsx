import { useState } from "react";
import { FlashBet } from "../types/bet";
import { useCountdown } from "../hooks/useCountdown";
import { cn } from "../lib/utils";
import { Zap, Users, ChevronRight, Sparkles } from "lucide-react";

interface FlashBetCardProps {
  bet: FlashBet;
  onPlaceBet: (
    betId: string,
    choice: "A" | "B",
    amount: number,
  ) => Promise<void>;
  onOpenBet?: (betId: string) => Promise<void>;
  isConnected: boolean;
}

const BET_AMOUNTS = [0.01, 0.05, 0.1, 0.25];

export function FlashBetCard({
  bet,
  onPlaceBet,
  onOpenBet,
  isConnected,
}: FlashBetCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<"A" | "B" | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0.05);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const duration = bet.expiresAt - bet.createdAt;
  const { isUrgent, isCritical, isExpired, formattedTime } = useCountdown(
    bet.expiresAt,
    duration,
  );

  const handlePlaceBet = async () => {
    if (!selectedChoice || isExpired || !isConnected) return;

    setIsPlacing(true);
    try {
      await onPlaceBet(bet.id, selectedChoice, betAmount);
      setSelectedChoice(null);
    } finally {
      setIsPlacing(false);
    }
  };

  const handleOpenBet = async () => {
    if (!onOpenBet || !isConnected) return;
    setIsOpening(true);
    try {
      await onOpenBet(bet.id);
    } finally {
      setIsOpening(false);
    }
  };

  const isCreated = bet.status === "created";

  // Dark exchange status colors — neon accents
  const statusAccent = isCreated
    ? "oklch(68% 0.22 250)"
    : isExpired
      ? "oklch(55% 0.02 270)"
      : isCritical
        ? "oklch(62% 0.22 25)"
        : isUrgent
          ? "oklch(75% 0.16 85)"
          : "oklch(72% 0.19 155)";

  return (
    <div
      className={cn(
        "group relative flex flex-col transition-all duration-300",
        "border overflow-hidden",
        (isExpired || isCreated) && "opacity-90",
        isCritical &&
          !isExpired &&
          !isCreated &&
          "animate-[shake_0.4s_ease-in-out_infinite]",
      )}
      style={{
        borderRadius: "8px",
        background: "oklch(16% 0.02 270)",
        borderColor: isCreated
          ? "oklch(30% 0.04 250)"
          : isExpired
            ? "oklch(25% 0.03 270)"
            : isCritical
              ? "oklch(30% 0.05 25)"
              : isUrgent
                ? "oklch(28% 0.03 75)"
                : "oklch(25% 0.03 270)",
        boxShadow: "none",
      }}
      onMouseEnter={(e) => {
        if (!isExpired) {
          e.currentTarget.style.boxShadow = `0 4px 24px -4px ${statusAccent} / 0.15, 0 0 1px ${statusAccent} / 0.4)`;
          e.currentTarget.style.borderColor = statusAccent;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = isCreated
          ? "oklch(30% 0.04 250)"
          : isExpired
            ? "oklch(25% 0.03 270)"
            : isCritical
              ? "oklch(30% 0.05 25)"
              : isUrgent
                ? "oklch(28% 0.03 75)"
                : "oklch(25% 0.03 270)";
      }}
    >
      <div className="p-5 flex flex-col h-full relative z-10">
        {/* Countdown Timer — centered, neon */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            {!isExpired && !isCreated && (
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: statusAccent,
                  boxShadow: `0 0 8px ${statusAccent} / 0.6)`,
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
            )}
            <span
              className="text-sm font-semibold px-3 py-1"
              style={{
                borderRadius: "2px",
                background: `color-mix(in oklch, ${statusAccent} 12%, transparent)`,
                color: statusAccent,
                fontFamily: '"Space Grotesk", monospace',
                letterSpacing: "0.05em",
              }}
            >
              {isCreated
                ? "NOT OPEN"
                : isExpired
                  ? "CLOSED"
                  : `${formattedTime}s`}
            </span>
          </div>
        </div>

        {/* Title & Description — dark exchange serif */}
        <h3
          className="text-lg font-display mb-1.5 leading-tight text-center"
          style={{
            fontWeight: 500,
            color: "oklch(93% 0.01 270)",
          }}
        >
          {bet.title}
        </h3>
        {bet.description && (
          <p
            className="text-sm mb-5 line-clamp-2 leading-relaxed text-center"
            style={{ color: "oklch(60% 0.02 270)" }}
          >
            {bet.description}
          </p>
        )}

        {/* Open Event Action */}
        {isCreated ? (
          <div
            className="mb-6 p-4 text-center border"
            style={{
              borderRadius: "4px",
              background: "oklch(20% 0.03 250)",
              borderColor: "oklch(30% 0.04 250)",
            }}
          >
            <p
              className="text-sm mb-3"
              style={{ color: "oklch(68% 0.04 250)" }}
            >
              Event created. Waiting to open for betting.
            </p>
            {onOpenBet && isConnected && (
              <button
                onClick={handleOpenBet}
                disabled={isOpening}
                className={cn(
                  "w-full py-2.5 text-sm font-semibold transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                style={{
                  borderRadius: "0px",
                  background: "oklch(72% 0.19 195)",
                  color: "oklch(10% 0.02 270)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontFamily: '"Space Grotesk", monospace',
                  fontSize: "0.75rem",
                }}
              >
                {isOpening ? "Opening..." : "Open Event for Betting"}
              </button>
            )}
          </div>
        ) : isExpired && !isCreated && bet.status === "active" ? (
          <div
            className="mb-6 p-4 text-center border"
            style={{
              borderRadius: "4px",
              background: "oklch(20% 0.03 75)",
              borderColor: "oklch(30% 0.04 75)",
            }}
          >
            <p className="text-sm mb-3" style={{ color: "oklch(75% 0.04 75)" }}>
              Event expired. Waiting to be locked.
            </p>
            {onOpenBet && isConnected && (
              <button
                onClick={handleOpenBet}
                disabled={isOpening}
                className={cn(
                  "w-full py-2.5 text-sm font-semibold transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                style={{
                  borderRadius: "0px",
                  background: "oklch(75% 0.16 85)",
                  color: "oklch(10% 0.02 270)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontFamily: '"Space Grotesk", monospace',
                  fontSize: "0.75rem",
                }}
              >
                {isOpening ? "Locking..." : "Lock Event"}
              </button>
            )}
          </div>
        ) : bet.status === "locked" ? (
          <div
            className="mb-6 p-4 text-center border"
            style={{
              borderRadius: "4px",
              background: "oklch(20% 0.03 290)",
              borderColor: "oklch(30% 0.04 290)",
            }}
          >
            <p
              className="text-sm mb-3"
              style={{ color: "oklch(68% 0.04 290)" }}
            >
              Event locked. Select winner to resolve.
            </p>
            {onOpenBet && isConnected && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onOpenBet(bet.id + "-resolve-0")}
                  disabled={isOpening}
                  className="py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                  style={{
                    borderRadius: "0px",
                    background: "oklch(72% 0.19 155)",
                    color: "oklch(10% 0.02 270)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily: '"Space Grotesk", monospace',
                    fontSize: "0.7rem",
                  }}
                >
                  {bet.optionA.label} Wins
                </button>
                <button
                  onClick={() => onOpenBet(bet.id + "-resolve-1")}
                  disabled={isOpening}
                  className="py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                  style={{
                    borderRadius: "0px",
                    background: "oklch(62% 0.22 25)",
                    color: "oklch(93% 0.01 270)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily: '"Space Grotesk", monospace',
                    fontSize: "0.7rem",
                  }}
                >
                  {bet.optionB.label} Wins
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Outcome Buttons — dark with neon borders */
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Option A */}
            <button
              onClick={() => !isExpired && setSelectedChoice("A")}
              disabled={isExpired}
              className={cn(
                "relative p-4 border text-left transition-all duration-200",
                isExpired && "cursor-not-allowed",
              )}
              style={{
                borderRadius: "4px",
                background:
                  selectedChoice === "A"
                    ? "oklch(20% 0.04 155)"
                    : "oklch(18% 0.02 270)",
                borderColor:
                  selectedChoice === "A"
                    ? "oklch(72% 0.19 155)"
                    : "oklch(25% 0.03 270)",
                boxShadow:
                  selectedChoice === "A"
                    ? "0 0 12px oklch(72% 0.19 155 / 0.2)"
                    : "none",
                cursor: isExpired ? "not-allowed" : "pointer",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-semibold text-sm truncate"
                  style={{ color: "oklch(93% 0.01 270)" }}
                >
                  {bet.optionA.shortLabel || bet.optionA.label}
                </span>
                <span
                  className="font-bold text-lg font-display"
                  style={{ color: "oklch(72% 0.19 155)" }}
                >
                  {bet.optionA.odds.toFixed(2)}x
                </span>
              </div>
              {/* Progress bar — neon glow */}
              <div
                className="h-1.5 mb-1.5"
                style={{
                  borderRadius: "1px",
                  background: "oklch(22% 0.03 270)",
                }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${bet.optionA.percentage}%`,
                    background: "oklch(72% 0.19 155)",
                    borderRadius: "1px",
                    boxShadow: "0 0 6px oklch(72% 0.19 155 / 0.4)",
                  }}
                />
              </div>
              <span
                className="text-xs"
                style={{ color: "oklch(55% 0.02 270)" }}
              >
                {bet.optionA.percentage}% ·{" "}
                {bet.optionA.totalBets.toLocaleString()} SUI
              </span>
            </button>

            {/* Option B */}
            <button
              onClick={() => !isExpired && setSelectedChoice("B")}
              disabled={isExpired}
              className={cn(
                "relative p-4 border text-left transition-all duration-200",
                isExpired && "cursor-not-allowed",
              )}
              style={{
                borderRadius: "4px",
                background:
                  selectedChoice === "B"
                    ? "oklch(20% 0.04 75)"
                    : "oklch(18% 0.02 270)",
                borderColor:
                  selectedChoice === "B"
                    ? "oklch(75% 0.16 85)"
                    : "oklch(25% 0.03 270)",
                boxShadow:
                  selectedChoice === "B"
                    ? "0 0 12px oklch(75% 0.16 85 / 0.2)"
                    : "none",
                cursor: isExpired ? "not-allowed" : "pointer",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-semibold text-sm truncate"
                  style={{ color: "oklch(93% 0.01 270)" }}
                >
                  {bet.optionB.shortLabel || bet.optionB.label}
                </span>
                <span
                  className="font-bold text-lg font-display"
                  style={{ color: "oklch(75% 0.16 85)" }}
                >
                  {bet.optionB.odds.toFixed(2)}x
                </span>
              </div>
              {/* Progress bar — neon glow */}
              <div
                className="h-1.5 mb-1.5"
                style={{
                  borderRadius: "1px",
                  background: "oklch(22% 0.03 270)",
                }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${bet.optionB.percentage}%`,
                    background: "oklch(75% 0.16 85)",
                    borderRadius: "1px",
                    boxShadow: "0 0 6px oklch(75% 0.16 85 / 0.4)",
                  }}
                />
              </div>
              <span
                className="text-xs"
                style={{ color: "oklch(55% 0.02 270)" }}
              >
                {bet.optionB.percentage}% ·{" "}
                {bet.optionB.totalBets.toLocaleString()} SUI
              </span>
            </button>
          </div>
        )}

        {/* Bet Amount Selection — dark exchange */}
        {selectedChoice && !isExpired && (
          <div className="animate-[slide-up_0.3s_ease-out] space-y-3 mt-auto">
            <div className="flex gap-2">
              {BET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold transition-all duration-200",
                    "border",
                  )}
                  style={{
                    borderRadius: "0px",
                    background:
                      betAmount === amount
                        ? "oklch(72% 0.19 195)"
                        : "transparent",
                    borderColor:
                      betAmount === amount
                        ? "oklch(72% 0.19 195)"
                        : "oklch(30% 0.03 270)",
                    color:
                      betAmount === amount
                        ? "oklch(10% 0.02 270)"
                        : "oklch(65% 0.01 270)",
                    fontFamily: '"Space Grotesk", monospace',
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                  }}
                >
                  {amount}
                </button>
              ))}
            </div>

            <button
              onClick={handlePlaceBet}
              disabled={!isConnected || isPlacing}
              className={cn(
                "w-full py-3.5 font-semibold transition-all duration-200",
                "flex items-center justify-center gap-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              style={{
                borderRadius: "0px",
                background: "oklch(72% 0.19 195)",
                color: "oklch(10% 0.02 270)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: '"Space Grotesk", monospace',
                fontSize: "0.8rem",
                boxShadow: "none",
                cursor: isConnected && !isPlacing ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (isConnected && !isPlacing) {
                  e.currentTarget.style.boxShadow =
                    "0 0 20px oklch(72% 0.19 195 / 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {!isConnected ? (
                "Connect Wallet"
              ) : isPlacing ? (
                <span className="flex items-center gap-2">
                  <Sparkles size={18} className="animate-spin" /> Placing...
                </span>
              ) : (
                <>
                  <Zap size={18} />
                  Place {betAmount} SUI
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer Stats — hairline divider */}
        <div
          className={cn(
            "flex items-center justify-between pt-4 mt-auto text-sm",
            selectedChoice && !isExpired && "mt-3",
          )}
          style={{
            borderTop: "1px solid oklch(25% 0.03 270)",
          }}
        >
          <div
            className="flex items-center gap-1.5"
            style={{ color: "oklch(55% 0.02 270)" }}
          >
            <Users size={14} />
            <span>{bet.participants} bettors</span>
          </div>
          <div
            className="font-semibold"
            style={{
              fontFamily: '"Space Grotesk", monospace',
              color: "oklch(93% 0.01 270)",
            }}
          >
            {bet.totalPool.toLocaleString()} SUI
          </div>
        </div>
      </div>
    </div>
  );
}
