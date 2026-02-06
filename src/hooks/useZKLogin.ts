/**
 * ZKLogin Integration for Sui
 * 
 * This module provides Google/OAuth login functionality using Sui's zkLogin.
 * Users can sign in with their Google account and get a Sui wallet address.
 * 
 * Flow:
 * 1. Generate ephemeral key pair
 * 2. Redirect user to Google OAuth
 * 3. Receive JWT token
 * 4. Generate ZK proof
 * 5. Derive Sui address
 */

import { useState, useCallback, useEffect } from 'react';
import {
    generateNonce,
    generateRandomness,
    getExtendedEphemeralPublicKey,
    jwtToAddress,
} from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const REDIRECT_URI = import.meta.env.VITE_ZKLOGIN_REDIRECT_URI || window.location.origin;

// Salt service - In production, use a secure backend service
const SALT_SERVICE_URL = import.meta.env.VITE_SALT_SERVICE_URL || 'https://salt.api.mystenlabs.com/get_salt';

// Proving service - Mysten Labs provides this
const PROVING_SERVICE_URL = import.meta.env.VITE_PROVING_SERVICE_URL || 'https://prover-dev.mystenlabs.com/v1';

// Storage keys
const STORAGE_KEYS = {
    EPHEMERAL_KEY: 'zklogin_ephemeral_key',
    RANDOMNESS: 'zklogin_randomness',
    MAX_EPOCH: 'zklogin_max_epoch',
    JWT: 'zklogin_jwt',
    USER_SALT: 'zklogin_user_salt',
    ZK_PROOF: 'zklogin_zk_proof',
    SUI_ADDRESS: 'zklogin_sui_address',
    USER_INFO: 'zklogin_user_info',
};

export interface ZKLoginUser {
    address: string;
    email?: string;
    name?: string;
    picture?: string;
    provider: 'google';
}

export interface ZKLoginState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: ZKLoginUser | null;
    error: string | null;
}

/**
 * Parse JWT to extract user info
 */
function parseJwt(token: string): Record<string, unknown> {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
}

/**
 * Get current epoch from Sui network
 */
async function getCurrentEpoch(): Promise<number> {
    try {
        const response = await fetch('https://fullnode.testnet.sui.io:443', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'suix_getLatestSuiSystemState',
                params: [],
            }),
        });
        const data = await response.json();
        return Number(data.result.epoch);
    } catch (error) {
        console.error('Failed to get current epoch:', error);
        return 0;
    }
}

/**
 * Get user salt from salt service
 */
async function getUserSalt(jwt: string): Promise<string> {
    try {
        const response = await fetch(SALT_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jwt }),
        });
        const data = await response.json();
        return data.salt;
    } catch (error) {
        console.error('Failed to get user salt:', error);
        // Fallback: Generate a deterministic salt from JWT sub claim
        const payload = parseJwt(jwt);
        const sub = payload.sub as string;
        const encoder = new TextEncoder();
        const data = encoder.encode(sub + 'blink_market_salt_v1');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return BigInt('0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')).toString();
    }
}

/**
 * Generate ZK proof from proving service
 */
async function generateZkProof(params: {
    jwt: string;
    ephemeralPublicKey: string;
    maxEpoch: number;
    randomness: string;
    salt: string;
    keyClaimName: string;
}): Promise<unknown> {
    const response = await fetch(PROVING_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jwt: params.jwt,
            extendedEphemeralPublicKey: params.ephemeralPublicKey,
            maxEpoch: params.maxEpoch,
            jwtRandomness: params.randomness,
            salt: params.salt,
            keyClaimName: params.keyClaimName,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate ZK proof');
    }

    return response.json();
}

/**
 * Hook for ZKLogin functionality
 */
