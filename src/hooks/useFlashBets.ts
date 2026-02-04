import { useState, useEffect, useCallback } from 'react';
import { FlashBet, BetCategory } from '../types/bet';

// Simulated flash bet generator for demo
const SAMPLE_BETS: Omit<FlashBet, 'id' | 'createdAt' | 'expiresAt' | 'status'>[] = [
    {
        title: 'Next 3-pointer scorer',
        category: 'NBA',
        optionA: { label: 'Lakers', odds: 1.85, totalBets: 2500 },
        optionB: { label: 'Celtics', odds: 2.10, totalBets: 1800 },
        totalPool: 4300,
    },
    {
        title: 'Next touchdown',
        category: 'NFL',
        optionA: { label: 'Chiefs', odds: 1.75, totalBets: 3200 },
        optionB: { label: '49ers', odds: 2.25, totalBets: 2100 },
        totalPool: 5300,
    },
    {
        title: 'Next goal scorer',
        category: 'Soccer',
        optionA: { label: 'Man City', odds: 1.90, totalBets: 4100 },
        optionB: { label: 'Real Madrid', odds: 1.95, totalBets: 3900 },
        totalPool: 8000,
    },
    {
        title: 'Next kill',
        category: 'Esports',
        optionA: { label: 'Team Liquid', odds: 1.65, totalBets: 1500 },
        optionB: { label: 'Fnatic', odds: 2.40, totalBets: 900 },
        totalPool: 2400,
    },
    {
        title: 'BTC next minute candle',
        category: 'Crypto',
        optionA: { label: 'Green 📈', odds: 1.95, totalBets: 5500 },
        optionB: { label: 'Red 📉', odds: 1.90, totalBets: 5800 },
        totalPool: 11300,
    },
];

function generateBet(): FlashBet {
    const template = SAMPLE_BETS[Math.floor(Math.random() * SAMPLE_BETS.length)];
    const now = Date.now();
    const duration = 10000 + Math.random() * 5000; // 10-15 seconds

    return {
        ...template,
        id: `bet-${now}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        expiresAt: now + duration,
        status: 'active',
        optionA: {
            ...template.optionA,
            totalBets: Math.floor(template.optionA.totalBets * (0.8 + Math.random() * 0.4)),
        },
        optionB: {
            ...template.optionB,
            totalBets: Math.floor(template.optionB.totalBets * (0.8 + Math.random() * 0.4)),
        },
        totalPool: Math.floor(template.totalPool * (0.8 + Math.random() * 0.4)),
    };
}

export function useFlashBets() {
    const [activeBets, setActiveBets] = useState<FlashBet[]>([]);
    const [recentBets, setRecentBets] = useState<FlashBet[]>([]);

    // Generate initial bets
    useEffect(() => {
        const initialBets = Array.from({ length: 3 }, () => generateBet());
        setActiveBets(initialBets);
    }, []);

    // Add new bets periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeBets.length < 5) {
                const newBet = generateBet();
                setActiveBets(prev => [...prev, newBet]);
            }
        }, 8000); // New bet every 8 seconds

        return () => clearInterval(interval);
    }, [activeBets.length]);

    // Check for expired bets and resolve them
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            setActiveBets(prev => {
                const stillActive: FlashBet[] = [];
                const nowExpired: FlashBet[] = [];

                prev.forEach(bet => {
                    if (bet.expiresAt <= now) {
                        // Resolve the bet
                        const resolved: FlashBet = {
                            ...bet,
                            status: 'resolved',
                            winner: Math.random() > 0.5 ? 'A' : 'B',
                        };
                        nowExpired.push(resolved);
                    } else {
                        stillActive.push(bet);
                    }
                });

                if (nowExpired.length > 0) {
                    setRecentBets(prev => [...nowExpired, ...prev].slice(0, 10));
                }

                return stillActive;
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const placeBet = useCallback((betId: string, choice: 'A' | 'B', amount: number) => {
        setActiveBets(prev =>
            prev.map(bet => {
                if (bet.id === betId && bet.status === 'active') {
                    const updatedBet = { ...bet };
                    if (choice === 'A') {
                        updatedBet.optionA = {
                            ...bet.optionA,
                            totalBets: bet.optionA.totalBets + amount,
                        };
                    } else {
                        updatedBet.optionB = {
                            ...bet.optionB,
                            totalBets: bet.optionB.totalBets + amount,
                        };
                    }
                    updatedBet.totalPool = bet.totalPool + amount;
                    return updatedBet;
                }
                return bet;
            })
        );
    }, []);

    return {
        activeBets,
        recentBets,
        placeBet,
    };
}
