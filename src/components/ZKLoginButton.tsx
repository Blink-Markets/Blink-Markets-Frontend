/**
 * ZKLogin Button Component
 * 
 * A beautiful login button that supports both traditional wallet connection
 * and zkLogin (Google OAuth) for a frictionless onboarding experience.
 */

import { useState } from 'react';
import { useZKLogin } from '../hooks/useZKLogin';
import {
    User,
    LogOut,
    ChevronDown,
    Wallet,
    Copy,
    Check,
    ExternalLink,
    Loader2
} from 'lucide-react';

// Google Logo SVG
const GoogleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

interface ZKLoginButtonProps {
    onConnectWallet?: () => void;
    className?: string;
}

export function ZKLoginButton({ onConnectWallet, className }: ZKLoginButtonProps) {
    const { isLoading, isAuthenticated, user, loginWithGoogle, logout } = useZKLogin();
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm ${className}`}
                style={{
                    background: 'rgba(77, 162, 255, 0.1)',
                    border: '1px solid rgba(77, 162, 255, 0.2)',
                    color: '#A3B8D5',
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] ${className}`}
                    style={{
                        background: 'linear-gradient(135deg, rgba(0, 229, 160, 0.15), rgba(0, 212, 255, 0.1))',
                        border: '1px solid rgba(0, 229, 160, 0.25)',
                    }}
                >
                    {user.picture ? (
                        <img
                            src={user.picture}
                            alt={user.name || 'User'}
                            className="w-6 h-6 rounded-full ring-2 ring-[#00E5A0]/30"
                        />
                    ) : (
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #4DA2FF, #00D4FF)' }}
                        >
                            <User size={14} className="text-white" />
                        </div>
                    )}
                    <span className="text-white font-mono text-xs">
                        {truncateAddress(user.address)}
                    </span>
                    <ChevronDown
                        size={14}
                        className={`text-foreground-secondary transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsMenuOpen(false)}
                        />

                        {/* Menu */}
                        <div
                            className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-50 animate-[slide-down_0.2s_ease-out]"
                            style={{
                                background: 'linear-gradient(135deg, #0D1B2A 0%, #122640 100%)',
                                border: '1px solid rgba(77, 162, 255, 0.15)',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                            }}
                        >
                            {/* User Info Header */}
                            <div
                                className="p-4"
                                style={{ borderBottom: '1px solid rgba(77, 162, 255, 0.1)' }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {user.picture ? (
                                        <img
                                            src={user.picture}
                                            alt={user.name || 'User'}
                                            className="w-10 h-10 rounded-full ring-2 ring-[#4DA2FF]/30"
                                        />
                                    ) : (
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #4DA2FF, #00D4FF)' }}
                                        >
                                            <User size={20} className="text-white" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">
                                            {user.name || 'Anonymous User'}
                                        </p>
                                        <p className="text-xs text-foreground-tertiary truncate">
                                            {user.email || 'Connected via zkLogin'}
                                        </p>
                                    </div>
                                </div>

                                {/* Address with copy */}
                                <div
                                    className="flex items-center gap-2 p-2 rounded-lg"
                                    style={{ background: 'rgba(77, 162, 255, 0.08)' }}
                                >
                                    <span className="flex-1 font-mono text-xs text-foreground-secondary truncate">
                                        {user.address}
                                    </span>
                                    <button
                                        onClick={copyAddress}
                                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                                    >
                                        {copied ? (
                                            <Check size={14} className="text-[#00E5A0]" />
                                        ) : (
                                            <Copy size={14} className="text-foreground-secondary" />
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
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground-secondary hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    <span>View on Explorer</span>
                                </a>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#FF4D6A] hover:bg-[#FF4D6A]/10 transition-colors"
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] ${className}`}
                style={{
                    background: 'linear-gradient(135deg, #4DA2FF, #00D4FF)',
                    color: '#050B15',
                    boxShadow: '0 4px 20px rgba(77, 162, 255, 0.3)',
                }}
            >
                <Wallet size={16} />
                <span>Connect</span>
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Login Options Dropdown */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Menu */}
                    <div
                        className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden z-50 animate-[slide-down_0.2s_ease-out]"
                        style={{
                            background: 'linear-gradient(135deg, #0D1B2A 0%, #122640 100%)',
                            border: '1px solid rgba(77, 162, 255, 0.15)',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                        }}
                    >
                        <div className="p-3">
                            <p className="text-xs text-foreground-tertiary mb-3 px-2">
                                Choose how to connect
                            </p>

                            {/* zkLogin with Google */}
                            <button
                                onClick={() => {
                                    loginWithGoogle();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition-all duration-200 mb-2"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                <GoogleLogo />
                                <span>Continue with Google</span>
                                <span
                                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold"
                                    style={{
                                        background: 'rgba(0, 229, 160, 0.15)',
                                        color: '#00E5A0',
                                    }}
                                >
                                    zkLogin
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-3 px-2">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-foreground-tertiary">or</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {/* Traditional Wallet */}
                            <button
                                onClick={() => {
                                    onConnectWallet?.();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition-all duration-200"
                                style={{
                                    background: 'rgba(77, 162, 255, 0.1)',
                                    border: '1px solid rgba(77, 162, 255, 0.2)',
                                }}
                            >
                                <Wallet size={18} className="text-[#4DA2FF]" />
                                <span>Sui Wallet</span>
                            </button>
                        </div>

                        {/* Footer */}
                        <div
                            className="px-4 py-3 text-[11px] text-foreground-tertiary"
                            style={{
                                borderTop: '1px solid rgba(77, 162, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            zkLogin lets you sign in with Google - no wallet extension needed!
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ZKLoginButton;