export function useZKLogin() {
    const [state, setState] = useState<ZKLoginState>({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
    });

    /**
     * Logout and clear stored data
     */
    const logout = useCallback(() => {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        setState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: null,
        });
    }, []);

    /**
     * Handle OAuth callback
     */
    const handleOAuthCallback = useCallback(async () => {
        // Check for JWT in URL hash (Google returns it as id_token in fragment)
        const hash = window.location.hash;
        if (!hash.includes('id_token=')) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Extract JWT from URL
            const urlParams = new URLSearchParams(hash.substring(1));
            const jwt = urlParams.get('id_token');

            if (!jwt) {
                throw new Error('No ID token found in callback');
            }

            // Clear URL hash
            window.history.replaceState(null, '', window.location.pathname);

            // Parse JWT for user info
            const jwtPayload = parseJwt(jwt);
            const userInfo = {
                email: jwtPayload.email as string,
                name: jwtPayload.name as string,
                picture: jwtPayload.picture as string,
                sub: jwtPayload.sub as string,
                aud: jwtPayload.aud as string,
                iss: jwtPayload.iss as string,
            };

            localStorage.setItem(STORAGE_KEYS.JWT, jwt);
            localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));

            // Get stored values
            const maxEpoch = parseInt(localStorage.getItem(STORAGE_KEYS.MAX_EPOCH) || '0');
            const randomness = localStorage.getItem(STORAGE_KEYS.RANDOMNESS) || '';

            // Get user salt
            const salt = await getUserSalt(jwt);
            localStorage.setItem(STORAGE_KEYS.USER_SALT, salt);

            // Compute Sui address from JWT (legacyAddress = false for new addresses)
            const address = jwtToAddress(jwt, salt, false);
            localStorage.setItem(STORAGE_KEYS.SUI_ADDRESS, address);

            // Generate ZK proof (async, may take a few seconds)
            const ephemeralKeyStr = localStorage.getItem(STORAGE_KEYS.EPHEMERAL_KEY);
            if (ephemeralKeyStr) {
                try {
                    const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(
                        Uint8Array.from(atob(ephemeralKeyStr), c => c.charCodeAt(0))
                    );
                    const extendedKey = getExtendedEphemeralPublicKey(
                        ephemeralKeyPair.getPublicKey()
                    );

                    const zkProof = await generateZkProof({
                        jwt,
                        ephemeralPublicKey: extendedKey,
                        maxEpoch,
                        randomness,
                        salt,
                        keyClaimName: 'sub',
                    });

                    localStorage.setItem(STORAGE_KEYS.ZK_PROOF, JSON.stringify(zkProof));
                } catch (proofError) {
                    console.warn('ZK proof generation failed, continuing without proof:', proofError);
                }
            }

            // Update state
            setState({
                isLoading: false,
                isAuthenticated: true,
                user: {
                    address,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    provider: 'google',
                },
                error: null,
            });

        } catch (error) {
            console.error('OAuth callback failed:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Authentication failed',
            }));
        }
    }, []);

    // Check for existing session on mount
    useEffect(() => {
        const savedAddress = localStorage.getItem(STORAGE_KEYS.SUI_ADDRESS);
        const savedUserInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);

        if (savedAddress && savedUserInfo) {
            try {
                const userInfo = JSON.parse(savedUserInfo);
                setState({
                    isLoading: false,
                    isAuthenticated: true,
                    user: {
                        address: savedAddress,
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture,
                        provider: 'google',
                    },
                    error: null,
                });
            } catch {
                // Invalid stored data, clear it
                logout();
            }
        }

        // Check for OAuth callback
        handleOAuthCallback();
    }, [handleOAuthCallback, logout]);

    /**
     * Initiate Google login
     */
    const loginWithGoogle = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // 1. Generate ephemeral key pair
            const ephemeralKeyPair = new Ed25519Keypair();

            // Store private key for later use
            localStorage.setItem(
                STORAGE_KEYS.EPHEMERAL_KEY,
                ephemeralKeyPair.getSecretKey()
            );

            // 2. Get current epoch and calculate max epoch (valid for ~24 hours)
            const currentEpoch = await getCurrentEpoch();
            const maxEpoch = currentEpoch + 10; // Valid for ~10 epochs
            localStorage.setItem(STORAGE_KEYS.MAX_EPOCH, maxEpoch.toString());

            // 3. Generate randomness
            const randomness = generateRandomness();
            localStorage.setItem(STORAGE_KEYS.RANDOMNESS, randomness);

            // 4. Generate nonce from ephemeral public key
            const nonce = generateNonce(
                ephemeralKeyPair.getPublicKey(),
                maxEpoch,
                randomness
            );

            // 5. Build Google OAuth URL
            const oauthParams = new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                response_type: 'id_token',
                scope: 'openid email profile',
                nonce: nonce,
            });

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${oauthParams.toString()}`;

            // 6. Redirect to Google
            window.location.href = authUrl;

        } catch (error) {
            console.error('Login failed:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Login failed',
            }));
        }
    }, []);

    return {
        ...state,
        loginWithGoogle,
        logout,
    };
}

export default useZKLogin;
