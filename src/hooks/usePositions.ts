import { useState, useEffect } from 'react';
import { useDAppKit, useCurrentAccount } from '@mysten/dapp-kit-react';
import { ParsedPosition, parsePosition } from '../types/contractTypes';
import { PACKAGE_ID } from '../lib/constants';

interface UsePositionsOptions {
    enabled?: boolean;
    pollInterval?: number;
}

export function usePositions(options: UsePositionsOptions = {}) {
    const { enabled = true, pollInterval = 5000 } = options;

    const dAppKit = useDAppKit();
    const account = useCurrentAccount();
    const [positions, setPositions] = useState<ParsedPosition[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled || !account?.address || !PACKAGE_ID) return;

        const fetchPositions = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const client = dAppKit.getClient();

                // Fetch all owned objects
                const ownedObjects = await client.getOwnedObjects({
                    owner: account.address,
                    filter: {
                        StructType: `${PACKAGE_ID}::blink_position::Position`,
                    },
                    options: {
                        showContent: true,
                    },
                });

                const parsedPositions: ParsedPosition[] = [];

                for (const obj of ownedObjects.data) {
                    if (!obj.data) continue;

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
        };

        // Initial fetch
        fetchPositions();

        // Poll for updates
        const interval = setInterval(fetchPositions, pollInterval);
        return () => clearInterval(interval);
    }, [account?.address, enabled, pollInterval, dAppKit]);

    // Group positions by event ID
    const positionsByEvent = positions.reduce((acc, position) => {
        if (!acc[position.eventId]) {
            acc[position.eventId] = [];
        }
        acc[position.eventId].push(position);
        return acc;
    }, {} as Record<string, ParsedPosition[]>);

    return {
        positions,
        positionsByEvent,
        isLoading,
        error,
        refetch: () => {
            setPositions([]);
        },
    };
}
