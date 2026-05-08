import { useMemo } from "react";
import { usePositions } from "../hooks/usePositions";
import { useEvents } from "../hooks/useEvents";
import { useClaims } from "../hooks/useClaims";
import {
  EventStatus,
  calculatePayout,
  PositionWithEvent,
} from "../types/contractTypes";
import { MIST_PER_SUI } from "../lib/constants";
import { Trophy, XCircle, Clock, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

export function PositionsPanel() {
  const { positions, isLoading: isLoadingPositions } = usePositions();
  const { claimWinnings, claimRefund, isClaimingWinnings, isClaimingRefund } =
    useClaims();

  // Fetch events for all positions
  const eventIds = useMemo(() => {
    return Array.from(new Set(positions.map((p) => p.eventId)));
  }, [positions]);

  // For simplicity, we'll fetch the first event (in a real app, fetch all events)
  const { event } = useEvents({
    eventId: eventIds[0],
    enabled: eventIds.length > 0,
  });

  // Combine positions with event data
  const positionsWithEvents = useMemo<PositionWithEvent[]>(() => {
    return positions.map((position) => {
      // In a real implementation, match position.eventId with fetched events
      const matchedEvent = event?.id === position.eventId ? event : null;

      let canClaim = false;
      let claimType: "winnings" | "refund" | null = null;
      let potentialPayout: bigint | null = null;

      if (matchedEvent && !position.isClaimed) {
        if (matchedEvent.status === EventStatus.RESOLVED) {
          if (matchedEvent.winningOutcome === position.outcomeIndex) {
            canClaim = true;
            claimType = "winnings";
            potentialPayout = calculatePayout(position, matchedEvent);
          }
        } else if (matchedEvent.status === EventStatus.CANCELLED) {
          canClaim = true;
          claimType = "refund";
          potentialPayout = position.stakeAmount;
        }
      }

      return {
        position,
        event: matchedEvent,
        canClaim,
        claimType,
        potentialPayout,
      };
    });
  }, [positions, event]);

  const handleClaim = async (positionWithEvent: PositionWithEvent) => {
    if (!positionWithEvent.canClaim || !positionWithEvent.event) return;

    try {
      if (positionWithEvent.claimType === "winnings") {
        await claimWinnings(
          positionWithEvent.event.id,
          positionWithEvent.position.id,
        );
        alert("Winnings claimed successfully!");
      } else if (positionWithEvent.claimType === "refund") {
        await claimRefund(
          positionWithEvent.event.id,
          positionWithEvent.position.id,
        );
        alert("Refund claimed successfully!");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to claim: ${message}`);
    }
  };

  if (isLoadingPositions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Sparkles
          className="animate-spin"
          size={32}
          style={{ color: "oklch(72% 0.19 195)" }}
        />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div
        className="p-8 text-center border border-dashed"
        style={{
          borderRadius: "4px",
          background: "oklch(16% 0.02 270)",
          borderColor: "oklch(30% 0.03 270)",
        }}
      >
        <div
          className="w-16 h-16 flex items-center justify-center mx-auto mb-4 border"
          style={{
            borderRadius: "4px",
            background: "oklch(20% 0.02 270)",
            borderColor: "oklch(25% 0.03 270)",
          }}
        >
          <AlertCircle size={28} style={{ color: "oklch(55% 0.02 270)" }} />
        </div>
        <p
          className="font-medium mb-1"
          style={{ color: "oklch(78% 0.01 270)" }}
        >
          No positions yet
        </p>
        <p className="text-sm" style={{ color: "oklch(55% 0.02 270)" }}>
          Place a bet to see your positions here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positionsWithEvents.map((positionWithEvent) => {
        const { position, event, canClaim, claimType, potentialPayout } =
          positionWithEvent;
        const stakeInSui = Number(position.stakeAmount) / Number(MIST_PER_SUI);
        const payoutInSui = potentialPayout
          ? Number(potentialPayout) / Number(MIST_PER_SUI)
          : null;

        // Dark exchange status colors — neon accents
        const statusColor = position.isClaimed
          ? "oklch(55% 0.02 270)"
          : canClaim && claimType === "winnings"
            ? "oklch(72% 0.19 155)"
            : canClaim && claimType === "refund"
              ? "oklch(75% 0.16 85)"
              : "oklch(72% 0.19 195)";

        const statusIcon = position.isClaimed ? (
          <XCircle size={16} />
        ) : canClaim && claimType === "winnings" ? (
          <Trophy size={16} />
        ) : (
          <Clock size={16} />
        );

        const statusText = position.isClaimed
          ? "Claimed"
          : canClaim && claimType === "winnings"
            ? "Winner!"
            : canClaim && claimType === "refund"
              ? "Refund Available"
              : event?.status === EventStatus.OPEN
                ? "Active"
                : event?.status === EventStatus.LOCKED
                  ? "Locked"
                  : "Pending";

        return (
          <div
            key={position.id}
            className="p-5 border transition-all duration-200 hover:translate-y-[-2px]"
            style={{
              borderRadius: "4px",
              background: "oklch(16% 0.02 270)",
              borderColor: `color-mix(in oklch, ${statusColor} 30%, oklch(25% 0.03 270))`,
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 16px -4px ${statusColor} / 0.15)`;
              e.currentTarget.style.borderColor = statusColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = `color-mix(in oklch, ${statusColor} 30%, oklch(25% 0.03 270))`;
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border"
                    style={{
                      borderRadius: "2px",
                      background: `color-mix(in oklch, ${statusColor} 12%, transparent)`,
                      color: statusColor,
                      borderColor: `color-mix(in oklch, ${statusColor} 30%, oklch(25% 0.03 270))`,
                      fontFamily: '"Space Grotesk", monospace',
                      letterSpacing: "0.05em",
                    }}
                  >
                    {statusIcon}
                    {statusText}
                  </span>
                </div>
                <p
                  className="text-sm mb-1"
                  style={{ color: "oklch(78% 0.01 270)" }}
                >
                  {event?.description || "Loading event..."}
                </p>
                <p className="text-xs" style={{ color: "oklch(55% 0.02 270)" }}>
                  Outcome:{" "}
                  {event?.outcomeLabels?.[position.outcomeIndex] ||
                    `#${position.outcomeIndex}`}
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: "1px solid oklch(25% 0.03 270)" }}
            >
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "oklch(55% 0.02 270)" }}
                >
                  Your Stake
                </p>
                <p
                  className="font-semibold"
                  style={{
                    fontFamily: '"Space Grotesk", monospace',
                    color: "oklch(93% 0.01 270)",
                  }}
                >
                  {stakeInSui.toFixed(3)} SUI
                </p>
              </div>

              {payoutInSui !== null && (
                <div className="text-right">
                  <p
                    className="text-xs mb-1"
                    style={{ color: "oklch(55% 0.02 270)" }}
                  >
                    {claimType === "winnings" ? "Payout" : "Refund"}
                  </p>
                  <p
                    className="font-bold text-lg font-display"
                    style={{ color: statusColor }}
                  >
                    {payoutInSui.toFixed(3)} SUI
                  </p>
                </div>
              )}
            </div>

            {canClaim && !position.isClaimed && (
              <button
                onClick={() => handleClaim(positionWithEvent)}
                disabled={isClaimingWinnings || isClaimingRefund}
                className={cn(
                  "w-full mt-4 py-3 font-semibold transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2",
                )}
                style={{
                  borderRadius: "0px",
                  background:
                    claimType === "winnings"
                      ? "oklch(72% 0.19 195)"
                      : "oklch(75% 0.16 85)",
                  color:
                    claimType === "winnings"
                      ? "oklch(10% 0.02 270)"
                      : "oklch(10% 0.02 270)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontFamily: '"Space Grotesk", monospace',
                  fontSize: "0.75rem",
                  boxShadow: "none",
                  cursor:
                    isClaimingWinnings || isClaimingRefund
                      ? "not-allowed"
                      : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isClaimingWinnings && !isClaimingRefund) {
                    e.currentTarget.style.boxShadow = `0 0 16px ${claimType === "winnings" ? "oklch(72% 0.19 195)" : "oklch(75% 0.16 85)"} / 0.3)`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {isClaimingWinnings || isClaimingRefund ? (
                  <>
                    <Sparkles size={18} className="animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Trophy size={18} />
                    Claim {claimType === "winnings" ? "Winnings" : "Refund"}
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
