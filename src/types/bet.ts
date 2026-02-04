export interface FlashBet {
    id: string;
    title: string;
    category: 'NBA' | 'NFL' | 'Soccer' | 'Esports' | 'Crypto';
    optionA: BetOption;
    optionB: BetOption;
    createdAt: number;
    expiresAt: number;
    totalPool: number;
    status: 'active' | 'locked' | 'resolved';
    winner?: 'A' | 'B';
}

export interface BetOption {
    label: string;
    odds: number;
    totalBets: number;
    icon?: string;
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

export type BetCategory = FlashBet['category'];

export const CATEGORY_ICONS: Record<BetCategory, string> = {
    NBA: '🏀',
    NFL: '🏈',
    Soccer: '⚽',
    Esports: '🎮',
    Crypto: '₿',
};

export const CATEGORY_COLORS: Record<BetCategory, string> = {
    NBA: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    NFL: 'bg-green-500/20 text-green-400 border-green-500/30',
    Soccer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Esports: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Crypto: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};
