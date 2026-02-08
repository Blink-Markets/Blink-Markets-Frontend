import { BetCategory, CATEGORIES } from '../types/bet';
import { cn } from '../lib/utils';

interface CategoryTabsProps {
    selected: BetCategory;
    onSelect: (category: BetCategory) => void;
    counts: Record<BetCategory, number>;
}

// Sui-themed category colors
const categoryColors: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
    'All': {
        bg: 'rgba(77, 162, 255, 0.08)',
        border: 'rgba(77, 162, 255, 0.2)',
        text: '#4DA2FF',
        activeBg: 'linear-gradient(135deg, rgba(77, 162, 255, 0.2), rgba(0, 212, 255, 0.15))'
    },
    'Sports': {
        bg: 'rgba(0, 229, 160, 0.08)',
        border: 'rgba(0, 229, 160, 0.2)',
        text: '#00E5A0',
        activeBg: 'linear-gradient(135deg, rgba(0, 229, 160, 0.2), rgba(0, 245, 184, 0.15))'
    },
    'Crypto': {
        bg: 'rgba(255, 184, 77, 0.08)',
        border: 'rgba(255, 184, 77, 0.2)',
        text: '#FFB84D',
        activeBg: 'linear-gradient(135deg, rgba(255, 184, 77, 0.2), rgba(255, 200, 112, 0.15))'
    },
    'E-Sports': {
        bg: 'rgba(138, 99, 255, 0.08)',
        border: 'rgba(138, 99, 255, 0.2)',
        text: '#8A63FF',
        activeBg: 'linear-gradient(135deg, rgba(138, 99, 255, 0.2), rgba(167, 139, 250, 0.15))'
    },
    'Politics': {
        bg: 'rgba(255, 77, 106, 0.08)',
        border: 'rgba(255, 77, 106, 0.2)',
        text: '#FF4D6A',
        activeBg: 'linear-gradient(135deg, rgba(255, 77, 106, 0.2), rgba(255, 107, 129, 0.15))'
    },
    'Random': {
        bg: 'rgba(0, 212, 255, 0.08)',
        border: 'rgba(0, 212, 255, 0.2)',
        text: '#00D4FF',
        activeBg: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 229, 160, 0.15))'
    },
};

export function CategoryTabs({ selected, onSelect, counts }: CategoryTabsProps) {
    return (
        <div className="relative">
            {/* Background blur container */}
            <div className="absolute inset-0 -z-10 rounded-2xl bg-[#0D1B2A]/50 backdrop-blur-sm" />

            <div className="flex flex-wrap gap-2 p-2">
                {CATEGORIES.map((category, index) => {
                    const isActive = selected === category.id;
                    const count = category.id === 'All'
                        ? Object.values(counts).reduce((a, b) => a + b, 0)
                        : counts[category.id] || 0;

                    const colors = categoryColors[category.label] || categoryColors['All'];

                    return (
                        <button
                            key={category.id}
                            onClick={() => onSelect(category.id)}
                            className={cn(
                                'category-pill relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
                                'transition-all duration-300 ease-out',
                                'border backdrop-blur-sm',
                                isActive && 'active'
                            )}
                            style={{
                                background: isActive ? colors.activeBg : colors.bg,
                                borderColor: isActive ? colors.text : colors.border,
                                color: isActive ? colors.text : '#A3B8D5',
                                boxShadow: isActive
                                    ? `0 4px 20px ${colors.border}, inset 0 0 20px ${colors.bg}`
                                    : 'none',
                                animationDelay: `${index * 50}ms`
                            }}
                        >
                            {/* Active indicator glow */}
                            {isActive && (
                                <div
                                    className="absolute inset-0 rounded-xl opacity-50 blur-md -z-10"
                                    style={{ background: colors.border }}
                                />
                            )}

                            <span className="text-base">{category.icon}</span>
                            <span className="font-medium">{category.label}</span>

                            {count > 0 && (
                                <span
                                    className={cn(
                                        'ml-0.5 px-2 py-0.5 rounded-lg text-xs font-bold',
                                        'transition-all duration-200'
                                    )}
                                    style={{
                                        background: isActive
                                            ? `${colors.text}20`
                                            : 'rgba(77, 162, 255, 0.1)',
                                        color: isActive ? colors.text : '#6B7C95'
                                    }}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
