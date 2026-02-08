import { useState, useEffect, useCallback, useMemo } from 'react';
import { FlashBet, BetCategory, CATEGORY_IMAGES } from '../types/bet';
import { useMultiEvents } from './useMultiEvents';
import { EventStatus, ParsedEvent } from '../types/contractTypes';
import { MIST_PER_SUI } from '../lib/constants';

// Helper to convert on-chain event to FlashBet format
const convertToFlashBet = (event: ParsedEvent): FlashBet => {
    const totalPoolSui = Number(event.totalPool) / Number(MIST_PER_SUI);
    const poolA = Number(event.outcomePools[0] || 0) / Number(MIST_PER_SUI);
    const poolB = Number(event.outcomePools[1] || 0) / Number(MIST_PER_SUI);

    // Calculate odds (simple pool ratio)
    // If pool is empty, default odds 2.0
    const oddsA = poolA > 0 ? totalPoolSui / poolA : 2.0;
    const oddsB = poolB > 0 ? totalPoolSui / poolB : 2.0;

    const pctA = totalPoolSui > 0 ? Math.round((poolA / totalPoolSui) * 100) : 50;
    const pctB = totalPoolSui > 0 ? Math.round((poolB / totalPoolSui) * 100) : 50;

    // Map description keywords to categories
    let category: BetCategory = 'All';
    const desc = (event.description || '').toString().toLowerCase();

    if (desc.includes('nba') || desc.includes('bucket') || desc.includes('point')) category = 'NBA';
    else if (desc.includes('nfl') || desc.includes('touchdown') || desc.includes('yard')) category = 'NFL';
    else if (desc.includes('soccer') || desc.includes('goal') || desc.includes('offside')) category = 'Soccer';
    else if (desc.includes('btc') || desc.includes('eth') || desc.includes('price')) category = 'Crypto';
    else if (desc.includes('lol') || desc.includes('kill') || desc.includes('map')) category = 'Esports';

    // If still generic, pick random or default
    if (category === 'All') category = 'Crypto';

    // Select image
    const images = CATEGORY_IMAGES[category as Exclude<BetCategory, 'All'>] || CATEGORY_IMAGES.Crypto;
    const imageUrl = images[0];

    return {
        id: `onchain-${event.id}`,
        title: event.description || 'On-Chain Market', // On-chain doesn't have title/desc separation yet
        description: 'Live On-Chain Market',
        category,
        imageUrl,
        createdAt: event.bettingStartTime,
        expiresAt: event.bettingEndTime,
        status: event.status === EventStatus.CREATED ? 'created' :
            event.status === EventStatus.OPEN ? 'active' :
                event.status === EventStatus.LOCKED ? 'locked' : 'resolved',
        totalPool: totalPoolSui,
        participants: 0, // Not available on-chain easily without indexing
        optionA: {
            label: event.outcomeLabels[0] || 'Yes',
            shortLabel: event.outcomeLabels[0]?.substring(0, 4).toUpperCase(),
            odds: oddsA,
            totalBets: poolA,
            percentage: pctA
        },
        optionB: {
            label: event.outcomeLabels[1] || 'No',
            shortLabel: event.outcomeLabels[1]?.substring(0, 4).toUpperCase(),
            odds: oddsB,
            totalBets: poolB,
            percentage: pctB
        },
        onchain: { // Start of Onchain specific data
            eventId: event.id,
            outcomeAIndex: 0,
            outcomeBIndex: 1
        }
    };
};

