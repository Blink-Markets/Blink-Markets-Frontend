import type { WidgetConfig } from '@lifi/widget';
import { X, ArrowRightLeft, Sparkles } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';

interface BridgeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BridgeModal({ isOpen, onClose }: BridgeModalProps) {
    const [LiFiWidgetComponent, setLiFiWidgetComponent] = useState<ComponentType<{
        integrator: string;
        config: WidgetConfig;
    }> | null>(null);
    const [widgetLoadError, setWidgetLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        import('@lifi/widget')
            .then((module) => {
                if (!isMounted) return;
                setLiFiWidgetComponent(() => module.LiFiWidget);
                setWidgetLoadError(null);
            })
            .catch((error: unknown) => {
                if (!isMounted) return;
                const message = error instanceof Error ? error.message : 'Unknown LI.FI widget error';
                setWidgetLoadError(message);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // LI.FI Widget configuration optimized for Sui
    const widgetConfig: WidgetConfig = {
        variant: 'compact',
        subvariant: 'default',
        appearance: 'dark',

        // Pre-configure destination to Sui
        toChain: 101, // Sui chain ID in LI.FI
        toToken: '0x2::sui::SUI', // Native SUI token

        // Allow popular source chains
        chains: {
            allow: [1, 42161, 10, 8453, 137, 56, 101], // ETH, Arbitrum, Optimism, Base, Polygon, BSC, Sui
        },

        // Sui-themed styling
        theme: {
            container: {
                border: '1px solid rgba(77, 162, 255, 0.2)',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px rgba(77, 162, 255, 0.1)',
            },
            shape: {
                borderRadius: 12,
                borderRadiusSecondary: 8,
            },
            palette: {
                primary: { main: '#4DA2FF' },
                secondary: { main: '#00D4FF' },
                background: {
                    default: '#050B15',
                    paper: '#0D1B2A',
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#A3B8D5',
                },
                grey: {
                    200: '#1A2D45',
                    300: '#162235',
                    700: '#6B7C95',
                    800: '#0A1628',
                },
            },
            typography: {
                fontFamily: 'Inter, system-ui, sans-serif',
            },
        },

        // Hide powered by for cleaner look
        hiddenUI: ['poweredBy'],

        // Required for attribution
        integrator: 'BlinkMarket',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md animate-[scale-in_0.3s_ease-out]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #4DA2FF, #00D4FF)',
                            }}
                        >
                            <ArrowRightLeft size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Bridge to Sui</h2>
                            <p className="text-sm text-foreground-tertiary">Powered by LI.FI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={20} className="text-foreground-secondary" />
                    </button>
                </div>

                {/* Info Banner */}
                <div
                    className="mb-4 p-3 rounded-xl flex items-start gap-3"
                    style={{
                        background: 'rgba(77, 162, 255, 0.08)',
                        border: '1px solid rgba(77, 162, 255, 0.15)',
                    }}
                >
                    <Sparkles size={18} className="text-[#4DA2FF] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground-secondary">
                        Bridge ETH, USDC, or any token from 30+ chains directly to Sui in one transaction.
                    </p>
                </div>

                {/* LI.FI Widget */}
                <div className="lifi-widget-container">
                    {widgetLoadError ? (
                        <div
                            className="rounded-xl p-4 text-sm"
                            style={{
                                background: 'rgba(255, 77, 106, 0.08)',
                                border: '1px solid rgba(255, 77, 106, 0.2)',
                                color: '#FF9AA9',
                            }}
                        >
                            Failed to load bridge widget: {widgetLoadError}
                        </div>
                    ) : LiFiWidgetComponent ? (
                        <LiFiWidgetComponent integrator="BlinkMarket" config={widgetConfig} />
                    ) : (
                        <div className="rounded-xl p-4 text-sm text-foreground-secondary">
                            Loading bridge widget...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Button to open the bridge modal
interface BridgeButtonProps {
    onClick: () => void;
    className?: string;
}

export function BridgeButton({ onClick, className }: BridgeButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-105 ${className}`}
            style={{
                background: 'linear-gradient(135deg, rgba(77, 162, 255, 0.15), rgba(0, 212, 255, 0.1))',
                border: '1px solid rgba(77, 162, 255, 0.25)',
                color: '#4DA2FF',
            }}
        >
            <ArrowRightLeft size={16} className="transition-transform group-hover:rotate-180" />
            <span>Bridge to Sui</span>
        </button>
    );
}

// Hook to manage bridge modal state
export function useBridgeModal() {
    const [isOpen, setIsOpen] = useState(false);

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev),
    };
}
