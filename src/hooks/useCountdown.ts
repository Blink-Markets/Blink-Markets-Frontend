import { useState, useEffect, useCallback } from 'react';

interface CountdownState {
    timeLeft: number;
    percentage: number;
    isUrgent: boolean;
    isCritical: boolean;
    isExpired: boolean;
    formattedTime: string;
}

export function useCountdown(expiresAt: number, duration: number = 10000): CountdownState {
    const calculateTimeLeft = useCallback(() => {
        const now = Date.now();
        return Math.max(0, expiresAt - now);
    }, [expiresAt]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

    useEffect(() => {
        const interval = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft <= 0) {
                clearInterval(interval);
            }
        }, 50); // Update every 50ms for smooth countdown

        return () => clearInterval(interval);
    }, [calculateTimeLeft]);

    const percentage = Math.max(0, Math.min(100, (timeLeft / duration) * 100));
    const seconds = Math.ceil(timeLeft / 1000);
    const milliseconds = Math.floor((timeLeft % 1000) / 10);

    return {
        timeLeft,
        percentage,
        isUrgent: timeLeft <= 5000 && timeLeft > 2000,
        isCritical: timeLeft <= 2000 && timeLeft > 0,
        isExpired: timeLeft <= 0,
        formattedTime: timeLeft > 0
            ? `${seconds}.${milliseconds.toString().padStart(2, '0')}`
            : '0.00',
    };
}
