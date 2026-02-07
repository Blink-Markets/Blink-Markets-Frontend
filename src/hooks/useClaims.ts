import { useState } from 'react';
import { useDAppKit, useCurrentAccount } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { FUNCTIONS } from '../lib/constants';


const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export function useClaims() {
    const dAppKit = useDAppKit();
    const account = useCurrentAccount();
    const [isClaimingWinnings, setIsClaimingWinnings] = useState(false);
    const [isClaimingRefund, setIsClaimingRefund] = useState(false);

    const claimWinnings = async (eventId: string, positionId: string) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        setIsClaimingWinnings(true);
        try {
            const tx = new Transaction();
            const [payout] = tx.moveCall({
                target: FUNCTIONS.CLAIM_WINNINGS(),
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
                const result = await client.executeTransaction({
                    transaction: fromBase64(signed.bytes),
                    signatures: [signed.signature],
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

    const claimRefund = async (eventId: string, positionId: string) => {
        if (!account?.address) {
            throw new Error('Wallet not connected');
        }

        setIsClaimingRefund(true);
        try {
            const tx = new Transaction();
            const [refund] = tx.moveCall({
                target: FUNCTIONS.CLAIM_REFUND(),
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
                const result = await client.executeTransaction({
                    transaction: fromBase64(signed.bytes),
                    signatures: [signed.signature],
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

    return {
        claimWinnings,
        claimRefund,
        isClaimingWinnings,
        isClaimingRefund,
    };
}
