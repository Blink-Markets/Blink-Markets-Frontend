// Hook for executing RFQ-based trades
// Replaces the old place_bet flow with the new execute_rfq contract call

import { useCallback, useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import {
    PACKAGE_ID,
    CLEARINGHOUSE_ID,
    COIN_TYPE,
    CLOCK_OBJECT_ID,
    FUNCTIONS,
    computeUserTotalPay,
    getErrorMessage,
} from "../lib/constants";
import {
    TradeQuote,
    ParsedPosition,
    Side,
} from "../types/contractTypes";

interface UseExecuteRfqOptions {
    /** Optional callback when trade executes successfully */
    onSuccess?: (position: ParsedPosition, positionId: string) => void;
    /** Optional callback on error */
    onError?: (error: Error) => void;
}

interface UseExecuteRfqReturn {
    /** Execute an RFQ trade */
    execute: (params: {
        /** The PMM quote response */
        quote: TradeQuote;
        /** Coin object ID to use for payment (must hold exactly user_total_pay) */
        coinObjectId: string;
    }) => Promise<ParsedPosition | null>;
    /** Loading state */
    isLoading: boolean;
    /** Current error message */
    error: string | null;
    /** Reset error state */
    clearError: () => void;
}

/**
 * Hook for executing RFQ trades via the blink_market contract.
 *
 * This replaces the old place_bet flow with:
 * 1. Get a quote from your PMM backend
 * 2. Build execute_rfq transaction with Ed25519 signature verification
 * 3. Execute on-chain and receive a Position NFT
 */
export const useExecuteRfq = (
    options: UseExecuteRfqOptions = {},
): UseExecuteRfqReturn => {
    const { onSuccess, onError } = options;
    const dAppKit = useDAppKit();
    const account = useCurrentAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const execute = useCallback(
        async (params: {
            quote: TradeQuote;
            coinObjectId: string;
        }): Promise<ParsedPosition | null> => {
            const { quote, coinObjectId } = params;

            // Validate configuration
            if (!PACKAGE_ID || !CLEARINGHOUSE_ID || !COIN_TYPE) {
                const err = new Error(
                    "Contract not configured. Set VITE_BLINK_PACKAGE_ID, VITE_BLINK_CLEARINGHOUSE_ID, and VITE_BLINK_COIN_TYPE",
                );
                setError(err.message);
                onError?.(err);
                return null;
            }

            // Validate wallet connection
            if (!account?.address) {
                const err = new Error("Wallet not connected");
                setError(err.message);
                onError?.(err);
                return null;
            }

            // Validate coin object
            if (!coinObjectId) {
                const err = new Error("No coin object provided for payment");
                setError(err.message);
                onError?.(err);
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const client = dAppKit.getClient();

                // Validate market is not resolved
                const marketObj = await client.getObject({
                    id: quote.marketId,
                    options: { showContent: true },
                });
                const marketFields = marketObj.data?.content as any;
                if (marketFields?.fields?.is_resolved) {
                    throw new Error(getErrorMessage(0)); // EMarketAlreadyResolved
                }

                // Validate quote has not expired
                const now = Date.now();
                if (now >= Number(quote.expiresAt)) {
                    throw new Error(getErrorMessage(100)); // EQuoteExpired
                }

                // Calculate expected user total pay
                const userTotalPay = computeUserTotalPay(quote.size, quote.priceBps);

                // Get the coin object's current value to validate
                const coinObj = await client.getObject({
                    id: coinObjectId,
                    options: { showContent: true },
                });
                const coinFields = coinObj.data?.content as any;
                const coinValue = BigInt(coinFields?.fields?.balance ?? 0);

                if (coinValue !== userTotalPay) {
                    throw new Error(
                        `Coin value ${coinValue} does not match expected ${userTotalPay}. Use exact amount.`,
                    );
                }

                // Build the execute_rfq transaction
                const tx = new Transaction();

                tx.moveCall({
                    target: FUNCTIONS.EXECUTE_RFQ(),
                    typeArguments: [COIN_TYPE],
                    arguments: [
                        tx.object(CLEARINGHOUSE_ID), // &mut Clearinghouse
                        tx.object(quote.marketId),   // &mut Market
                        tx.object(coinObjectId),     // coin::Coin<CoinType>
                        tx.pure.u8(quote.side),      // side: u8
                        tx.pure.u64(quote.priceBps), // price_bps: u64
                        tx.pure.u64(quote.size),     // size: u64
                        tx.pure.u64(quote.seqNumber), // seq_number: u64
                        tx.pure.u64(quote.expiresAt), // expires_at: u64
                        tx.pure.address(quote.pmm),  // pmm: address
                        // pmm_pubkey: vector<u8> (32 bytes)
                        tx.pure(
                            bcs.vector(bcs.u8()).serialize(quote.pmmPubkey),
                        ),
                        // signature: vector<u8> (64 bytes)
                        tx.pure(
                            bcs.vector(bcs.u8()).serialize(quote.signature),
                        ),
                        tx.object(CLOCK_OBJECT_ID), // &Clock
                    ],
                });

                // Execute the transaction
                let positionId = "";
                try {
                    const result =
                        await dAppKit.signAndExecuteTransaction({
                            transaction: tx,
                        });

                    // Extract position ID from the transaction effects
                    // The transaction creates a new Position object
                    positionId =
                        result.effects?.created?.[0]?.reference?.objectId ?? "";
                } catch (signError: any) {
                    // Fallback for wallets that support signTransaction but not signAndExecuteTransaction
                    if (
                        signError.message?.includes(
                            "does not support signing and executing transactions",
                        )
                    ) {
                        const signed = await dAppKit.signTransaction({
                            transaction: tx,
                        });
                        const fromBase64 = (value: string) =>
                            Uint8Array.from(atob(value), (char) =>
                                char.charCodeAt(0),
                            );
                        const execResult = await client.executeTransactionBlock({
                            transactionBlock: fromBase64(signed.bytes),
                            signature: signed.signature,
                            options: { showEffects: true },
                        });
                        positionId =
                            execResult.effects?.created?.[0]?.reference?.objectId ?? "";
                    } else {
                        throw signError;
                    }
                }

                const position: ParsedPosition = {
                    id: positionId,
                    marketId: quote.marketId,
                    side: quote.side as Side,
                    size: quote.size,
                };

                onSuccess?.(position, positionId);
                return position;
            } catch (err) {
                const errorMsg =
                    err instanceof Error ? err.message : String(err);
                const parsedError = parseInt(
                    errorMsg.match(/\(code (\d+)\)/)?.[1] ?? "-1",
                );
                const userMessage =
                    parsedError >= 0 ? getErrorMessage(parsedError) : errorMsg;
                setError(userMessage);
                onError?.(new Error(userMessage));
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [account, dAppKit, onSuccess, onError],
    );

    return {
        execute,
        isLoading,
        error,
        clearError,
    };
};

export default useExecuteRfq;
