// TypeScript types for blink_market on-chain data structures
// Matches the contract-api-reference.md specification

// ============================================================================
// Core Enums
// ============================================================================

export const SIDE = {
    YES: 0 as const,
    NO: 1 as const,
};

export type Side = 0 | 1;

// ============================================================================
// On-Chain Object Types (raw from Sui RPC)
// ============================================================================

// Raw Position object as returned by Sui RPC (fields of a Move struct)
export interface RawPosition {
    id: { id: string };
    market_id: string; // ID of the Market object
    side: number;      // 0 = YES, 1 = NO
    size: string;      // u64 as string — total notional / payout amount
}

// Raw Market object fields from Sui RPC
export interface RawMarket {
    id: { id: string };
    is_resolved: boolean;
    winning_side: number; // 0 = YES, 1 = NO; only valid if is_resolved
    pool: {
        fields: { value: string }; // Balance<CoinType>
    };
    event_id: number[]; // vector<u8> — off-chain event identifier
}

// Raw Clearinghouse account entry
export interface RawClearinghouseAccount {
    balance: string; // u64 as string
    last_seq: string; // u64 as string — last accepted PMM sequence number
}

// ============================================================================
// Parsed Types (for UI consumption)
// ============================================================================

// Position object owned by a user's wallet
export interface ParsedPosition {
    id: string;
    marketId: string;
    side: Side;
    size: bigint; // Payout amount in base units

    // Legacy fields for backward compatibility during migration
    // @deprecated - new contract uses marketId/side/size only
    eventId?: string;
    isClaimed?: boolean;
    outcomeIndex?: number;
    stakeAmount?: bigint;
}

// Market state
export interface ParsedMarket {
    id: string;
    isResolved: boolean;
    winningSide: Side | null; // null if not yet resolved
    poolBalance: bigint;      // Current collateral in base units
    eventId: string;          // Decoded off-chain event identifier
}

// Clearinghouse state for a specific PMM
export interface ParsedClearinghouseAccount {
    balance: bigint;
    lastSeq: bigint;
}

// ============================================================================
// PMM Quote Types
// ============================================================================

// Quote returned by the PMM backend — all fields passed directly to execute_rfq
export interface TradeQuote {
    marketId: string;       // Market<CoinType> object ID
    side: Side;             // 0 = YES, 1 = NO
    priceBps: bigint;       // PMM quoted probability in bps (e.g., 6000 = 60%)
    size: bigint;           // Total notional in base units
    seqNumber: bigint;      // Monotonic nonce from PMM
    expiresAt: bigint;      // Unix timestamp in milliseconds
    pmm: string;            // PMM's Sui address
    pmmPubkey: Uint8Array;  // PMM's Ed25519 public key (32 bytes)
    signature: Uint8Array;  // Ed25519 signature over canonical message (64 bytes)
}

// Parameters required to execute a trade on-chain
export interface ExecuteRfqParams {
    quote: TradeQuote;
    clearinghouseId: string;
    coinObjectId: string;  // Must hold exactly user_total_pay
    coinType: string;      // e.g., "0x2::sui::SUI"
    packageId: string;
}

// Parameters for redeeming a winning position
export interface RedeemPositionParams {
    marketId: string;
    positionId: string;
    coinType: string;
    packageId: string;
}

// ============================================================================
// On-Chain Events (from Sui event subscriptions)
// ============================================================================

export interface TradeExecutedEvent {
    market_id: string;
    position_id: string;  // Object ID of the minted Position
    side: number;          // 0 = YES, 1 = NO
    size: string;          // Total notional in base units (u64 as string)
    price_bps: string;     // Quoted probability in basis points
    user: string;          // User's Sui address
    pmm: string;           // PMM's Sui address
    seq_number: string;    // PMM's sequence number for this trade
}

export interface PositionRedeemedEvent {
    market_id: string;
    position_id: string;
    size: string;  // Payout amount in base units
    user: string;
}

export interface MarketCreatedEvent {
    market_id: string;
    event_id: number[]; // Off-chain event identifier bytes
}

