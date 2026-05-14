// Contract configuration and constants

export const MIST_PER_SUI = 1_000_000_000n;

// Contract addresses from environment variables
export const PACKAGE_ID = import.meta.env.VITE_BLINK_PACKAGE_ID as string | undefined;
export const MARKET_ID = import.meta.env.VITE_BLINK_MARKET_ID as string | undefined;
export const TREASURY_ID = import.meta.env.VITE_BLINK_TREASURY_ID as string | undefined;
export const EVENT_ID = import.meta.env.VITE_BLINK_EVENT_ID as string | undefined;

// Default coin type (SUI)
export const DEFAULT_COIN_TYPE = '0x2::sui::SUI';

// Sui system objects
export const CLOCK_OBJECT_ID = '0x6';

// Stork Oracle Configuration (for crypto events)
export const STORK_STATE = import.meta.env.VITE_STORK_STATE as string | undefined;
export const STORK_PACKAGE_ID = import.meta.env.VITE_STORK_PACKAGE_ID as string | undefined;

// Stork Price Feed IDs (32-byte hex strings)
export const STORK_FEED_IDS = {
    BTCUSD: '0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de',
    ETHUSD: '0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160',
    SOLUSD: '0x1dcd89dfded9e8a9b0fa1745a8ebbacbb7c81e33d5abc81616633206d932e837',
    SUIUSD: '0xa24cc95a4f3d70a0a2f7ac652b67a4a73791631ff06b4ee7f729097311169b81',
} as const;

// Human-readable feed names
export const FEED_NAMES: Record<string, string> = {
    [STORK_FEED_IDS.BTCUSD]: 'BTC/USD',
    [STORK_FEED_IDS.ETHUSD]: 'ETH/USD',
    [STORK_FEED_IDS.SOLUSD]: 'SOL/USD',
    [STORK_FEED_IDS.SUIUSD]: 'SUI/USD',
};

// Event Types (matching contract)
export enum EventType {
    CRYPTO = 0,
    MANUAL = 1,
}

// Contract module paths
export const getModulePath = (module: string, func: string) => {
    if (!PACKAGE_ID) throw new Error('PACKAGE_ID not configured');
    return `${PACKAGE_ID}::${module}::${func}`;
};

// Module names
export const MODULES = {
    CONFIG: 'blink_config',
    EVENT: 'blink_event',
    POSITION: 'blink_position',
} as const;

// Function targets (with type arguments where needed)
export const FUNCTIONS = {
    // blink_position functions (all require CoinType)
    PLACE_BET: () => getModulePath(MODULES.POSITION, 'place_bet'),
    CANCEL_BET: () => getModulePath(MODULES.POSITION, 'cancel_bet'),
    CLAIM_WINNINGS: () => getModulePath(MODULES.POSITION, 'claim_winnings'),
    CLAIM_REFUND: () => getModulePath(MODULES.POSITION, 'claim_refund'),

    // blink_event functions
    CREATE_MANUAL_EVENT: () => getModulePath(MODULES.EVENT, 'create_manual_event'),
    CREATE_CRYPTO_EVENT: () => getModulePath(MODULES.EVENT, 'create_crypto_event'),
    OPEN_EVENT: () => getModulePath(MODULES.EVENT, 'open_event'),
    LOCK_EVENT: () => getModulePath(MODULES.EVENT, 'lock_event'),
    RESOLVE_MANUAL_EVENT: () => getModulePath(MODULES.EVENT, 'resolve_manual_event'),
    RESOLVE_CRYPTO_EVENT: () => getModulePath(MODULES.EVENT, 'resolve_crypto_event'),
    CANCEL_EVENT: () => getModulePath(MODULES.EVENT, 'cancel_event'),

    // View functions
    GET_ODDS: () => getModulePath(MODULES.EVENT, 'get_odds'),
    GET_TOTAL_POOL: () => getModulePath(MODULES.EVENT, 'get_total_pool'),
    CALCULATE_POTENTIAL_PAYOUT: () => getModulePath(MODULES.EVENT, 'calculate_potential_payout'),
    IS_BETTING_OPEN: () => getModulePath(MODULES.EVENT, 'is_betting_open'),
    GET_EVENT_TYPE: () => getModulePath(MODULES.EVENT, 'get_event_type'),
    GET_ORACLE_FEED_ID: () => getModulePath(MODULES.EVENT, 'get_oracle_feed_id'),
    GET_TARGET_PRICE: () => getModulePath(MODULES.EVENT, 'get_target_price'),
    GET_ORACLE_PRICE_AT_RESOLUTION: () => getModulePath(MODULES.EVENT, 'get_oracle_price_at_resolution'),

    // blink_config functions
    GET_MARKET_MIN_STAKE: () => getModulePath(MODULES.CONFIG, 'get_market_min_stake'),
    GET_MARKET_MAX_STAKE: () => getModulePath(MODULES.CONFIG, 'get_market_max_stake'),
    GET_MARKET_FEE_BPS: () => getModulePath(MODULES.CONFIG, 'get_market_fee_bps'),
    IS_MARKET_ACTIVE: () => getModulePath(MODULES.CONFIG, 'is_market_active'),
    IS_ORACLE: () => getModulePath(MODULES.CONFIG, 'is_oracle'),
    ADD_ORACLE: () => getModulePath(MODULES.CONFIG, 'add_oracle'),
    CREATE_TREASURY: () => getModulePath(MODULES.CONFIG, 'create_treasury'),
    WITHDRAW_FEES: () => getModulePath(MODULES.CONFIG, 'withdraw_fees'),
} as const;