// Sample flash bet templates
const SAMPLE_BETS: Omit<FlashBet, 'id' | 'createdAt' | 'expiresAt' | 'status' | 'participants'>[] = [
    {
        title: 'Next 3-pointer',
        description: 'Which team scores the next three-pointer?',
        category: 'NBA',
        optionA: { label: 'Los Angeles Lakers', shortLabel: 'LAL', odds: 1.85, totalBets: 2500, percentage: 58 },
        optionB: { label: 'Boston Celtics', shortLabel: 'BOS', odds: 2.10, totalBets: 1800, percentage: 42 },
        totalPool: 4300,
    },
    {
        title: 'Next touchdown',
        description: 'Which team gets the next TD?',
        category: 'NFL',
        optionA: { label: 'Kansas City Chiefs', shortLabel: 'KC', odds: 1.75, totalBets: 3200, percentage: 60 },
        optionB: { label: 'San Francisco 49ers', shortLabel: 'SF', odds: 2.25, totalBets: 2100, percentage: 40 },
        totalPool: 5300,
    },
    {
        title: 'Next goal scorer',
        description: 'Who scores the next goal in the match?',
        category: 'Soccer',
        optionA: { label: 'Manchester City', shortLabel: 'MCI', odds: 1.90, totalBets: 4100, percentage: 51 },
        optionB: { label: 'Real Madrid', shortLabel: 'RMA', odds: 1.95, totalBets: 3900, percentage: 49 },
        totalPool: 8000,
    },
    {
        title: 'First blood',
        description: 'Which team gets first blood?',
        category: 'Esports',
        optionA: { label: 'Team Liquid', shortLabel: 'TL', odds: 1.65, totalBets: 1500, percentage: 62 },
        optionB: { label: 'Fnatic', shortLabel: 'FNC', odds: 2.40, totalBets: 900, percentage: 38 },
        totalPool: 2400,
    },
    {
        title: 'BTC 1-min candle',
        description: 'Will the next 1-minute candle be green or red?',
        category: 'Crypto',
        optionA: { label: 'Green (Up)', shortLabel: '📈', odds: 1.95, totalBets: 5500, percentage: 48 },
        optionB: { label: 'Red (Down)', shortLabel: '📉', odds: 1.90, totalBets: 5800, percentage: 52 },
        totalPool: 11300,
    },
    {
        title: 'Next free throw',
        description: 'Will the next free throw be made or missed?',
        category: 'NBA',
        optionA: { label: 'Made', shortLabel: '✓', odds: 1.30, totalBets: 4200, percentage: 77 },
        optionB: { label: 'Missed', shortLabel: '✗', odds: 3.50, totalBets: 1300, percentage: 23 },
        totalPool: 5500,
    },
    {
        title: 'Next corner kick',
        description: 'Which team gets the next corner?',
        category: 'Soccer',
        optionA: { label: 'Arsenal', shortLabel: 'ARS', odds: 2.05, totalBets: 2800, percentage: 47 },
        optionB: { label: 'Liverpool', shortLabel: 'LIV', odds: 1.85, totalBets: 3200, percentage: 53 },
        totalPool: 6000,
    },
    {
        title: 'ETH price direction',
        description: 'Will ETH go up or down in the next minute?',
        category: 'Crypto',
        optionA: { label: 'Bullish', shortLabel: '🐂', odds: 2.00, totalBets: 3800, percentage: 50 },
        optionB: { label: 'Bearish', shortLabel: '🐻', odds: 2.00, totalBets: 3800, percentage: 50 },
        totalPool: 7600,
    },
];

function getRandomImage(category: Exclude<BetCategory, 'All'>): string {
    const images = CATEGORY_IMAGES[category];
    return images[Math.floor(Math.random() * images.length)];
}

function generateBet(): FlashBet {
    const template = SAMPLE_BETS[Math.floor(Math.random() * SAMPLE_BETS.length)];
    const now = Date.now();
    const duration = 10000 + Math.random() * 8000; // 10-18 seconds
    const variance = 0.7 + Math.random() * 0.6; // 70-130% of base values
    const randomId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);

    const totalA = Math.floor(template.optionA.totalBets * variance);
    const totalB = Math.floor(template.optionB.totalBets * variance);
    const total = totalA + totalB;

    return {
        ...template,
        id: `bet-${now}-${randomId}`,
        imageUrl: getRandomImage(template.category as Exclude<BetCategory, 'All'>),
        createdAt: now,
        expiresAt: now + duration,
        status: 'active',
        participants: Math.floor(50 + Math.random() * 200),
        optionA: {
            ...template.optionA,
            totalBets: totalA,
            percentage: Math.round((totalA / total) * 100),
        },
        optionB: {
            ...template.optionB,
            totalBets: totalB,
            percentage: Math.round((totalB / total) * 100),
        },
        totalPool: total,
    };
}

