# Blink Market Contract Migration Reference

> This document tracks the changes made to migrate from the old contract (`blink_position` / `blink_event`) to the new `blink_market` package. Keep this as a reference.

---

## Environment Variables

Add these to your `.env` file:

```bash
# Required
VITE_BLINK_PACKAGE_ID=            # The blink_market package object ID
VITE_BLINK_CLEARINGHOUSE_ID=      # The shared Clearinghouse<CoinType> object ID
VITE_BLINK_COIN_TYPE=             # Coin type (e.g., "0x2::sui::SUI" or USDC address)

# Optional (defaults provided)
VITE_BLINK_MARKET_ID=             # For single-market deployments
VITE_BLINK_PMM_ADDRESS=           # Default PMM address

# Deprecated (remove if present)
# VITE_BLINK_TREASURY_ID - Replaced by CLEARINGHOUSE_ID
# VITE_BLINK_EVENT_ID - Replaced by MARKET creation
```

---

## Key Differences: Old vs New Contract

| Aspect | Old Contract | New Contract |
|--------|--------------|--------------|
| **Package** | `blink_*` (multiple packages) | `blink_market` (single package) |
| **Market Type** | Multi-outcome (2-10 options) | Binary (YES/NO only) |
| **Pricing** | Fixed odds / pool-based | PMM quotes via RFQ |
| **Trade Flow** | Direct `place_bet` | `execute_rfq` with Ed25519 sig |
| **Position** | `stake_amount`, `outcome_index` | `size`, `side` (0=YES, 1=NO) |
| **Claims** | `claim_winnings` / `claim_refund` | `redeem_position` |
| **PMM** | Not involved | Required for quotes |

---

## Updated Files

### 1. `src/lib/constants.ts`

**Changes:**
- Replaced old modules (`blink_position`, `blink_event`, `blink_config`) with new (`rfq`, `market`, `clearinghouse`)
- Added `CLEARINGHOUSE_ID`, `COIN_TYPE`, `DEFAULT_PMM`
- Removed `TREASURY_ID`, `EVENT_ID`
- New constants: `SIDE.YES = 0`, `SIDE.NO = 1`, `PLATFORM_FEE_BPS = 10`
- New functions: `computeUserTotalPay()`, `computePlatformFee()`, `computeBaseCost()`
- New error codes matching contract

**Key Exports:**
```typescript
export const PACKAGE_ID;
export const CLEARINGHOUSE_ID;
export const COIN_TYPE;
export const MARKET_ID;           // Optional, per-market
export const SIDE = { YES: 0, NO: 1 };
export const FUNCTIONS = {
    EXECUTE_RFQ: () => string,
    REDEEM_POSITION: () => string,
};
export const computeUserTotalPay(size: bigint, priceBps: bigint): bigint;
export const getErrorMessage(errorCode: number): string;
```

---

### 2. `src/types/contractTypes.ts`

**Changes:**
- New types: `TradeQuote`, `ExecuteRfqParams`, `RedeemPositionParams`
- New event types: `TradeExecutedEvent`, `PositionRedeemedEvent`, `MarketCreatedEvent`, etc.
- Updated `ParsedPosition` structure (no more `eventId`, `outcomeIndex`, `stakeAmount`)
- New helper: `canRedeemPosition()`, `sideLabel()`

**Key Types:**
```typescript
export type Side = 0 | 1;

export interface TradeQuote {
    marketId: string;
    side: Side;
    priceBps: bigint;
    size: bigint;
    seqNumber: bigint;
    expiresAt: bigint;
    pmm: string;
    pmmPubkey: Uint8Array;  // 32 bytes
    signature: Uint8Array;  // 64 bytes
}

export interface ParsedPosition {
    id: string;
    marketId: string;
    side: Side;
    size: bigint;
}

export interface PositionWithMarket {
    position: ParsedPosition;
    market: ParsedMarket | null;
    canRedeem: boolean;
    payout: bigint | null;
}
```

---

### 3. `src/hooks/useExecuteRfq.ts` (NEW)

Replaces the old `place_bet` flow in `App.tsx`.

**Flow:**
1. Receive `TradeQuote` from your PMM backend
2. Validate market isn't resolved, quote isn't expired
3. Validate coin object holds exactly `user_total_pay`
4. Build `execute_rfq` transaction
5. Execute → receives `Position` NFT

