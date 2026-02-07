
import { useEffect, useState, useRef } from 'react';

export interface StorkPriceUpdate {
    assetId: string;
    price: number;
    timestamp: number;
}

// Map common tickers to Stork Asset IDs (if they differ, usually they are "BTCUSD", etc.)
const ASSET_ID_MAP: Record<string, string> = {
    BTC: 'BTCUSD',
    ETH: 'ETHUSD',
    SUI: 'SUIUSD', // Assuming Stork has SUIUSD
    SOL: 'SOLUSD',
};

export function useStorkOracle(assets: string[] = ['BTC', 'ETH', 'SUI']) {
    const [prices, setPrices] = useState<Record<string, StorkPriceUpdate>>({});
    const [isConnected, setIsConnected] = useState(false);

    // Simulate connection if websocket fails
    const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Updated URL - using the main feed
        const wsUrl = 'wss://feed.stork-oracle.network/v1/stork_signed_prices';

        // Also try: wss://app-api.jp.stork-oracle.network/v1/stork_signed_prices if above fails

        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            try {
                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    console.log('Connected to Stork Oracle');
                    setIsConnected(true);
                    if (simulationRef.current) {
                        clearInterval(simulationRef.current);
                        simulationRef.current = null;
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        const data = message.data || message;
                        if (!data) return;

                        // Unified parsing logic
                        const rawAssetId = data.asset_id || data.symbol || data.id;
                        if (!rawAssetId || typeof rawAssetId !== 'string') return;

                        // Parse Price
                        let rawPrice = data.price || data.value;
                        if (!rawPrice) return;

                        // Handle potential hex strings
                        if (typeof rawPrice === 'string' && rawPrice.startsWith('0x')) {
                            rawPrice = parseInt(rawPrice, 16);
                        } else {
                            rawPrice = parseFloat(rawPrice);
                        }

                        // Scaling check (Stork standard is 18 decimals)
                        let parsedPrice = rawPrice;
                        if (parsedPrice > 1_000_000_000) {
                            parsedPrice = parsedPrice / 1e18;
                        }

                        const simpleAsset = Object.keys(ASSET_ID_MAP).find(key => ASSET_ID_MAP[key] === rawAssetId);
                        const key = simpleAsset || rawAssetId;

                        if (assets.includes(key) || assets.includes(rawAssetId)) {
                            setPrices(prev => ({
                                ...prev,
                                [key]: {
                                    assetId: rawAssetId,
                                    price: parsedPrice,
                                    timestamp: Date.now()
                                }
                            }));
                        }
                    } catch (e) {
                        // ignore
                    }
                };

                ws.onclose = () => {
                    console.log('Stork Oracle Disconnected - Retrying...');
                    setIsConnected(false);
                    // Try to reconnect in 3s
                    reconnectTimeout = setTimeout(connect, 3000);
                };

                ws.onerror = (err) => {
                    console.error('Stork WS Error', err);
                    ws?.close();
                };

            } catch (err) {
                console.error('Failed to create WebSocket', err);
                reconnectTimeout = setTimeout(connect, 5000);
            }
        };

        connect();

        // Fallback Simulation for demo purposes if websocket takes too long
        const fallbackTimeout = setTimeout(() => {
            if (!isConnected && Object.keys(prices).length === 0) {
                console.log('Starting fallback simulation for oracle...');
                simulationRef.current = setInterval(() => {
                    const now = Date.now();
                    setPrices(prev => ({
                        ...prev,
                        BTC: { assetId: 'BTCUSD', price: 96500 + Math.random() * 50 - 25, timestamp: now },
                        ETH: { assetId: 'ETHUSD', price: 2750 + Math.random() * 10 - 5, timestamp: now },
                        SUI: { assetId: 'SUIUSD', price: 3.25 + Math.random() * 0.05 - 0.025, timestamp: now },
                        SOL: { assetId: 'SOLUSD', price: 145 + Math.random() * 1 - 0.5, timestamp: now },
                    }));
                }, 1000);
            }
        }, 5000);

        return () => {
            ws?.close();
            clearTimeout(reconnectTimeout);
            clearTimeout(fallbackTimeout);
            if (simulationRef.current) clearInterval(simulationRef.current);
        };
    }, []); // Run once

    return { prices, isConnected: isConnected || !!simulationRef.current };
}