export interface MarketResolvedEvent {
    market_id: string;
    winning_side: number; // 0 = YES, 1 = NO
}

export interface DepositEvent {
    pmm: string;
    amount: string;
}

export interface WithdrawEvent {
    pmm: string;
    amount: string;
}

// ============================================================================
// UI Helper Types
// ============================================================================

// Position enriched with market context for display
export interface PositionWithMarket {
    position: ParsedPosition;
    market: ParsedMarket | null;
    canRedeem: boolean;       // true if market is resolved and position is on winning side
    payout: bigint | null;    // equals position.size if redeemable, null otherwise
}

// ============================================================================
// Parsers
// ============================================================================

export const parsePosition = (raw: any): ParsedPosition => ({
    id: raw.id?.id ?? raw.id,
    marketId: raw.market_id,
    side: Number(raw.side) as Side,
    size: BigInt(raw.size),
});

export const parseMarket = (raw: any): ParsedMarket => ({
    id: raw.id?.id ?? raw.id,
    isResolved: Boolean(raw.is_resolved),
    winningSide: raw.is_resolved ? (Number(raw.winning_side) as Side) : null,
    poolBalance: BigInt(raw.pool?.fields?.value ?? raw.pool_balance ?? 0),
    eventId: Array.isArray(raw.event_id)
        ? Buffer.from(raw.event_id).toString("utf8")
        : String(raw.event_id ?? ""),
});

export const parseClearinghouseAccount = (raw: any): ParsedClearinghouseAccount => ({
    balance: BigInt(raw.balance ?? 0),
    lastSeq: BigInt(raw.last_seq ?? 0),
});

// ============================================================================
// Trade Helpers
// ============================================================================

// Determines if a position can be redeemed given market state
export const canRedeemPosition = (
    position: ParsedPosition,
    market: ParsedMarket,
): boolean => {
    if (!market.isResolved) return false;
    if (market.winningSide === null) return false;
    return position.side === market.winningSide;
};

// Side label helper
export const sideLabel = (side: Side): "YES" | "NO" =>
    side === SIDE.YES ? "YES" : "NO";

// ============================================================================
// Legacy Types (deprecated — kept for backward compatibility during migration)
// ============================================================================

// @deprecated Use ParsedMarket.isResolved / winningSide instead
export enum EventStatus {
    CREATED = 0,
    OPEN = 1,
    LOCKED = 2,
    RESOLVED = 3,
    CANCELLED = 4,
}

// @deprecated Use ParsedMarket instead
export interface ParsedEvent {
    id: string;
    marketId: string;
    description: string;
    outcomeLabels: string[];
    outcomePools: bigint[];
    bettingStartTime: number;
    bettingEndTime: number;
    status: number;
    winningOutcome: number | null;
    resolvedAt: number | null;
    winningPoolAtResolution: bigint | null;
    totalPool: bigint;
}

// @deprecated — old contract used outcome_index; new contract uses side (0/1)
export interface PositionWithEvent {
    position: ParsedPosition;
    event: ParsedEvent | null;
    canClaim: boolean;
    claimType: "winnings" | "refund" | null;
    potentialPayout: bigint | null;
}

// @deprecated Use canRedeemPosition instead
export const calculatePayout = (
    _position: ParsedPosition,
    _event: ParsedEvent,
): bigint | null => null;

// @deprecated Use parseMarket from the new contract
export const parseEvent = (raw: any): ParsedEvent => ({
    id: raw.id?.id ?? raw.id,
    marketId: raw.market_id ?? "",
    description: raw.description ?? "",
    outcomeLabels: raw.outcome_labels ?? [],
    outcomePools: [],
    bettingStartTime: Number(raw.betting_start_time ?? 0),
    bettingEndTime: Number(raw.betting_end_time ?? 0),
    status: Number(raw.status ?? 0),
    winningOutcome: raw.winning_outcome != null ? Number(raw.winning_outcome) : null,
    resolvedAt: raw.resolved_at ? Number(raw.resolved_at) : null,
    winningPoolAtResolution: null,
    totalPool: 0n,
});

