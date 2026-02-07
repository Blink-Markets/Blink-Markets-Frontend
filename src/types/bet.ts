export interface FlashBet {
    id: string;
    title: string;
    description?: string;
    category: BetCategory;
    imageUrl?: string;
    optionA: BetOption;
    optionB: BetOption;
    createdAt: number;
    expiresAt: number;
    totalPool: number;
    participants: number;
    status: 'created' | 'active' | 'locked' | 'resolved';
    winner?: 'A' | 'B';
    onchain?: {
        eventId: string;
        outcomeAIndex?: number;
        outcomeBIndex?: number;
    };
}

export interface BetOption {
    label: string;
    shortLabel?: string;
    odds: number;
    totalBets: number;
    percentage: number;
}

export interface UserBet {
    id: string;
    betId: string;
    choice: 'A' | 'B';
    amount: number;
    placedAt: number;
    status: 'pending' | 'won' | 'lost';
    payout?: number;
}

export type BetCategory = 'NBA' | 'NFL' | 'Soccer' | 'Esports' | 'Crypto' | 'All';

export const CATEGORIES: { id: BetCategory; label: string; icon: string; color: string }[] = [
    { id: 'All', label: 'All Markets', icon: '🔥', color: 'bg-gradient-to-r from-primary/20 to-info/20 text-foreground border-primary/30' },
    { id: 'NBA', label: 'Basketball', icon: '🏀', color: 'bg-warning-bg text-warning border-warning/30' },
    { id: 'NFL', label: 'Football', icon: '🏈', color: 'bg-success-bg text-success border-success/30' },
    { id: 'Soccer', label: 'Soccer', icon: '⚽', color: 'bg-info-bg text-info border-info/30' },
    { id: 'Esports', label: 'Esports', icon: '🎮', color: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30' },
    { id: 'Crypto', label: 'Crypto', icon: '₿', color: 'bg-warning-bg text-warning border-warning/30' },
];

export const CATEGORY_IMAGES: Record<Exclude<BetCategory, 'All'>, string[]> = {
    NBA: [
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=200&h=200&fit=crop',
    ],
    NFL: [
        'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&h=200&fit=crop',
    ],
    Soccer: [
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=200&h=200&fit=crop',
    ],
    Esports: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=200&h=200&fit=crop',
    ],
    Crypto: [
        'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=200&h=200&fit=crop',
    ],
};
