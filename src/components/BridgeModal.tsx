import type { WidgetConfig } from "@lifi/widget";
import { X, ArrowRightLeft, Sparkles } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

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
    import("@lifi/widget")
      .then((module) => {
        if (!isMounted) return;
        setLiFiWidgetComponent(() => module.LiFiWidget);
        setWidgetLoadError(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : "Unknown LI.FI widget error";
        setWidgetLoadError(message);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // LI.FI Widget configuration — dark exchange theme
  const widgetConfig: WidgetConfig = {
    variant: "compact",
    subvariant: "default",
    appearance: "dark",

    // Pre-configure destination to Sui
    toChain: 101, // Sui chain ID in LI.FI
    toToken: "0x2::sui::SUI", // Native SUI token

    // Allow popular source chains
    chains: {
      allow: [1, 42161, 10, 8453, 137, 56, 101], // ETH, Arbitrum, Optimism, Base, Polygon, BSC, Sui
    },

    // Dark exchange styling
    theme: {
      container: {
        border: "1px solid oklch(25% 0.03 270)",
        borderRadius: "4px",
        boxShadow: "none",
      },
      shape: {
        borderRadius: 2,
        borderRadiusSecondary: 2,
      },
      palette: {
        primary: { main: "oklch(72% 0.19 195)" },
        secondary: { main: "oklch(55% 0.02 270)" },
        background: {
          default: "oklch(16% 0.02 270)",
          paper: "oklch(20% 0.02 270)",
        },
        text: {
          primary: "oklch(93% 0.01 270)",
          secondary: "oklch(65% 0.01 270)",
        },
        grey: {
          200: "oklch(25% 0.03 270)",
          300: "oklch(30% 0.03 270)",
          700: "oklch(55% 0.02 270)",
          800: "oklch(20% 0.02 270)",
        },
      },
      typography: {
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
      },
    },

    // Hide powered by for cleaner look
    hiddenUI: ["poweredBy"],

    // Required for attribution
    integrator: "BlinkMarket",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — dark */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "oklch(5% 0 0 / 0.7)" }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md animate-[scale-in_0.3s_ease-out] border"
        style={{
          borderRadius: "4px",
          background: "oklch(16% 0.02 270)",
          borderColor: "oklch(25% 0.03 270)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center border"
              style={{
                borderRadius: "4px",
                background: "oklch(20% 0.02 270)",
                borderColor: "oklch(25% 0.03 270)",
              }}
            >
              <ArrowRightLeft
                size={20}
                style={{ color: "oklch(72% 0.19 195)" }}
              />
            </div>
            <div>
              <h2
                className="text-lg font-display font-medium"
                style={{ color: "oklch(93% 0.01 270)" }}
              >
                Bridge to Sui
              </h2>
              <p className="text-xs" style={{ color: "oklch(55% 0.02 270)" }}>
                Powered by LI.FI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close modal"
            className="p-2 transition-colors"
            style={{ borderRadius: "2px" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "oklch(20% 0.02 270)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X size={20} style={{ color: "oklch(55% 0.02 270)" }} />
          </button>
        </div>

        {/* Info Banner — dark */}
        <div
          className="mb-4 mx-6 p-3 flex items-start gap-3 border"
          style={{
            borderRadius: "2px",
            background: "oklch(20% 0.02 270)",
            borderColor: "oklch(25% 0.03 270)",
          }}
        >
          <Sparkles
            size={18}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "oklch(72% 0.19 195)" }}
          />
          <p className="text-sm" style={{ color: "oklch(78% 0.01 270)" }}>
            Bridge ETH, USDC, or any token from 30+ chains directly to Sui in
            one transaction.
          </p>
        </div>

        {/* LI.FI Widget */}
        <div className="px-6 pb-6 lifi-widget-container">
          {widgetLoadError ? (
            <div
              className="p-4 text-sm border"
              style={{
                borderRadius: "2px",
                background: "oklch(20% 0.03 25)",
                borderColor: "oklch(30% 0.04 25)",
                color: "oklch(62% 0.04 25)",
              }}
            >
              Failed to load bridge widget: {widgetLoadError}
            </div>
          ) : LiFiWidgetComponent ? (
            <LiFiWidgetComponent
              integrator="BlinkMarket"
              config={widgetConfig}
            />
          ) : (
            <div
              className="p-4 text-sm"
              style={{ color: "oklch(55% 0.02 270)" }}
            >
              Loading bridge widget...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Button to open the bridge modal — dark exchange style
interface BridgeButtonProps {
  onClick: () => void;
  className?: string;
}

export function BridgeButton({ onClick, className }: BridgeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all duration-300 border ${className}`}
      style={{
        borderRadius: "0px",
        background: "transparent",
        borderColor: "oklch(25% 0.03 270)",
        color: "oklch(78% 0.01 270)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontFamily: '"Space Grotesk", monospace',
        fontSize: "0.7rem",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "oklch(72% 0.19 195)";
        e.currentTarget.style.color = "oklch(72% 0.19 195)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "oklch(25% 0.03 270)";
        e.currentTarget.style.color = "oklch(78% 0.01 270)";
      }}
    >
      <ArrowRightLeft
        size={16}
        className="transition-transform group-hover:rotate-180"
      />
      <span>Bridge</span>
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
    toggle: () => setIsOpen((prev) => !prev),
  };
}
