// Contract configuration and constants for blink_market package
// See contract-api-reference.md for full API documentation

export const MIST_PER_SUI = 1_000_000_000n;

// ============================================================================
// Environment Configuration
// ============================================================================
// Set these in your .env file:
//
// VITE_BLINK_PACKAGE_ID - The blink_market package object ID
// VITE_BLINK_CLEARINGHOUSE_ID - The shared Clearinghouse<CoinType> object ID
// VITE_BLINK_COIN_TYPE - The coin type (e.g., "0x2::sui::SUI" or USDC)
//

export const PACKAGE_ID = import.meta.env.VITE_BLINK_PACKAGE_ID as string | undefined;
export const CLEARINGHOUSE_ID = import.meta.env.VITE_BLINK_CLEARINGHOUSE_ID as string | undefined;
export const COIN_TYPE = import.meta.env.VITE_BLINK_COIN_TYPE as string | undefined;

// Legacy export - use MARKET_ID or CLEARINGHOUSE_ID instead
/** @deprecated Use CLEARINGHOUSE_ID or MARKET_ID instead */
export const EVENT_ID = import.meta.env.VITE_BLINK_EVENT_ID as string | undefined;
// Legacy export - use CLEARINGHOUSE_ID instead
/** @deprecated Use CLEARINGHOUSE_ID instead */
export const TREASURY_ID = import.meta.env.VITE_BLINK_TREASURY_ID as string | undefined;

// Optional: Set specific market ID for single-market deployments
// Otherwise markets are fetched/created dynamically
export const MARKET_ID = import.meta.env.VITE_BLINK_MARKET_ID as string | undefined;

// ============================================================================
// Sui System Objects
// ============================================================================

export const CLOCK_OBJECT_ID = "0x6"; // Sui system clock

// ============================================================================
// Module Paths
// ============================================================================

const getModulePath = (module: string, func: string) => {
    if (!PACKAGE_ID) throw new Error("PACKAGE_ID not configured");
    return `${PACKAGE_ID}::${module}::${func}`;
};

export const MODULES = {
    RFQ: "rfq",
    MARKET: "market",
    CLEARINGHOUSE: "clearinghouse",
} as const;

// ============================================================================
// Function Targets (User-Facing)
// ============================================================================

export const FUNCTIONS = {
    // RFQ - Place a trade (replaces old place_bet)
    EXECUTE_RFQ: () => getModulePath(MODULES.RFQ, "execute_rfq"),

    // Market - Redeem winnings (replaces old claim_winnings/claim_refund)
    REDEEM_POSITION: () => getModulePath(MODULES.MARKET, "redeem_position"),
} as const;

// ============================================================================
// Read/View Functions
// ============================================================================

export const VIEW_FUNCTIONS = {
    // Market view functions
    MARKET_IS_RESOLVED: () => getModulePath(MODULES.MARKET, "is_resolved"),
    MARKET_WINNING_SIDE: () => getModulePath(MODULES.MARKET, "winning_side"),
    MARKET_POOL_BALANCE: () => getModulePath(MODULES.MARKET, "pool_balance"),
    MARKET_GET_ID: () => getModulePath(MODULES.MARKET, "get_market_id"),

    // Position view functions
    POSITION_SIDE: () => getModulePath(MODULES.MARKET, "position_side"),
    POSITION_SIZE: () => getModulePath(MODULES.MARKET, "position_size"),
    POSITION_MARKET_ID: () => getModulePath(MODULES.MARKET, "position_market_id"),

    // Clearinghouse view functions - use with PMM address as parameter
    CLEARINGHOUSE_GET_BALANCE: () => getModulePath(MODULES.CLEARINGHOUSE, "get_balance"),
    CLEARINGHOUSE_TREASURY: () => getModulePath(MODULES.CLEARINGHOUSE, "get_treasury_balance"),
    CLEARINGHOUSE_GET_LAST_SEQ: () => getModulePath(MODULES.CLEARINGHOUSE, "get_last_seq"),
} as const;

// ============================================================================
// Configuration Check
// ============================================================================

export const isContractConfigured = (): boolean => {
    return Boolean(PACKAGE_ID && CLEARINGHOUSE_ID && COIN_TYPE);
};

// ============================================================================
// Constants
// ============================================================================

export const SIDE = {
    YES: 0,
    NO: 1,
} as const;

export type Side = (typeof SIDE)[keyof typeof SIDE];

// Basis points denominator
export const BPS_DENOMINATOR = 10000n;

// Platform fee: 0.10% (10 bps)
export const PLATFORM_FEE_BPS = 10n;

// Gas reserve for transactions
export const GAS_RESERVE_MIST = 50_000_000n; // 0.05 SUI

// Default PMM address (configurable per deployment)
export const DEFAULT_PMM = import.meta.env.VITE_BLINK_PMM_ADDRESS as string | undefined;

// ============================================================================
// Error Codes (from contract)
// ============================================================================

// Error codes are scoped by module to avoid collisions
// rfq.move errors
export const RFQ_ERROR_CODES = {
    EQuoteExpired: 100,
    EInvalidSignature: 200,
    EInvalidUserAmount: 201,
    EPubkeyAddressMismatch: 202,
} as const;

