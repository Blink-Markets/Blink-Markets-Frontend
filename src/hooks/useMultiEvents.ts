import { useState, useEffect } from 'react';
import { useDAppKit } from '@mysten/dapp-kit-react';
import { ParsedEvent, parseEvent, EventStatus } from '../types/contractTypes';
import { PACKAGE_ID, MARKET_ID } from '../lib/constants';

interface UseMultiEventsOptions {
    limit?: number;
    pollInterval?: number;
    enabled?: boolean;
}

export function useMultiEvents(options: UseMultiEventsOptions = {}) {
    const {
        limit = 20,
        pollInterval = 5000,
        enabled = true,
    } = options;

    const dAppKit = useDAppKit();
    const [events, setEvents] = useState<ParsedEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchEvents = async () => {
        if (!enabled || !PACKAGE_ID || !MARKET_ID) return;

        try {
            setIsLoading(true);
            setError(null);
            const client = dAppKit.getClient();

            // 1. Query for EventCreated events to discover event IDs
            const eventFilter = {
                MoveEventType: `${PACKAGE_ID}::blink_event::EventCreated`,
            };

            const eventsQuery = await client.queryEvents({
                query: eventFilter,
                limit: limit,
                order: 'descending',
            });

            // Filter events for our specific market
            const relevantEventIds = eventsQuery.data
                .map((e: any) => e.parsedJson as any)
                .filter((e: any) => e.market_id === MARKET_ID)
                .map((e: any) => e.event_id);

            if (relevantEventIds.length === 0) {
                setEvents([]);
                return;
            }

            // 2. Fetch current object state for these events in parallel
            const eventObjects = await client.multiGetObjects({
                ids: relevantEventIds,
                options: {
                    showContent: true,
                },
            });

            // 3. Parse and sort events
            const parsedEvents: ParsedEvent[] = [];

            for (const obj of eventObjects) {
                if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') continue;

                try {
                    const fields = obj.data.content.fields as any;
                    const parsed = parseEvent(fields);
                    parsedEvents.push(parsed);
                } catch (e) {
                    console.warn('Failed to parse event:', e);
                }
            }

            // Sort: OPEN first, then by end time
            parsedEvents.sort((a, b) => {
                if (a.status === EventStatus.OPEN && b.status !== EventStatus.OPEN) return -1;
                if (a.status !== EventStatus.OPEN && b.status === EventStatus.OPEN) return 1;
                return a.bettingEndTime - b.bettingEndTime;
            });

            setEvents(parsedEvents);
        } catch (err) {
            console.error('Failed to fetch multi-events:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();

        if (enabled) {
            const interval = setInterval(fetchEvents, pollInterval);
            return () => clearInterval(interval);
        }
    }, [enabled, pollInterval, dAppKit]);

    return {
        events,
        isLoading,
        error,
        refetch: fetchEvents,
    };
}