export function useFlashBets() {
    const [activeBets, setActiveBets] = useState<FlashBet[]>([]);
    const [recentBets, setRecentBets] = useState<FlashBet[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<BetCategory>('All');

    // Fetch real on-chain events
    const { events: realEvents } = useMultiEvents({
        limit: 10,
        pollInterval: 3000,
        enabled: true
    });

    // Convert real events to FlashBets
    const realFlashBets = useMemo(() => {
        return realEvents.map(convertToFlashBet);
    }, [realEvents]);

    // Initial load - seed with some mock data if needed, but prefer real
    useEffect(() => {
        // Start with some mock bets
        const initialMockBets = Array.from({ length: 3 }, () => generateBet());
        setActiveBets(initialMockBets);
    }, []);

    // Merge real and mock bets
    useEffect(() => {
        setActiveBets(prev => {
            // Keep existing non-expired mock bets
            const activeMock = prev.filter(bet => !bet.id.startsWith('onchain-'));

            // Deduplicate: if we have many real bets, reduce mock bets
            const neededMockCount = Math.max(0, 6 - realFlashBets.length);

            // Trim or add mock bets
            let finalMock = activeMock;
            if (activeMock.length > neededMockCount) {
                finalMock = activeMock.slice(activeMock.length - neededMockCount);
            } else if (activeMock.length < neededMockCount) {
                // logic to add new mock bet handled by interval below
            }

            // Combine: Real bets first
            return [...realFlashBets, ...finalMock];
        });
    }, [realFlashBets]);

    // Add new (mock) bets periodically to fill gaps
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveBets(prev => {
                if (prev.length < 6) {
                    const newBet = generateBet();
                    return [...prev, newBet];
                }
                return prev;
            });
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    // Check for expired bets (mostly for mock data - real data handles itself via hook)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            setActiveBets(prev => {
                const stillActive: FlashBet[] = [];
                const nowExpired: FlashBet[] = [];

                prev.forEach(bet => {
                    // Start of expiration check
                    // For on-chain bets, rely on status from hook, but can also check time
                    const isReal = bet.id.startsWith('onchain-');
                    const isExpired = bet.expiresAt <= now;

                    if (!isReal && isExpired) {
                        const resolved: FlashBet = {
                            ...bet,
                            status: 'resolved',
                            winner: Math.random() > 0.5 ? 'A' : 'B',
                        };
                        nowExpired.push(resolved);
                    } else {
                        // For real bets, we just keep them in 'activeBets' list until they are resolved/removed by parent hook?
                        // Actually parent hook returns all relevant events.
                        // Let's just keep them if they are in the 'prev' list (managed by merge effect)
                        stillActive.push(bet);
                    }
                });

                // Add expired mock bets to recent history
                if (nowExpired.length > 0) {
                    setRecentBets(prevHist => {
                        const merged = [...nowExpired, ...prevHist];
                        const seen = new Set<string>();
                        return merged.filter(bet => {
                            if (seen.has(bet.id)) return false;
                            seen.add(bet.id);
                            return true;
                        }).slice(0, 10);
                    });
                }

                // Note: We don't remove expired real bets here, 
                // because 'useEffect([realFlashBets])' will update the list with latest status
                // But we need to return 'stillActive' for the mock ones.
                // Re-merging logic is tricky. 
                // Simplified: THIS effect only manages expiration of MOCK bets.
                // The real bets are just passed through or updated by the other effect.

                // Filter out ONLY expired mock bets
                return prev.filter(bet => {
                    if (bet.id.startsWith('onchain-')) return true; // Let the other effect handle real bets
                    if (bet.expiresAt <= now) return false; // Remove expired mock
                    return true;
                });
            });
        }, 1000); // Check every second

        return () => clearInterval(interval);
    }, []);


    const placeBet = useCallback((betId: string, choice: 'A' | 'B', amount: number) => {
        setActiveBets(prev =>
            prev.map(bet => {
                if (bet.id === betId && bet.status === 'active') {
                    const updatedBet = { ...bet };
                    const newParticipants = bet.participants + 1;

                    if (choice === 'A') {
                        const newTotalA = bet.optionA.totalBets + amount;
                        const newTotal = bet.totalPool + amount;
                        updatedBet.optionA = {
                            ...bet.optionA,
                            totalBets: newTotalA,
                            percentage: Math.round((newTotalA / newTotal) * 100),
                        };
                        updatedBet.optionB = {
                            ...bet.optionB,
                            percentage: Math.round((bet.optionB.totalBets / newTotal) * 100),
                        };
                    } else {
                        const newTotalB = bet.optionB.totalBets + amount;
                        const newTotal = bet.totalPool + amount;
                        updatedBet.optionB = {
                            ...bet.optionB,
                            totalBets: newTotalB,
                            percentage: Math.round((newTotalB / newTotal) * 100),
                        };
                        updatedBet.optionA = {
                            ...bet.optionA,
                            percentage: Math.round((bet.optionA.totalBets / newTotal) * 100),
                        };
                    }

                    updatedBet.totalPool = bet.totalPool + amount;
                    updatedBet.participants = newParticipants;
                    return updatedBet;
                }
                return bet;
            })
        );
    }, []);

    const filteredBets = selectedCategory === 'All'
        ? activeBets
        : activeBets.filter(bet => bet.category === selectedCategory);

    return {
        activeBets: filteredBets,
        allActiveBets: activeBets,
        recentBets,
        placeBet,
        selectedCategory,
        setSelectedCategory,
    };
}
