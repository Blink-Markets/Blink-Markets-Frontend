
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStorkOracle } from '../hooks/useStorkOracle';

export function LiveTicker() {
    // Subscribe to all display assets
    const { prices } = useStorkOracle(['BTC', 'ETH', 'SUI', 'SOL']);

    // Sort assets consistently
    const sortedAssets = useMemo(() => {
        return Object.keys(prices).sort();
    }, [prices]);

    // Use a placeholder list if waiting for data to prevent empty bar
    const displayAssets = sortedAssets.length > 0 ? sortedAssets : ['BTC', 'ETH', 'SUI'];

    // If no prices yet, mock some for layout stability or show "Connecting"
    const getContent = (asset: string) => {
        const data = prices[asset];
        if (!data) return (
            <span className="font-mono text-sm text-[#4DA2FF]/50 animate-pulse">
                Loading...
            </span>
        );
        return (
            <span className="font-mono text-sm text-[#4DA2FF]">
                ${data.price.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2
                })}
            </span>
        );
    };

    return (
        <div className="w-full bg-[#0D1B2A] border-b border-[#4DA2FF]/20 overflow-hidden relative z-40 h-8 flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0D1B2A] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0D1B2A] to-transparent z-10 pointer-events-none" />

            <motion.div
                className="flex whitespace-nowrap items-center"
                initial={{ x: "0%" }}
                animate={{ x: "-50%" }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 30
                }}
            >
                {/* Duplicate the list to create seamless loop - ensure enough content to scroll */}
                {[...displayAssets, ...displayAssets, ...displayAssets, ...displayAssets, ...displayAssets, ...displayAssets].map((asset, index) => (
                    <div key={`${asset}-${index}`} className="flex items-center gap-2 mx-6">
                        <span className="font-bold text-xs text-[#A3B8D5]">{asset}</span>
                        {getContent(asset)}
                        <span className="text-[9px] font-bold text-[#4DA2FF]/40 border border-[#4DA2FF]/20 rounded px-1 uppercase">
                            Stork
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