```typescript
const { execute, isLoading, error } = useExecuteRfq({
    onSuccess: (position, positionId) => { ... },
    onError: (error) => { ... },
});

// Usage:
await execute({
    quote: pmmQuoteFromBackend,
    coinObjectId: selectedCoinObjectId,
});
```

---

### 4. `src/hooks/useClaims.ts` → `useRedeemPosition.ts` (REWRITTEN)

Replaces `claimWinnings` / `claimRefund` with single `redeem` function.

```typescript
const { redeem, isLoading, error } = useRedeemPosition({
    onSuccess: (payout) => { ... },
});

// Usage:
await redeem({
    marketId: "0x...",
    positionId: "0x...",
});
```

---

### 5. `src/hooks/usePositions.ts` (UPDATED)

- Now fetches `Position<CoinType>` from `blink_market::market` module
- Enriches positions with market state
- Returns `positionsWithMarket` with `canRedeem` and `payout` fields

```typescript
const { positionsWithMarket, redeemablePositions, markets } = usePositions();
```

---

## Trade Lifecycle (New Contract)

```
1. User selects market/size → Request quote from PMM backend
                                        ↓
2. PMM returns: side, price_bps, size, seq_number, expires_at, pmm, pmm_pubkey, signature
                                        ↓
3. Frontend computes user_total_pay = floor(size × price_bps / 10000) + fee
                                        ↓
4. Frontend gets user's coin object with exact user_total_pay amount
                                        ↓
5. Frontend calls execute_rfq → Position NFT arrives in user's wallet
                                        ↓
6. (Wait for MarketResolvedEvent)
                                        ↓
7. If position.side == winning_side:
     Frontend calls redeem_position → CoinType arrives in user's wallet
   Else:
     Position is worthless
```

---

## PMM Backend Integration

Your backend must implement:

### Quote Endpoint

Receives: `{ marketId, side, size, userAddress }`

Returns:
```typescript
{
    marketId: string,
    side: 0 | 1,
    priceBps: bigint,      // e.g., 6000 = 60%
    size: bigint,          // Total notional
    seqNumber: bigint,     // Monotonically increasing
    expiresAt: bigint,     // Unix ms
    pmm: string,           // PMM's Sui address
    pmmPubkey: Uint8Array, // 32-byte Ed25519
    signature: Uint8Array, // 64-byte Ed25519
}
```

### Signature Message Format (for PMM to sign)

The PMM must sign a 97-byte canonical message:
| Field | Size |
|-------|------|
| market_id | 32 bytes |
| side | 1 byte |
| price_bps | 8 bytes (LE) |
| size | 8 bytes (LE) |
| seq_number | 8 bytes (LE) |
| expires_at | 8 bytes (LE) |
| pmm | 32 bytes |

---

## Removed / Deprecated

From `App.tsx` (remove or adapt):
- `Oracle Registration` button (old `blink_config::add_oracle`)
- `Open Event` / `Lock Event` / `Resolve Event` (old lifecycle — new uses `create_market` / `resolve_market` with AdminCap)
- Old `place_bet` transaction builder (replaced by `useExecuteRfq`)

From `constants.ts` (removed):
- `MODULES.EVENT`, `MODULES.CONFIG` (replaced by new modules)
- `FUNCTIONS.PLACE_BET`, `FUNCTIONS.CLAIM_WINNINGS`, etc.

---

## Error Handling

All contract errors return user-friendly messages via `getErrorMessage(errorCode)`:

| Code | Message |
|------|---------|
| 100 | "This quote has expired. Please request a new quote." |
| 200 | "Quote signature is invalid. Please contact support." |
| 201 | "Payment amount does not match the quoted price. Please refresh." |
| 202 | "PMM key/address mismatch. Please contact support." |
| 0 (market) | "This market has already been resolved." |
| 1 (market) | "This market has not been resolved yet." |
| 2 (market) | "This position is on the losing side and cannot be redeemed." |
| 3 (market) | "Insufficient pool balance. Please contact support." |
| 0 (ch) | "The market maker has insufficient balance. Please try again later." |
| 1 (ch) | "Quote sequence number is invalid. Please request a new quote." |

---

## Testing Checklist

- [ ] Set environment variables in `.env`
- [ ] PMM backend is running and returning quotes
- [ ] Wallet can execute `execute_rfq` and receive Position
- [ ] Positions appear in "Your Positions" panel
- [ ] Market resolution updates position status correctly
- [ ] Redeem flow works for winning positions
- [ ] Error messages display correctly for all error codes
