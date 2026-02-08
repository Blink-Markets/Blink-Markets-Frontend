/**
 * useContract Hook - Comprehensive Blinkmarket Contract Integration
 * 
 * This hook provides all the functions documented in FRONTEND_API.md for
 * interacting with the Blinkmarket prediction market smart contracts.
 */

import { useCallback } from 'react';
import { useDAppKit, useCurrentAccount } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import {
    FUNCTIONS,
    PACKAGE_ID,
    MARKET_ID,
    TREASURY_ID,
    CLOCK_OBJECT_ID,
    DEFAULT_COIN_TYPE,
    STORK_STATE,
    STORK_PACKAGE_ID,
    feedIdToBytes,
    isContractConfigured,
    isStorkConfigured,
} from '../lib/constants';

const fromBase64 = (value: string) =>
    Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

interface PlaceBetParams {
    eventId: string;
    marketId?: string;
    treasuryId?: string;
    outcomeIndex: number;
    stakeAmount: bigint;
    coinType?: string;
}

interface CreateManualEventParams {
    creatorCapId: string;
    marketId?: string;
    description: string;
    outcomeLabels: string[];
    durationMs: number;
    coinType?: string;
}

interface CreateCryptoEventParams {
    creatorCapId: string;
    marketId?: string;
    description: string;
    feedId: string; // 32-byte hex string
    targetPrice: string; // u128 as string (18 decimals)
    durationMs: number;
    coinType?: string;
}

interface ResolveManualEventParams {
    eventId: string;
    marketId?: string;
    winningOutcome: number;
    coinType?: string;
}

interface ResolveCryptoEventParams {
    eventId: string;
    marketId?: string;
    storkState?: string;
    storkUpdateData: Uint8Array; // From Stork API
    coinType?: string;
}

