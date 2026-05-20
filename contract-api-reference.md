# Blink Market — Contract API Reference

> **Audience:** Frontend engineers integrating with the Blink Market smart contracts on Sui.  
> **Network:** Sui (Move 2024)  
> **Package:** `blink_market`  
> **SDK:** Sui TypeScript SDK (`@mysten/sui`)

---

## Table of Contents

1. [Key Concepts](#key-concepts)
2. [Shared Objects](#shared-objects)
3. [User-Facing Functions](#user-facing-functions)
   - [execute_rfq — Place a Trade](#1-execute_rfq--place-a-trade)
   - [redeem_position — Claim Winnings](#2-redeem_position--claim-winnings)
4. [PMM-Facing Functions](#pmm-facing-functions)
   - [deposit — Fund PMM Account](#1-deposit--fund-pmm-account)
   - [withdraw — Withdraw PMM Funds](#2-withdraw--withdraw-pmm-funds)
5. [Admin-Facing Functions](#admin-facing-functions)
   - [clearinghouse::create — Initialize Clearinghouse](#1-cleringhousecreate--initialize-clearinghouse)
   - [market::create_market — Create a Market](#2-marketcreate_market--create-a-market)
   - [market::resolve_market — Resolve a Market](#3-marketresolve_market--resolve-a-market)
   - [clearinghouse::withdraw_treasury — Withdraw Platform Fees](#4-clearinghousetransfer_treasury--withdraw-platform-fees)
6. [Read / View Functions](#read--view-functions)
7. [On-Chain Events](#on-chain-events)
8. [Error Codes](#error-codes)
9. [Fee Calculation](#fee-calculation)
10. [Data Types & Constants](#data-types--constants)
11. [TypeScript Integration Examples](#typescript-integration-examples)

---

## Key Concepts

### Sides

| Value | Constant  | Meaning                          |
|-------|-----------|----------------------------------|
| `0`   | `SIDE_YES`| YES — event occurred             |
| `1`   | `SIDE_NO` | NO — event did not occur         |

### Coin Units

All amounts (`size`, `price_bps`, fees) are in the coin's **base units** (e.g., USDC uses 6 decimals, so `1_000_000` = 1 USDC). The frontend is responsible for unit conversion before calling contract functions.

### Basis Points (BPS)

`price_bps` is the PMM-quoted probability expressed in basis points:  
- `10000 bps = 100%`
- `5000 bps = 50%`
- `6000 bps = 60%`

### Position Object

A `Position` is an **owned Sui object** (NFT-like) minted to the user's wallet on each successful `execute_rfq` call. It records `market_id`, `side`, and `size`. After market resolution, winning positions are burned via `redeem_position` to claim the payout.

---

## Shared Objects

The frontend must obtain these object IDs from the deployment configuration. They are **shared Sui objects** — all transactions reference them by ID.

| Object | Type | Description |
|--------|------|-------------|
| `Clearinghouse<CoinType>` | Shared | PMM balance registry + fee treasury. One per deployment. |
| `Market<CoinType>` | Shared | Binary prediction market pool. One per event. |
| `Clock` | Shared (system) | Sui system clock. Object ID: `0x6` |

---

## User-Facing Functions

### 1. `execute_rfq` — Place a Trade

**Module:** `blink_market::rfq`

Executes a quote received from the PMM. Verifies the PMM's Ed25519 signature, routes funds, and mints a `Position` object to the caller's wallet.

**Who calls it:** End users (retail traders)

#### Function Signature

```move
public fun execute_rfq<CoinType>(
    clearinghouse: &mut Clearinghouse<CoinType>,  // Shared object, mutable
    market:        &mut Market<CoinType>,          // Shared object, mutable
    user_coin:     coin::Coin<CoinType>,           // Exact payment amount
    side:          u8,                             // 0 = YES, 1 = NO
    price_bps:     u64,                            // PMM's quoted probability (bps)
    size:          u64,                            // Total notional in base units
    seq_number:    u64,                            // Monotonic nonce from PMM
    expires_at:    u64,                            // Unix timestamp in milliseconds
    pmm:           address,                        // PMM's on-chain address
    pmm_pubkey:    vector<u8>,                     // PMM's Ed25519 public key (32 bytes)
    signature:     vector<u8>,                     // Ed25519 signature (64 bytes)
    clock:         &Clock,                         // Sui system clock (0x6)
    ctx:           &mut TxContext,
)
```

#### Parameters

| Parameter | Type | Source | Notes |
|-----------|------|--------|-------|
| `clearinghouse` | `&mut Clearinghouse<CoinType>` | Deployment config | Shared object ID |
| `market` | `&mut Market<CoinType>` | Backend / market listing | Shared object ID |
| `user_coin` | `Coin<CoinType>` | User's wallet | Must equal **exactly** `user_total_pay` — see [Fee Calculation](#fee-calculation) |
| `side` | `u8` | PMM quote response | `0` = YES, `1` = NO |
| `price_bps` | `u64` | PMM quote response | e.g., `6000` for 60% |
| `size` | `u64` | PMM quote response | Total notional in base units |
| `seq_number` | `u64` | PMM quote response | Must be strictly increasing per PMM |
| `expires_at` | `u64` | PMM quote response | Unix timestamp in **milliseconds** |
| `pmm` | `address` | PMM quote response | PMM's Sui address |
| `pmm_pubkey` | `vector<u8>` | PMM quote response | 32-byte Ed25519 public key |
| `signature` | `vector<u8>` | PMM quote response | 64-byte Ed25519 signature |
| `clock` | `&Clock` | Constant | Always `0x6` |

#### What It Does

1. Checks `clock_ms < expires_at` (rejects expired quotes)
2. Checks market is not yet resolved
3. Validates `seq_number` is strictly greater than the PMM's last accepted nonce
4. Verifies Ed25519 signature over the canonical message (see [Ed25519 Message Format](#ed25519-message-format))
5. Checks `coin::value(user_coin) == user_total_pay`
6. Splits platform fee from payment → sends to treasury
7. Deducts `pmm_cost` from PMM's clearinghouse balance
8. Deposits `size` total into market pool
9. Mints a `Position<CoinType>` object → transfers to caller's wallet
10. Emits `TradeExecutedEvent`

#### Returns

Nothing directly — the `Position` object is **transferred to `ctx.sender()`** (the user's wallet).

#### Errors

| Code | Name | Cause |
|------|------|-------|
| `100` | `EQuoteExpired` | `clock_ms >= expires_at` |
| `200` | `EInvalidSignature` | Ed25519 verification failed |
| `201` | `EInvalidUserAmount` | `coin.value != user_total_pay` |
| `202` | `EPubkeyAddressMismatch` | `pmm_pubkey` does not derive to `pmm` address |
| `0` (market) | `EMarketAlreadyResolved` | Market has been resolved |
| `0` (clearinghouse) | `EInsufficientPMMBalance` | PMM has insufficient balance on-chain |
| `1` (clearinghouse) | `EInvalidSequenceNumber` | `seq_number <= last accepted seq` |

---

### 2. `redeem_position` — Claim Winnings

**Module:** `blink_market::market`

Burns a winning `Position` and transfers the payout (`size` in `CoinType`) to the caller.

**Who calls it:** End users (after market resolution)

#### Function Signature

```move
public fun redeem_position<CoinType>(
    market:   &mut Market<CoinType>,   // Shared object, mutable
    position: Position<CoinType>,      // User's owned Position object
    ctx:      &mut TxContext,
)
```

#### Parameters

| Parameter | Type | Notes |
|-----------|------|-------|
| `market` | `&mut Market<CoinType>` | Must be the market that issued the position |
| `position` | `Position<CoinType>` | User's owned object — consumed (burned) by this call |

#### What It Does

1. Checks market is resolved (`is_resolved == true`)
2. Checks `position.side == market.winning_side`
3. Checks `pool_balance >= position.size`
4. Burns the `Position` object
5. Transfers `position.size` in `CoinType` from pool to caller
6. Emits `PositionRedeemedEvent`

#### Returns

Nothing directly — `position.size` units of `CoinType` are **transferred to `ctx.sender()`**.

#### Errors

| Code | Name | Cause |
|------|------|-------|
| `1` | `EMarketNotResolved` | Market outcome not yet set |
| `2` | `EWrongSide` | Position is on the losing side |
| `3` | `EInsufficientPool` | Pool funds insufficient (should never happen if math is correct) |

---

## PMM-Facing Functions

These are called by the PMM's backend service, not by end users. Documented here for completeness if the frontend provides a PMM management dashboard.

### 1. `deposit` — Fund PMM Account

**Module:** `blink_market::clearinghouse`

PMM deposits `CoinType` to their clearinghouse account to back future trades.

#### Function Signature

```move
public fun deposit<CoinType>(
    ch:   &mut Clearinghouse<CoinType>,
    coin: Coin<CoinType>,
    ctx:  &TxContext,
)
```

- The PMM's address is inferred from `ctx.sender()`.
- Creates a new account if this is the PMM's first deposit.
- Emits `DepositEvent`.

---

### 2. `withdraw` — Withdraw PMM Funds

**Module:** `blink_market::clearinghouse`

PMM withdraws `amount` from their clearinghouse balance back to their wallet.

#### Function Signature

```move
public fun withdraw<CoinType>(
    ch:     &mut Clearinghouse<CoinType>,
    amount: u64,
    ctx:    &mut TxContext,
)
```

- The PMM's address is inferred from `ctx.sender()`.
- Aborts with `EInsufficientPMMBalance` (code `0`) if balance < amount.
- Emits `WithdrawEvent`.

---

## Admin-Facing Functions

Require the `AdminCap` owned object. These are one-time or infrequent operations performed by the protocol operator.

### 1. `clearinghouse::create` — Initialize Clearinghouse

```move
public fun create<CoinType>(
    _:   &AdminCap,
    ctx: &mut TxContext,
)
```

Creates and shares the `Clearinghouse<CoinType>`. Called **once** post-deployment.

---

### 2. `market::create_market` — Create a Market

```move
public fun create_market<CoinType>(
    _:        &AdminCap,
    event_id: vector<u8>,
    ctx:      &mut TxContext,
)
```

Creates a new binary `Market<CoinType>` shared object.

| Parameter | Type | Notes |
|-----------|------|-------|
| `event_id` | `vector<u8>` | Arbitrary off-chain event identifier bytes (e.g., `b"NBA-2026-LAL-GSW"`) — for indexing only |

Emits `MarketCreatedEvent` with the new `market_id`.

---

### 3. `market::resolve_market` — Resolve a Market

```move
public fun resolve_market<CoinType>(
    _:            &AdminCap,
    market:       &mut Market<CoinType>,
    winning_side: u8,
)
```

Sets the market outcome. Can only be called **once** — aborts if already resolved.

| `winning_side` | Outcome |
|---------------|---------|
| `0` | YES wins |
| `1` | NO wins |

Emits `MarketResolvedEvent`.

---

### 4. `clearinghouse::withdraw_treasury` — Withdraw Platform Fees

```move
public fun withdraw_treasury<CoinType>(
    _:      &AdminCap,
    ch:     &mut Clearinghouse<CoinType>,
    amount: u64,
    ctx:    &mut TxContext,
)
```

Withdraws accumulated platform fees from the treasury to the admin's wallet.

---

## Read / View Functions

These are **read-only** and do not require transaction signing. Use `devInspectTransactionBlock` or read object state directly via Sui RPC.

### Market

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `is_resolved` | `(market: &Market<CoinType>): bool` | `bool` | Whether outcome is set |
| `winning_side` | `(market: &Market<CoinType>): u8` | `u8` | `0` or `1`; only valid if resolved |
| `pool_balance` | `(market: &Market<CoinType>): u64` | `u64` | Current collateral pool in base units |
| `get_market_id` | `(market: &Market<CoinType>): ID` | `ID` | Object ID of the market |

### Position

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `position_side` | `(pos: &Position<CoinType>): u8` | `u8` | Side the position is on (`0` or `1`) |
| `position_size` | `(pos: &Position<CoinType>): u64` | `u64` | Notional payout size in base units |
| `position_market_id` | `(pos: &Position<CoinType>): ID` | `ID` | The market this position belongs to |

### Clearinghouse

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `get_balance` | `(ch: &Clearinghouse<CoinType>, pmm: address): u64` | `u64` | PMM's available balance |
| `get_treasury_balance` | `(ch: &Clearinghouse<CoinType>): u64` | `u64` | Accumulated platform fee balance |
| `get_last_seq` | `(ch: &Clearinghouse<CoinType>, pmm: address): u64` | `u64` | PMM's last accepted sequence number |

---

## On-Chain Events

Subscribe to these via Sui event subscriptions (`suix_subscribeEvent`) or polling (`suix_queryEvents`).  
Filter by `eventType` using the package address and event struct name.

### `DepositEvent`

Emitted when a PMM deposits into the clearinghouse.

```typescript
{
  pmm:    string,  // PMM's Sui address
  amount: string,  // Deposited amount in base units (u64 as string)
}
```

---

### `WithdrawEvent`

Emitted when a PMM withdraws from the clearinghouse.

```typescript
{
  pmm:    string,
  amount: string,
}
```

---

### `MarketCreatedEvent`

Emitted when admin creates a new market.

```typescript
{
  market_id: string,  // New market's object ID
  event_id:  number[], // Off-chain event identifier bytes
}
```

---

### `MarketResolvedEvent`

Emitted when admin resolves a market outcome.

```typescript
{
  market_id:    string,
  winning_side: number,  // 0 = YES, 1 = NO
}
```

---

### `TradeExecutedEvent`

Emitted on every successful `execute_rfq` call. Use this to index user positions off-chain.

```typescript
{
  market_id:   string,
  position_id: string,   // Object ID of the minted Position
  side:        number,   // 0 = YES, 1 = NO
  size:        string,   // Total notional in base units (u64 as string)
  price_bps:   string,   // Quoted probability in basis points
  user:        string,   // User's Sui address
  pmm:         string,   // PMM's Sui address
  seq_number:  string,   // PMM's sequence number for this trade
}
```

---

### `PositionRedeemedEvent`

Emitted when a user redeems a winning position.

```typescript
{
  market_id:   string,
  position_id: string,
  size:        string,  // Payout amount in base units
  user:        string,
}
```

---

## Error Codes

Use these to display user-friendly error messages. On Sui, abort codes appear in the transaction response.

### `rfq.move` errors

| Code | Constant | User-Facing Message Suggestion |
|------|----------|-------------------------------|
| `100` | `EQuoteExpired` | "This quote has expired. Please request a new quote." |
| `200` | `EInvalidSignature` | "Quote signature is invalid. Please contact support." |
| `201` | `EInvalidUserAmount` | "Payment amount does not match the quoted price. Please refresh." |
| `202` | `EPubkeyAddressMismatch` | "PMM key/address mismatch. Please contact support." |

### `market.move` errors

| Code | Constant | User-Facing Message Suggestion |
|------|----------|-------------------------------|
| `0` | `EMarketAlreadyResolved` | "This market has already been resolved." |
| `1` | `EMarketNotResolved` | "This market has not been resolved yet." |
| `2` | `EWrongSide` | "This position is on the losing side and cannot be redeemed." |
| `3` | `EInsufficientPool` | "Insufficient pool balance. Please contact support." |

### `clearinghouse.move` errors

| Code | Constant | User-Facing Message Suggestion |
|------|----------|-------------------------------|
| `0` | `EInsufficientPMMBalance` | "The market maker has insufficient balance. Please try again later." |
| `1` | `EInvalidSequenceNumber` | "Quote sequence number is invalid. Please request a new quote." |

---

## Fee Calculation

The frontend **must** compute `user_total_pay` before calling `execute_rfq`, because `user_coin` must equal exactly this amount.

```
user_base_cost = floor(size × price_bps / 10000)
platform_fee   = floor(user_base_cost × 10 / 10000)   // 0.10% fee
user_total_pay = user_base_cost + platform_fee
```

### TypeScript Helper

```typescript
function computeUserTotalPay(size: bigint, priceBps: bigint): bigint {
  const BPS_DENOMINATOR = 10000n;
  const PLATFORM_FEE_BPS = 10n;

  const userBaseCost = (size * priceBps) / BPS_DENOMINATOR;
  const platformFee  = (userBaseCost * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
  return userBaseCost + platformFee;
}
```

### Example

`size = 100_000_000` (100 USDC, 6 decimals), `price_bps = 6000` (60% YES):

```
user_base_cost = 100_000_000 × 6000 / 10000 = 60_000_000  (60 USDC)
platform_fee   = 60_000_000 × 10 / 10000    =     60_000  (0.06 USDC)
user_total_pay = 60_000_000 + 60_000        = 60_060_000  (60.06 USDC)
```

The user's wallet must hold **≥ 60,060,000 base units** of `CoinType`.

---

## Data Types & Constants

### Side Constants

```typescript
const SIDE_YES = 0;
const SIDE_NO  = 1;
```

### Ed25519 Message Format

The PMM signs exactly this byte sequence (BCS-encoded fields concatenated in order). The frontend does not need to construct this — it is provided by the PMM's backend as `signature`. This is documented here for debugging.

| Field | Type | BCS Size | Notes |
|-------|------|----------|-------|
| `market_id` | `ID` (32-byte array) | 32 bytes | Market object ID |
| `side` | `u8` | 1 byte | |
| `price_bps` | `u64` | 8 bytes little-endian | |
| `size` | `u64` | 8 bytes little-endian | |
| `seq_number` | `u64` | 8 bytes little-endian | |
| `expires_at` | `u64` | 8 bytes little-endian | Unix ms |
| `pmm` | `address` (32-byte array) | 32 bytes | |

**Total message size: 97 bytes**

---

## TypeScript Integration Examples

### Execute RFQ (Place a Trade)

```typescript
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";

async function executeTrade(params: {
  clearinghouseId: string;
  marketId:        string;
  side:            0 | 1;
  priceBps:        bigint;
  size:            bigint;
  seqNumber:       bigint;
  expiresAt:       bigint;
  pmm:             string;
  pmmPubkey:       Uint8Array;   // 32 bytes
  signature:       Uint8Array;   // 64 bytes
  coinObjectId:    string;       // Must hold exactly user_total_pay
  packageId:       string;
  coinType:        string;       // e.g., "0x2::sui::SUI" or USDC type
}) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${params.packageId}::rfq::execute_rfq`,
    typeArguments: [params.coinType],
    arguments: [
      tx.object(params.clearinghouseId),
      tx.object(params.marketId),
      tx.object(params.coinObjectId),
      tx.pure.u8(params.side),
      tx.pure.u64(params.priceBps),
      tx.pure.u64(params.size),
      tx.pure.u64(params.seqNumber),
      tx.pure.u64(params.expiresAt),
      tx.pure.address(params.pmm),
      tx.pure(bcs.vector(bcs.u8()).serialize(params.pmmPubkey)),
      tx.pure(bcs.vector(bcs.u8()).serialize(params.signature)),
      tx.object("0x6"),  // Sui Clock
    ],
  });

  return tx;
}
```

### Redeem Position

```typescript
async function redeemPosition(params: {
  marketId:    string;
  positionId:  string;
  packageId:   string;
  coinType:    string;
}) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${params.packageId}::market::redeem_position`,
    typeArguments: [params.coinType],
    arguments: [
      tx.object(params.marketId),
      tx.object(params.positionId),
    ],
  });

  return tx;
}
```

### Read Market State

```typescript
import { SuiClient } from "@mysten/sui/client";

async function getMarketState(client: SuiClient, marketId: string) {
  const obj = await client.getObject({
    id: marketId,
    options: { showContent: true },
  });

  const fields = (obj.data?.content as any)?.fields;
  return {
    isResolved:   fields.is_resolved as boolean,
    winningSide:  fields.winning_side as number,   // 0 = YES, 1 = NO
    poolBalance:  BigInt(fields.pool.fields.value),
    eventId:      Buffer.from(fields.event_id).toString("utf8"),
  };
}
```

### Query User Positions (via Events)

```typescript
async function getUserPositions(
  client: SuiClient,
  packageId: string,
  userAddress: string,
) {
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::events::TradeExecutedEvent`,
    },
  });

  return events.data
    .filter((e) => (e.parsedJson as any).user === userAddress)
    .map((e) => ({
      positionId: (e.parsedJson as any).position_id,
      marketId:   (e.parsedJson as any).market_id,
      side:       (e.parsedJson as any).side,
      size:       BigInt((e.parsedJson as any).size),
      priceBps:   BigInt((e.parsedJson as any).price_bps),
    }));
}
```

---

## Complete Trade Lifecycle

```
1. User requests quote from PMM backend
        ↓
2. PMM returns: side, price_bps, size, seq_number, expires_at, pmm, pmm_pubkey, signature
        ↓
3. Frontend computes user_total_pay (see Fee Calculation)
        ↓
4. Frontend splits/merges user's coins to get exact user_total_pay amount
        ↓
5. Frontend calls execute_rfq → Position object arrives in user's wallet
        ↓
6. (Wait for MarketResolvedEvent)
        ↓
7. If position.side == winning_side:
     Frontend calls redeem_position → CoinType arrives in user's wallet
   Else:
     Position is worthless (losing side)
```
