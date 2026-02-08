// Contract configuration and constants

export const MIST_PER_SUI = 1_000_000_000n;

// Contract addresses from environment variables
export const PACKAGE_ID = import.meta.env.VITE_BLINK_PACKAGE_ID as string | undefined;
export const MARKET_ID = import.meta.env.VITE_BLINK_MARKET_ID as string | undefined;
export const TREASURY_ID = import.meta.env.VITE_BLINK_TREASURY_ID as string | undefined;
export const EVENT_ID = import.meta.env.VITE_BLINK_EVENT_ID as string | undefined;

// Sui system objects
export const CLOCK_OBJECT_ID = '0x6';

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

// Function targets
export const FUNCTIONS = {
    // blink_position functions
    PLACE_BET: () => getModulePath(MODULES.POSITION, 'place_bet'),
    CANCEL_BET: () => getModulePath(MODULES.POSITION, 'cancel_bet'),
    CLAIM_WINNINGS: () => getModulePath(MODULES.POSITION, 'claim_winnings'),
    CLAIM_REFUND: () => getModulePath(MODULES.POSITION, 'claim_refund'),

    // blink_event functions
    CREATE_EVENT: () => getModulePath(MODULES.EVENT, 'create_event'),
    OPEN_EVENT: () => getModulePath(MODULES.EVENT, 'open_event'),
    LOCK_EVENT: () => getModulePath(MODULES.EVENT, 'lock_event'),
    RESOLVE_EVENT: () => getModulePath(MODULES.EVENT, 'resolve_event'),
    CANCEL_EVENT: () => getModulePath(MODULES.EVENT, 'cancel_event'),

    // blink_config functions
    WITHDRAW_FEES: () => getModulePath(MODULES.CONFIG, 'withdraw_fees'),
} as const;

// Check if contract is configured
export const isContractConfigured = () => {
    return Boolean(PACKAGE_ID && MARKET_ID && TREASURY_ID && EVENT_ID);
};

// Error codes from the contract
export const ERROR_CODES = {
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
    ETooFewOutcomes: 205,
    ETooManyOutcomes: 206,
    EEventMismatch: 207,
    EBettingNotStarted: 300,
    EBettingClosed: 301,
    EEventAlreadyLocked: 302,
} as const;

// Error messages
export const ERROR_MESSAGES: Record<number, string> = {
    [ERROR_CODES.ENotAuthorized]: 'You are not authorized to perform this action',
    [ERROR_CODES.EMarketNotActive]: 'This market is not active',
    [ERROR_CODES.EEventNotOpen]: 'This event is not open for betting',
    [ERROR_CODES.EEventNotResolved]: 'This event has not been resolved yet',
    [ERROR_CODES.EEventNotCancelled]: 'This event was not cancelled',
    [ERROR_CODES.EPositionAlreadyClaimed]: 'You have already claimed this position',
    [ERROR_CODES.ENotWinningOutcome]: 'Your position is not on the winning outcome',
    [ERROR_CODES.EInvalidOutcome]: 'Invalid outcome index',
    [ERROR_CODES.EStakeTooLow]: 'Stake amount is below the minimum',
    [ERROR_CODES.EStakeTooHigh]: 'Stake amount exceeds the maximum',
    [ERROR_CODES.ETooFewOutcomes]: 'Event must have at least 2 outcomes',
    [ERROR_CODES.ETooManyOutcomes]: 'Event cannot have more than 10 outcomes',
    [ERROR_CODES.EEventMismatch]: 'Event/Market/Position ID mismatch',
    [ERROR_CODES.EBettingNotStarted]: 'Betting window has not started yet',
    [ERROR_CODES.EBettingClosed]: 'Betting window has closed',
    [ERROR_CODES.EEventAlreadyLocked]: 'Cannot cancel bet after event is locked',
};

// Get user-friendly error message from error code
export const getErrorMessage = (errorCode: number): string => {
    return ERROR_MESSAGES[errorCode] || `Unknown error (code: ${errorCode})`;
};
