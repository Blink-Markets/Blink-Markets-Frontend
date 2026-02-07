
import { useState, useEffect, useCallback, useRef } from 'react';
import { FlashBet, BetCategory, CATEGORY_IMAGES } from '../types/bet';
import { useStorkOracle } from './useStorkOracle';

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

function generateBet(storkPrices?: Record<string, number>): FlashBet {
    let templates = SAMPLE_BETS;

    // If we have Stork prices, prioritized Crypto bets more often
    if (storkPrices && Math.random() > 0.4) {
        const cryptoBets = SAMPLE_BETS.filter(b => b.category === 'Crypto');
        if (cryptoBets.length > 0) {
            templates = cryptoBets;
        }
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const now = Date.now();
    const duration = 10000 + Math.random() * 8000; // 10-18 seconds
    const variance = 0.7 + Math.random() * 0.6; // 70-130% of base values

    const totalA = Math.floor(template.optionA.totalBets * variance);
    const totalB = Math.floor(template.optionB.totalBets * variance);
    const total = totalA + totalB;

    let startPrice: number | undefined;
    let oracleType: 'Stork' | 'Simulated' = 'Simulated';

    // If it's a crypto bet and we have a price, use it!
    if (template.category === 'Crypto' && storkPrices) {
        if (template.title.includes('BTC') && storkPrices['BTC']) {
            startPrice = storkPrices['BTC'];
            oracleType = 'Stork';
        } else if (template.title.includes('ETH') && storkPrices['ETH']) {
            startPrice = storkPrices['ETH'];
            oracleType = 'Stork';
        }
    }

    return {
        ...template,
        id: `bet-${now}-${Math.random().toString(36).substr(2, 9)}`,
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
        startPrice,
        oracle: oracleType,
    };
}

export function useFlashBets() {
    const [activeBets, setActiveBets] = useState<FlashBet[]>([]);
    const [recentBets, setRecentBets] = useState<FlashBet[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<BetCategory>('All');

    // Connect to Stork Oracle for BTC, ETH, SUI prices
    const { prices: storkPrices, isConnected: isStorkConnected } = useStorkOracle(['BTC', 'ETH', 'SUI']);

    // Helper to get simple price map
    const simplePrices = Object.entries(storkPrices).reduce((acc, [key, data]) => {
        acc[key] = data.price;
        return acc;
    }, {} as Record<string, number>);

    // Use a ref to access current prices inside the interval closure without re-creating the interval
    const pricesRef = useRef(simplePrices);
    useEffect(() => {
        pricesRef.current = simplePrices;
    }, [simplePrices]);

    // Generate initial bets
    useEffect(() => {
        const initialBets = Array.from({ length: 4 }, () => generateBet());
        setActiveBets(initialBets);
    }, []);

    // Add new bets periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveBets(prev => {
                if (prev.length < 6) {
                    const newBet = generateBet(pricesRef.current);
                    return [...prev, newBet];
                }
                return prev;
            });
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    // Check for expired bets and resolve them
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const currentPrices = pricesRef.current;

            setActiveBets(prev => {
                const stillActive: FlashBet[] = [];
                const nowExpired: FlashBet[] = [];
                let hasChanges = false;

                prev.forEach(bet => {
                    if (bet.expiresAt <= now) {
                        hasChanges = true;
                        let winner: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B';
                        let finalPrice: number | undefined;

                        // Resolve with Stork Oracle if applicable
                        if (bet.oracle === 'Stork' && bet.startPrice) {
                            let assetKey = '';
                            if (bet.title.includes('BTC')) assetKey = 'BTC';
                            if (bet.title.includes('ETH')) assetKey = 'ETH';

                            if (assetKey && currentPrices[assetKey]) {
                                finalPrice = currentPrices[assetKey];
                                // A = Up/Bullish, B = Down/Bearish
                                if (finalPrice >= bet.startPrice) {
                                    winner = 'A';
                                } else {
                                    winner = 'B';
                                }
                            }
                        }

                        const resolved: FlashBet = {
                            ...bet,
                            status: 'resolved',
                            winner,
                            endPrice: finalPrice
                        };
                        nowExpired.push(resolved);
                    } else {
                        stillActive.push(bet);
                    }
                });

                if (hasChanges && nowExpired.length > 0) {
                    setRecentBets(prevRecents => [...nowExpired, ...prevRecents].slice(0, 10));
                    return stillActive;
                }

                return prev;
            });
        }, 100);

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
        storkPrices: simplePrices,
        isStorkConnected,
    };
}
