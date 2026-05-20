import { useState, useEffect, useCallback } from 'react';
import { useDAppKit, useCurrentAccount } from '@mysten/dapp-kit-react';
import { ParsedPosition, parsePosition } from '../types/contractTypes';
import { PACKAGE_ID, DEFAULT_COIN_TYPE } from '../lib/constants';

interface UsePositionsOptions {
    enabled?: boolean;
    pollInterval?: number;
    coinType?: string;
}

export function usePositions(options: UsePositionsOptions = {}) {
    const {
        enabled = true,
        pollInterval = 5000,
        coinType = DEFAULT_COIN_TYPE,
    } = options;

    const dAppKit = useDAppKit();
    const account = useCurrentAccount();
    const [positions, setPositions] = useState<ParsedPosition[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchPositions = useCallback(async () => {
        if (!account?.address || !PACKAGE_ID) return;

        try {
            setIsLoading(true);
            setError(null);

            const client = dAppKit.getClient();

            // Fetch all owned objects and filter for Position type
            // Position<CoinType> where CoinType matches our coinType
            const ownedObjects = await client.getOwnedObjects({
                owner: account.address,
                options: {
                    showContent: true,
                    showType: true,
                },
            });

            const parsedPositions: ParsedPosition[] = [];

            for (const obj of ownedObjects.data) {
                if (!obj.data) continue;

                const objType = obj.data.type;
                // Match Position<CoinType> pattern
                if (!objType?.includes('::blink_position::Position<')) continue;

                // Optionally filter by specific coin type
                if (coinType !== DEFAULT_COIN_TYPE && !objType.includes(coinType)) continue;

                const content = obj.data.content;
                if (content?.dataType !== 'moveObject') continue;

                const fields = content.fields as any;
                const parsed = parsePosition(fields);
                parsedPositions.push(parsed);
            }

            setPositions(parsedPositions);
        } catch (err) {
            console.error('Failed to fetch positions:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setIsLoading(false);
        }
    }, [account?.address, coinType, dAppKit]);

    useEffect(() => {
        if (!enabled || !account?.address || !PACKAGE_ID) return;

        // Initial fetch
        fetchPositions();

        // Poll for updates
        const interval = setInterval(fetchPositions, pollInterval);
        return () => clearInterval(interval);
    }, [account?.address, enabled, pollInterval, fetchPositions]);

    // Group positions by event ID
    const positionsByEvent = positions.reduce((acc, position) => {
        if (!acc[position.eventId]) {
            acc[position.eventId] = [];
        }
        acc[position.eventId].push(position);
        return acc;
    }, {} as Record<string, ParsedPosition[]>);

    // Get unclaimed positions
    const unclaimedPositions = positions.filter(p => !p.isClaimed);
    const claimedPositions = positions.filter(p => p.isClaimed);

    return {
        positions,
        positionsByEvent,
        unclaimedPositions,
        claimedPositions,
        isLoading,
        error,
        refetch: fetchPositions,
    };
}