export function useContract() {
    const dAppKit = useDAppKit();
    const account = useCurrentAccount();

    // Helper to execute transaction with fallback
    const executeTransaction = useCallback(async (tx: Transaction) => {
        try {
            const result = await dAppKit.signAndExecuteTransaction({
                transaction: tx,
            });
            return result as any; // Type assertion for flexible result handling
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (!message.includes('does not support signing and executing transactions')) {
                throw error;
            }

            // Fallback for wallets that only support signTransaction
            const client = dAppKit.getClient();
            const signed = await dAppKit.signTransaction({ transaction: tx });
            const result = await client.executeTransactionBlock({
                transactionBlock: fromBase64(signed.bytes),
                signature: signed.signature,
                options: {
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true,
                },
            });
            return result as any;
        }
    }, [dAppKit]);

    // ============================================
    // USER BETTING FUNCTIONS
    // ============================================

    /**
     * Place a bet on an event outcome
     * Returns the Position NFT object ID
     */
    const placeBet = useCallback(async (params: PlaceBetParams): Promise<string | null> => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }
        if (!isContractConfigured()) {
            throw new Error('Contract not configured');
        }

        const {
            eventId,
            marketId = MARKET_ID!,
            treasuryId = TREASURY_ID!,
            outcomeIndex,
            stakeAmount,
            coinType = DEFAULT_COIN_TYPE,
        } = params;

        const tx = new Transaction();

        // Split coin for stake
        const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeAmount)]);

        // Place bet and receive Position NFT
        const [position] = tx.moveCall({
            target: FUNCTIONS.PLACE_BET(),
            typeArguments: [coinType],
            arguments: [
                tx.object(eventId),
                tx.object(marketId),
                tx.object(treasuryId),
                tx.pure.u8(outcomeIndex),
                stakeCoin,
                tx.object(CLOCK_OBJECT_ID),
            ],
        });

        // Transfer Position to user
        tx.transferObjects([position], tx.pure.address(account.address));

        const result = await executeTransaction(tx);

        // Extract Position ID from result
        const positionId = result.objectChanges?.find(
            (obj: any) => obj.type === 'created' && obj.objectType?.includes('Position')
        )?.objectId;

        return positionId || null;
    }, [account?.address, executeTransaction]);

    /**
     * Cancel a bet before event is locked (1% fee)
     */
    const cancelBet = useCallback(async (
        eventId: string,
        positionId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        const [refund] = tx.moveCall({
            target: FUNCTIONS.CANCEL_BET(),
            typeArguments: [coinType],
            arguments: [
                tx.object(eventId),
                tx.object(positionId),
            ],
        });
        tx.transferObjects([refund], tx.pure.address(account.address));

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Claim winnings for a winning position
     */
    const claimWinnings = useCallback(async (
        eventId: string,
        positionId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        const [payout] = tx.moveCall({
            target: FUNCTIONS.CLAIM_WINNINGS(),
            typeArguments: [coinType],
            arguments: [
                tx.object(eventId),
                tx.object(positionId),
            ],
        });
        tx.transferObjects([payout], tx.pure.address(account.address));

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Claim refund for a cancelled event
     */
    const claimRefund = useCallback(async (
        eventId: string,
        positionId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        const [refund] = tx.moveCall({
            target: FUNCTIONS.CLAIM_REFUND(),
            typeArguments: [coinType],
            arguments: [
                tx.object(eventId),
                tx.object(positionId),
            ],
        });
        tx.transferObjects([refund], tx.pure.address(account.address));

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    // ============================================
    // MARKET CREATOR FUNCTIONS
    // ============================================

    /**
     * Create a manual event (sports, custom markets)
     */
    const createManualEvent = useCallback(async (params: CreateManualEventParams) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const {
            creatorCapId,
            marketId = MARKET_ID!,
            description,
            outcomeLabels,
            durationMs,
            coinType = DEFAULT_COIN_TYPE,
        } = params;

        const tx = new Transaction();

        // Build vector<vector<u8>> from outcome labels
        const labelBytes = outcomeLabels.map(label =>
            tx.pure(new TextEncoder().encode(label))
        );
        const labelsVector = tx.makeMoveVec({ elements: labelBytes });

        tx.moveCall({
            target: FUNCTIONS.CREATE_MANUAL_EVENT(),
            typeArguments: [coinType],
            arguments: [
                tx.object(creatorCapId),
                tx.object(marketId),
                tx.pure.string(description),
                labelsVector,
                tx.pure.u64(durationMs),
            ],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Create a crypto event (price predictions)
     */
    const createCryptoEvent = useCallback(async (params: CreateCryptoEventParams) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const {
            creatorCapId,
            marketId = MARKET_ID!,
            description,
            feedId,
            targetPrice,
            durationMs,
            coinType = DEFAULT_COIN_TYPE,
        } = params;

        const feedIdBytes = feedIdToBytes(feedId);

        const tx = new Transaction();
        tx.moveCall({
            target: FUNCTIONS.CREATE_CRYPTO_EVENT(),
            typeArguments: [coinType],
            arguments: [
                tx.object(creatorCapId),
                tx.object(marketId),
                tx.pure.string(description),
                tx.pure(new Uint8Array(feedIdBytes)),
                tx.pure.u128(BigInt(targetPrice)),
                tx.pure.u64(durationMs),
            ],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Open event for betting (Market Creator only)
     */
    const openEvent = useCallback(async (
        creatorCapId: string,
        eventId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        tx.moveCall({
            target: FUNCTIONS.OPEN_EVENT(),
            typeArguments: [coinType],
            arguments: [
                tx.object(creatorCapId),
                tx.object(eventId),
                tx.object(CLOCK_OBJECT_ID),
            ],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Lock event (Market Creator only)
     */
    const lockEvent = useCallback(async (
        creatorCapId: string,
        eventId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        tx.moveCall({
            target: FUNCTIONS.LOCK_EVENT(),
            typeArguments: [coinType],
            arguments: [
                tx.object(creatorCapId),
                tx.object(eventId),
            ],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    // ============================================
    // ORACLE FUNCTIONS
    // ============================================

    /**
     * Resolve a manual event (Oracle only)
     */
    const resolveManualEvent = useCallback(async (params: ResolveManualEventParams) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const {
            eventId,
            marketId = MARKET_ID!,
            winningOutcome,
            coinType = DEFAULT_COIN_TYPE,
        } = params;

        const tx = new Transaction();
        tx.moveCall({
            target: FUNCTIONS.RESOLVE_MANUAL_EVENT(),
            typeArguments: [coinType],
            arguments: [
                tx.object(eventId),
                tx.object(marketId),
                tx.pure.u8(winningOutcome),
                tx.object(CLOCK_OBJECT_ID),
            ],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Resolve a crypto event using Stork oracle (Oracle only)
     * Important: Must include fresh Stork price update in the same PTB
     */
    const resolveCryptoEvent = useCallback(async (params: ResolveCryptoEventParams) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }
        if (!isStorkConfigured()) {
            throw new Error('Stork Oracle not configured');
        }

        const {
            eventId,
            marketId = MARKET_ID!,
            storkState = STORK_STATE!,
            storkUpdateData,
            coinType = DEFAULT_COIN_TYPE,
        } = params;

        const tx = new Transaction();

        // Step 1: Update Stork price feed
        const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(1000000)]); // Fee for Stork update

        tx.moveCall({
            target: `${STORK_PACKAGE_ID}::stork::update_single_temporal_numeric_value_evm`,
            arguments: [
                tx.object(storkState),
                tx.pure(storkUpdateData),
                feeCoin,
            ],
        });

        // Step 2: Resolve event (reads fresh price atomically)
        tx.moveCall({
            target: FUNCTIONS.RESOLVE_CRYPTO_EVENT(),
            typeArguments: [coinType],
            arguments: [
                tx.object(eventId),
                tx.object(marketId),
                tx.object(storkState),
                tx.object(CLOCK_OBJECT_ID),
            ],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Cancel an event (Market Creator/Admin only)
     */
    const cancelEvent = useCallback(async (
        creatorCapId: string,
        eventId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        tx.moveCall({
            target: FUNCTIONS.CANCEL_EVENT(),
            typeArguments: [coinType],
            arguments: [
                tx.object(creatorCapId),
                tx.object(eventId),
            ],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * Add an oracle to the market (Admin only)
     */
    const addOracle = useCallback(async (
        adminCapId: string,
        marketId: string,
        oracleAddress: string
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        tx.moveCall({
            target: FUNCTIONS.ADD_ORACLE(),
            arguments: [
                tx.object(adminCapId),
                tx.object(marketId),
                tx.pure.address(oracleAddress),
            ],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Create a treasury for a new coin type (Admin only)
     */
    const createTreasury = useCallback(async (
        adminCapId: string,
        coinType: string
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        tx.moveCall({
            target: FUNCTIONS.CREATE_TREASURY(),
            typeArguments: [coinType],
            arguments: [tx.object(adminCapId)],
        });

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    /**
     * Withdraw fees from treasury (Admin only)
     */
    const withdrawFees = useCallback(async (
        adminCapId: string,
        treasuryId: string,
        amount: bigint,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        const tx = new Transaction();
        const [feeCoins] = tx.moveCall({
            target: FUNCTIONS.WITHDRAW_FEES(),
            typeArguments: [coinType],
            arguments: [
                tx.object(adminCapId),
                tx.object(treasuryId),
                tx.pure.u64(amount),
            ],
        });
        tx.transferObjects([feeCoins], tx.pure.address(account.address));

        return executeTransaction(tx);
    }, [account?.address, executeTransaction]);

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * Find MarketCreatorCap owned by the current user
     */
    const findMarketCreatorCap = useCallback(async (): Promise<string | null> => {
        if (!account?.address || !PACKAGE_ID) {
            return null;
        }

        const client = dAppKit.getClient();
        const ownedObjects = await client.getOwnedObjects({
            owner: account.address,
            options: { showType: true },
        });

        const cap = ownedObjects.data.find(obj => {
            const type = obj.data?.type;
            return type && (
                type.includes('::blink_config::MarketCreatorCap') ||
                type.includes('::market::MarketCreatorCap') ||
                type.includes('::blink_event::MarketCreatorCap')
            );
        });

        return cap?.data?.objectId || null;
    }, [account?.address, dAppKit]);

    /**
     * Find AdminCap owned by the current user
     */
    const findAdminCap = useCallback(async (): Promise<string | null> => {
        if (!account?.address || !PACKAGE_ID) {
            return null;
        }

        const client = dAppKit.getClient();
        const ownedObjects = await client.getOwnedObjects({
            owner: account.address,
            options: { showType: true },
        });

        const cap = ownedObjects.data.find(obj => {
            const type = obj.data?.type;
            return type && type.includes('::blink_config::AdminCap');
        });

        return cap?.data?.objectId || null;
    }, [account?.address, dAppKit]);

    return {
        // User betting
        placeBet,
        cancelBet,
        claimWinnings,
        claimRefund,

        // Market creator
        createManualEvent,
        createCryptoEvent,
        openEvent,
        lockEvent,
        cancelEvent,

        // Oracle
        resolveManualEvent,
        resolveCryptoEvent,

        // Admin
        addOracle,
        createTreasury,
        withdrawFees,

        // Helpers
        findMarketCreatorCap,
        findAdminCap,

        // State
        isConnected: !!account?.address,
        isConfigured: isContractConfigured(),
        isStorkConfigured: isStorkConfigured(),
    };
}
