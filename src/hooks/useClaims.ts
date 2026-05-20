// Hook for redeeming winning positions
// Replaces old claim_winnings/claim_refund with single redeem_position call

import { useCallback, useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import {
    PACKAGE_ID,
    COIN_TYPE,
    FUNCTIONS,
    getErrorMessage,
} from "../lib/constants";

interface UseRedeemPositionOptions {
    /** Optional callback on success */
    onSuccess?: (payout: bigint) => void;
    /** Optional callback on error */
    onError?: (error: Error) => void;
}

interface UseRedeemPositionReturn {
    /** Redeem a winning position */
    redeem: (params: {
        marketId: string;
        positionId: string;
    }) => Promise<bigint | null>;
    /** Loading state */
    isLoading: boolean;
    /** Current error message */
    error: string | null;
    /** Reset error state */
    clearError: () => void;
}

/**
 * Hook for redeeming winning positions via the blink_market contract.
 *
 * Replaces the old claim_winnings/claim_refund flow with a single:
 *   redeem_position call that burns the Position and transfers payout
 *
 * Requirements:
 * - Market must be resolved
 * - Position must be on the winning side
 * - Pool must have sufficient balance
 */
export const useRedeemPosition = (
    options: UseRedeemPositionOptions = {},
): UseRedeemPositionReturn => {
    const { onSuccess, onError } = options;
    const dAppKit = useDAppKit();
    const account = useCurrentAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const redeem = useCallback(
        async (params: {
            marketId: string;
            positionId: string;
        }): Promise<bigint | null> => {
            const { marketId, positionId } = params;

            // Validate configuration
            if (!PACKAGE_ID || !COIN_TYPE) {
                const err = new Error(
                    "Contract not configured. Set VITE_BLINK_PACKAGE_ID and VITE_BLINK_COIN_TYPE",
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

            setIsLoading(true);
            setError(null);

            try {
                const client = dAppKit.getClient();

                // Verify market is resolved
                const marketObj = await client.getObject({
                    id: marketId,
                    options: { showContent: true },
                });
                const marketFields = marketObj.data?.content as any;
                if (!marketFields?.fields?.is_resolved) {
                    throw new Error(getErrorMessage(1)); // EMarketNotResolved
                }

                // Get position to determine payout amount
                const positionObj = await client.getObject({
                    id: positionId,
                    options: { showContent: true },
                });
                const positionFields = positionObj.data?.content as any;
                const payout = BigInt(positionFields?.fields?.size ?? 0);

                // Build the redeem_position transaction
                const tx = new Transaction();

                tx.moveCall({
                    target: FUNCTIONS.REDEEM_POSITION(),
                    typeArguments: [COIN_TYPE],
                    arguments: [
                        tx.object(marketId),     // &mut Market<CoinType>
                        tx.object(positionId),   // Position<CoinType> - consumed
                    ],
                });

                // Execute the transaction
                try {
                    await dAppKit.signAndExecuteTransaction({
                        transaction: tx,
                    });
                } catch (signError: any) {
                    // Fallback for wallets that support signTransaction
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
                        await client.executeTransactionBlock({
                            transactionBlock: fromBase64(signed.bytes),
                            signature: signed.signature,
                            options: { showEffects: true },
                        });
                    } else {
                        throw signError;
                    }
                }

                onSuccess?.(payout);
                return payout;
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
        redeem,
        isLoading,
        error,
        clearError,
    };
};

// ============================================================================
// Legacy Exports (for backward compatibility during migration)
// ============================================================================

// @deprecated Use useRedeemPosition instead
// This is a stub that logs a warning - you need to migrate to the new contract
export function useClaims() {
    console.warn(
        "useClaims() is deprecated. The old contract is no longer supported. " +
        "Please migrate to useRedeemPosition with the blink_market package."
    );

    return {
        // Legacy stubs
        claimWinnings: async (_eventId: string, _positionId: string) => {
            throw new Error("Old contract claims are no longer supported");
        },
        claimRefund: async (_eventId: string, _positionId: string) => {
            throw new Error("Old contract claims are no longer supported");
        },
        isClaimingWinnings: false,
        isClaimingRefund: false,
    };
}

export default useRedeemPosition;