// market.move errors
export const MARKET_ERROR_CODES = {
    EMarketAlreadyResolved: 0,
    EMarketNotResolved: 1,
    EWrongSide: 2,
    EInsufficientPool: 3,
} as const;

// clearinghouse.move errors
export const CLEARINGHOUSE_ERROR_CODES = {
    EInsufficientPMMBalance: 0,
    EInvalidSequenceNumber: 1,
} as const;

// Combined ERROR_CODES for backward compatibility - use specific codes above
export const ERROR_CODES = {
    // rfq.move errors (100s)
    EQuoteExpired: RFQ_ERROR_CODES.EQuoteExpired,
    EInvalidSignature: RFQ_ERROR_CODES.EInvalidSignature,
    EInvalidUserAmount: RFQ_ERROR_CODES.EInvalidUserAmount,
    EPubkeyAddressMismatch: RFQ_ERROR_CODES.EPubkeyAddressMismatch,

    // market.move errors (0, 1, 2, 3)
    EMarketAlreadyResolved: MARKET_ERROR_CODES.EMarketAlreadyResolved,
    EMarketNotResolved: MARKET_ERROR_CODES.EMarketNotResolved,
    EWrongSide: MARKET_ERROR_CODES.EWrongSide,
    EInsufficientPool: MARKET_ERROR_CODES.EInsufficientPool,

    // clearinghouse.move errors - using prefixed keys to avoid collision
    EInsufficientPMMBalance: 1000, // distinct from market error
    EInvalidSequenceNumber: 1001, // distinct from market error
} as const;

// User-friendly error messages mapping
export const ERROR_MESSAGES: Record<number, string> = {
    // rfq.move errors
    [ERROR_CODES.EQuoteExpired]: "This quote has expired. Please request a new quote.",
    [ERROR_CODES.EInvalidSignature]:
        "Quote signature is invalid. Please contact support.",
    [ERROR_CODES.EInvalidUserAmount]:
        "Payment amount does not match the quoted price. Please refresh.",
    [ERROR_CODES.EPubkeyAddressMismatch]:
        "PMM key/address mismatch. Please contact support.",

    // market.move errors
    [ERROR_CODES.EMarketAlreadyResolved]:
        "This market has already been resolved.",
    [ERROR_CODES.EMarketNotResolved]: "This market has not been resolved yet.",
    [ERROR_CODES.EWrongSide]:
        "This position is on the losing side and cannot be redeemed.",
    [ERROR_CODES.EInsufficientPool]:
        "Insufficient pool balance. Please contact support.",

    // clearinghouse.move errors
    [ERROR_CODES.EInsufficientPMMBalance]:
        "The market maker has insufficient balance. Please try again later.",
    [ERROR_CODES.EInvalidSequenceNumber]:
        "Quote sequence number is invalid. Please request a new quote.",
};

// Get user-friendly error message from error code
export const getErrorMessage = (errorCode: number): string => {
    return ERROR_MESSAGES[errorCode] || `Unknown error (code: ${errorCode})`;
};

// ============================================================================
// Fee Calculation
// ============================================================================

/**
 * Computes the total amount user must pay for a trade.
 *
 * Formula:
 *   user_base_cost = floor(size × price_bps / 10000)
 *   platform_fee   = floor(user_base_cost × 10 / 10000)  // 0.10%
 *   user_total_pay = user_base_cost + platform_fee
 *
 * @param size - Total notional in base units (e.g., USDC cents)
 * @param priceBps - PMM's quoted probability in basis points (0-10000)
 * @returns Total amount user must pay in base units
 */
export const computeUserTotalPay = (size: bigint, priceBps: bigint): bigint => {
    const userBaseCost = (size * priceBps) / BPS_DENOMINATOR;
    const platformFee = (userBaseCost * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
    return userBaseCost + platformFee;
};

/**
 * Computes only the platform fee portion.
 */
export const computePlatformFee = (size: bigint, priceBps: bigint): bigint => {
    const userBaseCost = (size * priceBps) / BPS_DENOMINATOR;
    return (userBaseCost * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
};

/**
 * Computes the base cost without platform fee.
 */
export const computeBaseCost = (size: bigint, priceBps: bigint): bigint => {
    return (size * priceBps) / BPS_DENOMINATOR;
};

// ============================================================================
// Legacy / Deprecated Exports (for backward compatibility during migration)
// ============================================================================

// Legacy event status enum (for old contract compatibility)
export enum EventStatus {
    CREATED = 0,
    OPEN = 1,
    LOCKED = 2,
    RESOLVED = 3,
    CANCELLED = 4,
}

// Legacy error codes (old contract)
export const LEGACY_ERROR_CODES = {
    ENotAuthorized: 0,
    EMarketNotActive: 100,
    EEventNotOpen: 101,
    EEventNotResolved: 103,
    EEventNotCancelled: 104,
    EPositionAlreadyClaimed: 105,
    ENotWinningOutcome: 106,
    EInvalidOutcome: 200,
    EStakeTooLow: 202,
    EStakeTooHigh: 203,
} as const;
