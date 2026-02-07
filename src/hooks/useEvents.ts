import { useState, useEffect } from 'react';
import { useDAppKit } from '@mysten/dapp-kit-react';
import { ParsedEvent, parseEvent, EventStatus } from '../types/contractTypes';
import { EVENT_ID } from '../lib/constants';

interface UseEventsOptions {
    eventId?: string;
    pollInterval?: number; // milliseconds
    enabled?: boolean;
}

export function useEvents(options: UseEventsOptions = {}) {
    const {
        eventId = EVENT_ID,
        pollInterval = 3000,
        enabled = true,
    } = options;

    const dAppKit = useDAppKit();
    const [event, setEvent] = useState<ParsedEvent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled || !eventId) return;

        const fetchEvent = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const client = dAppKit.getClient();
                const eventObject = await (client as any).getObject({
                    id: eventId,
                    options: {
                        showContent: true,
                    },
                });

                if (!(eventObject as any).data) {
                    throw new Error('Event not found');
                }

                const content = (eventObject as any).data.content;
                if (content?.dataType !== 'moveObject') {
                    throw new Error('Invalid event object');
                }

                const fields = content.fields as any;
                const parsedEvent = parseEvent(fields);
                setEvent(parsedEvent);
            } catch (err) {
                console.error('Failed to fetch event:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setIsLoading(false);
            }
        };

        // Initial fetch
        fetchEvent();

        // Poll for updates only if event is active
        const shouldPoll = event?.status === EventStatus.OPEN || event?.status === EventStatus.CREATED;
        if (!shouldPoll) return;

        const interval = setInterval(fetchEvent, pollInterval);
        return () => clearInterval(interval);
    }, [eventId, enabled, pollInterval, event?.status, dAppKit]);

    return {
        event,
        isLoading,
        error,
        refetch: () => {
            // Trigger refetch by clearing event
            setEvent(null);
        },
    };
}