// Check if contract is configured
export const isContractConfigured = () => {
    return Boolean(PACKAGE_ID && MARKET_ID && TREASURY_ID);
};

// Check if Stork Oracle is configured
export const isStorkConfigured = () => {
    return Boolean(STORK_STATE && STORK_PACKAGE_ID);
};

// Error codes from the contract
export const ERROR_CODES = {
    // Authorization errors
    ENotAuthorized: 0,
    ENotOracle: 1,

    // State errors
    EMarketNotActive: 100,
    EEventNotOpen: 101,
    EEventNotResolved: 103,
    EEventNotCancelled: 104,
    EPositionAlreadyClaimed: 105,
    ENotWinningOutcome: 106,
    EPositionNotAuthorized: 107,

    // Validation errors
    EInvalidOutcome: 200,
    EStakeTooLow: 202,
    EStakeTooHigh: 203,
    ETooFewOutcomes: 205,
    ETooManyOutcomes: 206,
    EEventMismatch: 207,
    ENotCryptoEvent: 208,
    ENotManualEvent: 209,
    EInvalidFeedId: 210,
    ETargetPriceZero: 211,
    ENegativeOraclePrice: 212,

    // Timing errors
    EBettingNotStarted: 300,
    EBettingClosed: 301,
    EEventAlreadyLocked: 302,
} as const;

// Error messages
export const ERROR_MESSAGES: Record<number, string> = {
    [ERROR_CODES.ENotAuthorized]: 'You are not authorized to perform this action',
    [ERROR_CODES.ENotOracle]: 'Caller is not an authorized oracle',
    [ERROR_CODES.EMarketNotActive]: 'This market is not active',
    [ERROR_CODES.EEventNotOpen]: 'This event is not open for betting',
    [ERROR_CODES.EEventNotResolved]: 'This event has not been resolved yet',
    [ERROR_CODES.EEventNotCancelled]: 'This event was not cancelled',
    [ERROR_CODES.EPositionAlreadyClaimed]: 'You have already claimed this position',
    [ERROR_CODES.ENotWinningOutcome]: 'Your position is not on the winning outcome',
    [ERROR_CODES.EPositionNotAuthorized]: "You don't own this position",
    [ERROR_CODES.EInvalidOutcome]: 'Invalid outcome index',
    [ERROR_CODES.EStakeTooLow]: 'Stake amount is below the minimum',
    [ERROR_CODES.EStakeTooHigh]: 'Stake amount exceeds the maximum',
    [ERROR_CODES.ETooFewOutcomes]: 'Event must have at least 2 outcomes',
    [ERROR_CODES.ETooManyOutcomes]: 'Event cannot have more than 10 outcomes',
    [ERROR_CODES.EEventMismatch]: 'Event/Market/Position ID mismatch',
    [ERROR_CODES.ENotCryptoEvent]: 'This is not a crypto event',
    [ERROR_CODES.ENotManualEvent]: 'This is not a manual event',
    [ERROR_CODES.EInvalidFeedId]: 'Feed ID must be 32 bytes',
    [ERROR_CODES.ETargetPriceZero]: 'Target price cannot be zero',
    [ERROR_CODES.ENegativeOraclePrice]: 'Oracle returned a negative price',
    [ERROR_CODES.EBettingNotStarted]: 'Betting window has not started yet',
    [ERROR_CODES.EBettingClosed]: 'Betting window has closed',
    [ERROR_CODES.EEventAlreadyLocked]: 'Cannot cancel bet after event is locked',
};

// Get user-friendly error message from error code
export const getErrorMessage = (errorCode: number): string => {
    return ERROR_MESSAGES[errorCode] || `Unknown error (code: ${errorCode})`;
};

// Parse error code from transaction error string
export const parseErrorCode = (errorString: string): number | null => {
    const match = errorString.match(/MoveAbort.*?(\d+)/);
    return match ? parseInt(match[1], 10) : null;
};

// Price formatting utilities for crypto events (Stork uses 18 decimals)
export const formatPriceForContract = (humanPrice: number): string => {
    const scaled = BigInt(Math.floor(humanPrice * 1e18));
    return scaled.toString();
};

export const formatPriceFromContract = (contractPrice: string | bigint): number => {
    const scaled = typeof contractPrice === 'string' ? BigInt(contractPrice) : contractPrice;
    return Number(scaled) / 1e18;
};

// Convert feed ID hex string to bytes array for contract calls
export const feedIdToBytes = (feedId: string): number[] => {
    const hex = feedId.startsWith('0x') ? feedId.slice(2) : feedId;
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
};
