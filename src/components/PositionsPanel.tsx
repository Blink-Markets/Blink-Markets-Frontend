import { useMemo } from 'react';
import { usePositions } from '../hooks/usePositions';
import { useEvents } from '../hooks/useEvents';
import { useClaims } from '../hooks/useClaims';
import { EventStatus, calculatePayout, PositionWithEvent } from '../types/contractTypes';
import { MIST_PER_SUI } from '../lib/constants';
import { Trophy, XCircle, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function PositionsPanel() {
  const { positions, isLoading: isLoadingPositions } = usePositions();
  const { claimWinnings, claimRefund, isClaimingWinnings, isClaimingRefund } = useClaims();

  // Fetch events for all positions
  const eventIds = useMemo(() => {
    return Array.from(new Set(positions.map(p => p.eventId)));
  }, [positions]);

  // For simplicity, we'll fetch the first event (in a real app, fetch all events)
  const { event } = useEvents({
    eventId: eventIds[0],
    enabled: eventIds.length > 0,
  });

  // Combine positions with event data
  const positionsWithEvents = useMemo<PositionWithEvent[]>(() => {
    return positions.map(position => {
      // In a real implementation, match position.eventId with fetched events
      const matchedEvent = event?.id === position.eventId ? event : null;
      
      let canClaim = false;
      let claimType: 'winnings' | 'refund' | null = null;
      let potentialPayout: bigint | null = null;

      if (matchedEvent && !position.isClaimed) {
        if (matchedEvent.status === EventStatus.RESOLVED) {
          if (matchedEvent.winningOutcome === position.outcomeIndex) {
            canClaim = true;
            claimType = 'winnings';
            potentialPayout = calculatePayout(position, matchedEvent);
          }
        } else if (matchedEvent.status === EventStatus.CANCELLED) {
          canClaim = true;
          claimType = 'refund';
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
      if (positionWithEvent.claimType === 'winnings') {
        await claimWinnings(positionWithEvent.event.id, positionWithEvent.position.id);
        alert('Winnings claimed successfully!');
      } else if (positionWithEvent.claimType === 'refund') {
        await claimRefund(positionWithEvent.event.id, positionWithEvent.position.id);
        alert('Refund claimed successfully!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to claim: ${message}`);
    }
  };

  if (isLoadingPositions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Sparkles className="animate-spin text-[#4DA2FF]" size={32} />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.6) 0%, rgba(15, 31, 56, 0.4) 100%)',
          border: '1px dashed rgba(77, 162, 255, 0.2)',
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'rgba(77, 162, 255, 0.1)',
          }}
        >
          <AlertCircle className="text-[#4DA2FF]" size={28} />
        </div>
        <p className="text-foreground-secondary font-semibold mb-1">No positions yet</p>
        <p className="text-sm text-foreground-tertiary">
          Place a bet to see your positions here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positionsWithEvents.map((positionWithEvent) => {
        const { position, event, canClaim, claimType, potentialPayout } = positionWithEvent;
        const stakeInSui = Number(position.stakeAmount) / Number(MIST_PER_SUI);
        const payoutInSui = potentialPayout ? Number(potentialPayout) / Number(MIST_PER_SUI) : null;

        const statusColor = position.isClaimed
          ? '#6B7C95'
          : canClaim && claimType === 'winnings'
          ? '#00E5A0'
          : canClaim && claimType === 'refund'
          ? '#FFB84D'
          : '#4DA2FF';

        const statusIcon = position.isClaimed ? (
          <XCircle size={16} />
        ) : canClaim && claimType === 'winnings' ? (
          <Trophy size={16} />
        ) : (
          <Clock size={16} />
        );

        const statusText = position.isClaimed
          ? 'Claimed'
          : canClaim && claimType === 'winnings'
          ? 'Winner!'
          : canClaim && claimType === 'refund'
          ? 'Refund Available'
          : event?.status === EventStatus.OPEN
          ? 'Active'
          : event?.status === EventStatus.LOCKED
          ? 'Locked'
          : 'Pending';

        return (
          <div
            key={position.id}
            className="rounded-xl p-5 transition-all duration-200 hover:translate-y-[-2px]"
            style={{
              background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.8) 0%, rgba(15, 31, 56, 0.6) 100%)',
              border: `1px solid ${statusColor}33`,
              boxShadow: canClaim ? `0 4px 20px ${statusColor}22` : 'none',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: `${statusColor}22`,
                      color: statusColor,
                      border: `1px solid ${statusColor}44`,
                    }}
                  >
                    {statusIcon}
                    {statusText}
                  </span>
                </div>
                <p className="text-sm text-foreground-secondary mb-1">
                  {event?.description || 'Loading event...'}
                </p>
                <p className="text-xs text-foreground-tertiary">
                  Outcome: {event?.outcomeLabels?.[position.outcomeIndex] || `#${position.outcomeIndex}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(77, 162, 255, 0.1)' }}>
              <div>
                <p className="text-xs text-foreground-tertiary mb-1">Your Stake</p>
                <p className="font-mono font-semibold text-foreground">
                  {stakeInSui.toFixed(3)} SUI
                </p>
              </div>

              {payoutInSui !== null && (
                <div className="text-right">
                  <p className="text-xs text-foreground-tertiary mb-1">
                    {claimType === 'winnings' ? 'Payout' : 'Refund'}
                  </p>
                  <p
                    className="font-mono font-bold text-lg"
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
                  'w-full mt-4 py-3 rounded-xl font-semibold transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
                style={{
                  background: claimType === 'winnings'
                    ? 'linear-gradient(135deg, #00E5A0, #00F5B8)'
                    : 'linear-gradient(135deg, #FFB84D, #FFC870)',
                  color: '#050B15',
                  boxShadow: `0 6px 24px ${statusColor}44`,
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
                    Claim {claimType === 'winnings' ? 'Winnings' : 'Refund'}
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
