/**
 * ZKLogin Button Component
 *
 * Dark exchange-style login button supporting traditional wallet connection
 * and zkLogin (Google OAuth) for frictionless onboarding.
 */

import { useState } from "react";
import { useZKLogin } from "../hooks/useZKLogin";
import {
  User,
  LogOut,
  ChevronDown,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";

// Google Logo SVG
const GoogleLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

interface ZKLoginButtonProps {
  onConnectWallet?: () => void;
  className?: string;
}

export function ZKLoginButton({
  onConnectWallet,
  className,
}: ZKLoginButtonProps) {
  const { isLoading, isAuthenticated, user, loginWithGoogle, logout } =
    useZKLogin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border ${className}`}
        style={{
          borderRadius: "0px",
          background: "oklch(20% 0.02 270)",
          borderColor: "oklch(25% 0.03 270)",
          color: "oklch(55% 0.02 270)",
          fontFamily: '"Space Grotesk", monospace',
          letterSpacing: "0.05em",
        }}
      >
        <Loader2 size={16} className="animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  // Authenticated state - show user profile
  if (isAuthenticated && user) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex items-center gap-2 px-3 py-2 font-medium text-sm transition-all duration-200 border ${className}`}
          style={{
            borderRadius: "0px",
            background: "oklch(72% 0.19 195)",
            borderColor: "oklch(72% 0.19 195)",
            color: "oklch(10% 0.02 270)",
          }}
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name || "User"}
              className="w-6 h-6"
              style={{ borderRadius: "2px" }}
            />
          ) : (
            <div
              className="w-6 h-6 flex items-center justify-center"
              style={{
                borderRadius: "2px",
                background: "oklch(60% 0.15 195)",
              }}
            >
              <User size={14} style={{ color: "oklch(10% 0.02 270)" }} />
            </div>
          )}
          <span
            className="text-xs"
            style={{
              fontFamily: '"Space Grotesk", monospace',
              letterSpacing: "0.05em",
            }}
          >
            {truncateAddress(user.address)}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Menu — dark exchange */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu */}
            <div
              className="absolute right-0 top-full mt-2 w-72 overflow-hidden z-50 animate-[slide-down_0.2s_ease-out] border"
              style={{
                borderRadius: "4px",
                background: "oklch(16% 0.02 270)",
                borderColor: "oklch(25% 0.03 270)",
                boxShadow: "0 12px 32px -8px rgba(0,0,0,0.5)",
              }}
            >
              {/* User Info Header */}
              <div
                className="p-4"
                style={{ borderBottom: "1px solid oklch(25% 0.03 270)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || "User"}
                      className="w-10 h-10"
                      style={{ borderRadius: "2px" }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 flex items-center justify-center"
                      style={{
                        borderRadius: "2px",
                        background: "oklch(20% 0.02 270)",
                        border: "1px solid oklch(25% 0.03 270)",
                      }}
                    >
                      <User
                        size={20}
                        style={{ color: "oklch(55% 0.02 270)" }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium truncate"
                      style={{ color: "oklch(93% 0.01 270)" }}
                    >
                      {user.name || "Anonymous User"}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "oklch(55% 0.02 270)" }}
                    >
                      {user.email || "Connected via zkLogin"}
                    </p>
                  </div>
                </div>

                {/* Address with copy */}
                <div
                  className="flex items-center gap-2 p-2 border"
                  style={{
                    borderRadius: "2px",
                    background: "oklch(20% 0.02 270)",
                    borderColor: "oklch(25% 0.03 270)",
                  }}
                >
                  <span
                    className="flex-1 text-xs truncate"
                    style={{
                      fontFamily: '"Space Grotesk", monospace',
                      color: "oklch(65% 0.01 270)",
                    }}
                  >
                    {user.address}
                  </span>
                  <button
                    onClick={copyAddress}
                    title="Copy address"
                    className="p-1.5 transition-colors"
                    style={{ borderRadius: "2px" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "oklch(25% 0.03 270)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {copied ? (
                      <Check
                        size={14}
                        style={{ color: "oklch(72% 0.19 155)" }}
                      />
                    ) : (
                      <Copy
                        size={14}
                        style={{ color: "oklch(55% 0.02 270)" }}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <a
                  href={`https://suiscan.xyz/testnet/account/${user.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                  style={{
                    borderRadius: "2px",
                    color: "oklch(78% 0.01 270)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "oklch(20% 0.02 270)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <ExternalLink size={16} />
                  <span>View on Explorer</span>
                </a>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                  style={{
                    borderRadius: "2px",
                    color: "oklch(62% 0.22 25)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "oklch(20% 0.03 25)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut size={16} />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Not authenticated - show login options
  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-all duration-200 border ${className}`}
        style={{
          borderRadius: "0px",
          background: "oklch(72% 0.19 195)",
          borderColor: "oklch(72% 0.19 195)",
          color: "oklch(10% 0.02 270)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: '"Space Grotesk", monospace',
          fontSize: "0.75rem",
        }}
      >
        <Wallet size={16} />
        <span>Connect</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Login Options Dropdown — dark exchange */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu */}
          <div
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden z-50 animate-[slide-down_0.2s_ease-out] border"
            style={{
              borderRadius: "4px",
              background: "oklch(16% 0.02 270)",
              borderColor: "oklch(25% 0.03 270)",
              boxShadow: "0 12px 32px -8px rgba(0,0,0,0.5)",
            }}
          >
            <div className="p-3">
              <p
                className="text-xs mb-3 px-2 uppercase"
                style={{
                  color: "oklch(55% 0.02 270)",
                  fontFamily: '"Space Grotesk", monospace',
                  letterSpacing: "0.1em",
                  fontSize: "0.65rem",
                }}
              >
                Choose how to connect
              </p>

              {/* zkLogin with Google */}
              <button
                onClick={() => {
                  loginWithGoogle();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 mb-2 border"
                style={{
                  borderRadius: "2px",
                  background: "oklch(20% 0.02 270)",
                  borderColor: "oklch(25% 0.03 270)",
                  color: "oklch(93% 0.01 270)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(72% 0.19 195)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(25% 0.03 270)")
                }
              >
                <GoogleLogo />
                <span>Continue with Google</span>
                <span
                  className="ml-auto text-[10px] px-1.5 py-0.5 font-bold"
                  style={{
                    borderRadius: "2px",
                    background: "oklch(72% 0.19 195)",
                    color: "oklch(10% 0.02 270)",
                    fontFamily: '"Space Grotesk", monospace',
                    letterSpacing: "0.05em",
                  }}
                >
                  zkLogin
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3 px-2">
                <div
                  className="flex-1 h-px"
                  style={{ background: "oklch(25% 0.03 270)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "oklch(55% 0.02 270)" }}
                >
                  or
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "oklch(25% 0.03 270)" }}
                />
              </div>

              {/* Traditional Wallet */}
              <button
                onClick={() => {
                  onConnectWallet?.();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border"
                style={{
                  borderRadius: "2px",
                  background: "oklch(20% 0.02 270)",
                  borderColor: "oklch(25% 0.03 270)",
                  color: "oklch(93% 0.01 270)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(72% 0.19 195)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(25% 0.03 270)")
                }
              >
                <Wallet size={18} style={{ color: "oklch(72% 0.19 195)" }} />
                <span>Sui Wallet</span>
              </button>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 text-[11px]"
              style={{
                borderTop: "1px solid oklch(25% 0.03 270)",
                background: "oklch(13% 0.02 270)",
                color: "oklch(55% 0.02 270)",
              }}
            >
              zkLogin lets you sign in with Google — no wallet extension needed!
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ZKLoginButton;
