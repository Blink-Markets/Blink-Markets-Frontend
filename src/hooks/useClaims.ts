import { useState } from 'react';
import { useDAppKit, useCurrentAccount } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { FUNCTIONS, DEFAULT_COIN_TYPE } from '../lib/constants';


const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export function useClaims() {
    const dAppKit = useDAppKit();
    const account = useCurrentAccount();
    const [isClaimingWinnings, setIsClaimingWinnings] = useState(false);
    const [isClaimingRefund, setIsClaimingRefund] = useState(false);
    const [isCancellingBet, setIsCancellingBet] = useState(false);

    const claimWinnings = async (
        eventId: string,
        positionId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        setIsClaimingWinnings(true);
        try {
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

            try {
                const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
                return result;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (!message.includes('does not support signing and executing transactions')) {
                    throw error;
                }

                // Fallback for wallets that support signTransaction but not signAndExecuteTransaction
                const client = dAppKit.getClient();
                const signed = await dAppKit.signTransaction({ transaction: tx });
                const result = await client.executeTransactionBlock({
                    transactionBlock: fromBase64(signed.bytes),
                    signature: signed.signature,
                });
                return result;
            }
        } catch (error) {
            console.error('Failed to claim winnings:', error);
            throw error;
        } finally {
            setIsClaimingWinnings(false);
        }
    };

    const claimRefund = async (
        eventId: string,
        positionId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        setIsClaimingRefund(true);
        try {
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

            try {
                const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
                return result;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (!message.includes('does not support signing and executing transactions')) {
                    throw error;
                }

                // Fallback for wallets that support signTransaction but not signAndExecuteTransaction
                const client = dAppKit.getClient();
                const signed = await dAppKit.signTransaction({ transaction: tx });
                const result = await client.executeTransactionBlock({
                    transactionBlock: fromBase64(signed.bytes),
                    signature: signed.signature,
                });
                return result;
            }
        } catch (error) {
            console.error('Failed to claim refund:', error);
            throw error;
        } finally {
            setIsClaimingRefund(false);
        }
    };

    const cancelBet = async (
        eventId: string,
        positionId: string,
        coinType: string = DEFAULT_COIN_TYPE
    ) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        setIsCancellingBet(true);
        try {
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

            try {
                const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
                return result;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (!message.includes('does not support signing and executing transactions')) {
                    throw error;
                }

                const client = dAppKit.getClient();
                const signed = await dAppKit.signTransaction({ transaction: tx });
                const result = await client.executeTransactionBlock({
                    transactionBlock: fromBase64(signed.bytes),
                    signature: signed.signature,
                });
                return result;
            }
        } catch (error) {
            console.error('Failed to cancel bet:', error);
            throw error;
        } finally {
            setIsCancellingBet(false);
        }
    };

    return {
        claimWinnings,
        claimRefund,
        cancelBet,
        isClaimingWinnings,
        isClaimingRefund,
        isCancellingBet,
    };
}

