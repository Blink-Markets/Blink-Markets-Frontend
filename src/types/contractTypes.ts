// TypeScript types for on-chain contract data structures
import { EventType } from '../lib/constants';

// Event status enum matching the contract
export enum EventStatus {
    CREATED = 0,
    OPEN = 1,
    LOCKED = 2,
    RESOLVED = 3,
    CANCELLED = 4,
}

// Re-export EventType for convenience
export { EventType };

// On-chain PredictionEvent structure
export interface PredictionEvent {
    id: {
        id: string;
    };
    market_id: string;
    description: string;
    outcome_labels: string[][]; // vector<vector<u8>>
    outcome_pools: string[]; // Balance<SUI> objects (as strings)
    betting_start_time: string;
    betting_end_time: string;
    status: number; // EventStatus
    winning_outcome: number | null;
    resolved_at: string | null;
    winning_pool_at_resolution: string | null;
    // Crypto event fields
    event_type: number; // EventType (0 = CRYPTO, 1 = MANUAL)
    oracle_feed_id: number[] | null; // 32-byte feed ID for crypto events
    target_price: string | null; // u128 as string (18 decimals)
    oracle_price_at_resolution: string | null; // u128 as string
}

// Parsed event data for UI consumption
export interface ParsedEvent {
    id: string;
    marketId: string;
    description: string;
    outcomeLabels: string[];
    outcomePools: bigint[];
    bettingStartTime: number;
    bettingEndTime: number;
    status: EventStatus;
    winningOutcome: number | null;
    resolvedAt: number | null;
    winningPoolAtResolution: bigint | null;
    totalPool: bigint;
    // Crypto event fields
    eventType: EventType;
    oracleFeedId: string | null; // Hex string for feed ID
    targetPrice: bigint | null;
    oraclePriceAtResolution: bigint | null;
    // Computed fields
    isCryptoEvent: boolean;
}


// On-chain Position structure
export interface Position {
    id: {
        id: string;
    };
    event_id: string;
    outcome_index: number;
    stake_amount: string; // u64 as string
    is_claimed: boolean;
    owner: string;
}

// Parsed position data for UI consumption
export interface ParsedPosition {
    id: string;
    eventId: string;
    outcomeIndex: number;
    stakeAmount: bigint;
    isClaimed: boolean;
    owner: string;
}

// On-chain Market structure
export interface Market {
    id: {
        id: string;
    };
    name: string;
    description: string;
    min_stake: string;
    max_stake: string;
    platform_fee_bps: string;
    is_active: boolean;
    oracles: string[]; // vector<address>
}

// Parsed market data
export interface ParsedMarket {
    id: string;
    name: string;
    description: string;
    minStake: bigint;
    maxStake: bigint;
    platformFeeBps: number;
    isActive: boolean;
    oracles: string[];
}

// On-chain Treasury structure
export interface Treasury {
    id: {
        id: string;
    };
    balance: string; // Balance<SUI>
    total_fees_collected: string;
}

// Event subscription types
export interface BetPlacedEvent {
    event_id: string;
    position_id: string;
    outcome_index: number;
    stake_amount: string;
    bettor: string;
}

export interface EventResolvedEvent {
    event_id: string;
    winning_outcome: number;
    total_pool: string;
}

export interface WinningsClaimedEvent {
    event_id: string;
    position_id: string;
    payout_amount: string;
    claimer: string;
}

export interface RefundClaimedEvent {
    event_id: string;
    position_id: string;
    refund_amount: string;
    claimer: string;
}

export interface BetCancelledEvent {
    event_id: string;
    position_id: string;
    refund_amount: string;
    fee_amount: string;
}

// Helper type for position with event context
export interface PositionWithEvent {
    position: ParsedPosition;
    event: ParsedEvent | null;
    canClaim: boolean;
    claimType: 'winnings' | 'refund' | null;
    potentialPayout: bigint | null;
}

// Utility functions for type conversion
const parseMoveString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;

    // Handle Move String struct: { fields: { bytes: number[] } }
    if (value.fields?.bytes) {
        return String.fromCharCode(...value.fields.bytes);
    }

    // Handle raw vector<u8>: number[]
    if (Array.isArray(value)) {
        return String.fromCharCode(...value);
    }

    return String(value);
};

// Helper to convert byte array to hex string
const bytesToHex = (bytes: number[] | null): string | null => {
    if (!bytes || bytes.length === 0) return null;
    return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const parseEvent = (eventJson: any): ParsedEvent => {
    const eventType = Number(eventJson.event_type ?? EventType.MANUAL);

    return {
        id: eventJson.id?.id || eventJson.id,
        marketId: eventJson.market_id,
        description: parseMoveString(eventJson.description),
        outcomeLabels: (eventJson.outcome_labels || []).map((label: any) =>
            parseMoveString(label)
        ),
        outcomePools: (eventJson.outcome_pools || []).map((pool: string) => BigInt(pool)),
        bettingStartTime: Number(eventJson.betting_start_time),
        bettingEndTime: Number(eventJson.betting_end_time),
        status: Number(eventJson.status),
        winningOutcome: eventJson.winning_outcome !== null ? Number(eventJson.winning_outcome) : null,
        resolvedAt: eventJson.resolved_at ? Number(eventJson.resolved_at) : null,
        winningPoolAtResolution: eventJson.winning_pool_at_resolution
            ? BigInt(eventJson.winning_pool_at_resolution)
            : null,
        totalPool: (eventJson.outcome_pools || []).reduce(
            (sum: bigint, pool: string) => sum + BigInt(pool),
            0n
        ),
        // Crypto event fields
        eventType: eventType as EventType,
        oracleFeedId: bytesToHex(eventJson.oracle_feed_id),
        targetPrice: eventJson.target_price ? BigInt(eventJson.target_price) : null,
        oraclePriceAtResolution: eventJson.oracle_price_at_resolution
            ? BigInt(eventJson.oracle_price_at_resolution)
            : null,
        isCryptoEvent: eventType === EventType.CRYPTO,
    };
};


export const parsePosition = (positionJson: any): ParsedPosition => {
    return {
        id: positionJson.id?.id || positionJson.id,
        eventId: positionJson.event_id,
        outcomeIndex: Number(positionJson.outcome_index),
        stakeAmount: BigInt(positionJson.stake_amount),
        isClaimed: Boolean(positionJson.is_claimed),
        owner: positionJson.owner,
    };
};

export const parseMarket = (marketJson: any): ParsedMarket => {
    return {
        id: marketJson.id?.id || marketJson.id,
        name: marketJson.name,
        description: marketJson.description,
        minStake: BigInt(marketJson.min_stake),
        maxStake: BigInt(marketJson.max_stake),
        platformFeeBps: Number(marketJson.platform_fee_bps),
        isActive: Boolean(marketJson.is_active),
        oracles: marketJson.oracles || [],
    };
};

// Calculate potential payout for a position
export const calculatePayout = (
    position: ParsedPosition,
    event: ParsedEvent
): bigint | null => {
    if (event.status !== EventStatus.RESOLVED) return null;
    if (event.winningOutcome === null) return null;
    if (position.outcomeIndex !== event.winningOutcome) return null;
    if (event.winningPoolAtResolution === null || event.winningPoolAtResolution === 0n) return null;

    // Payout = (user_stake / winning_pool) * total_pool
    const userStake = position.stakeAmount;
    const winningPool = event.winningPoolAtResolution;
    const totalPool = event.totalPool;

    // Use u128 arithmetic to prevent overflow
    const payout = (userStake * totalPool) / winningPool;
    return payout;
};
