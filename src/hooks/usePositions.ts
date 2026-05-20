// Hook for fetching and enriching user's Position objects from the new blink_market contract

import { useState, useEffect, useCallback } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import {
    ParsedPosition,
    ParsedMarket,
    PositionWithMarket,
    parsePosition,
    parseMarket,
    canRedeemPosition,
} from "../types/contractTypes";
import { PACKAGE_ID, COIN_TYPE } from "../lib/constants";

interface UsePositionsOptions {
    enabled?: boolean;
    pollInterval?: number;
}

export function usePositions(options: UsePositionsOptions = {}) {
    const { enabled = true, pollInterval = 5000 } = options;

    const dAppKit = useDAppKit();
    const account = useCurrentAccount();
    const [positions, setPositions] = useState<ParsedPosition[]>([]);
    const [markets, setMarkets] = useState<Record<string, ParsedMarket>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchPositions = useCallback(async () => {
        if (!account?.address || !PACKAGE_ID || !COIN_TYPE) return;

        try {
            setIsLoading(true);
            setError(null);

            const client = dAppKit.getClient();

            // Fetch all Position<CoinType> objects owned by user
            const ownedObjects = await client.getOwnedObjects({
                owner: account.address,
                filter: {
                    // Position<CoinType> from the blink_market::market module
                    StructType: `${PACKAGE_ID}::market::Position<${COIN_TYPE}>`,
                },
                options: { showContent: true },
            });

            const parsedPositions: ParsedPosition[] = [];
            const marketIds = new Set<string>();

            for (const obj of ownedObjects.data) {
                if (!obj.data?.content || obj.data.content.dataType !== "moveObject") continue;
                const parsed = parsePosition(obj.data.content.fields as any);
                parsedPositions.push(parsed);
                marketIds.add(parsed.marketId);
            }

            setPositions(parsedPositions);

            // Fetch market state for all referenced markets
            if (marketIds.size > 0) {
                const marketObjects = await client.multiGetObjects({
                    ids: Array.from(marketIds),
                    options: { showContent: true },
                });

                const marketMap: Record<string, ParsedMarket> = {};
                for (const obj of marketObjects) {
                    if (!obj.data?.content || obj.data.content.dataType !== "moveObject") continue;
                    const market = parseMarket(obj.data.content.fields as any);
                    marketMap[market.id] = market;
                }
                setMarkets(marketMap);
            }
        } catch (err) {
            console.error("Failed to fetch positions:", err);
            setError(err instanceof Error ? err : new Error("Unknown error"));
        } finally {
            setIsLoading(false);
        }
    }, [account?.address, dAppKit]);

    useEffect(() => {
        if (!enabled || !account?.address || !PACKAGE_ID) return;

        fetchPositions();
        const interval = setInterval(fetchPositions, pollInterval);
        return () => clearInterval(interval);
    }, [account?.address, enabled, pollInterval, fetchPositions]);

    // Enrich positions with their market context
    const positionsWithMarket: PositionWithMarket[] = positions.map((position) => {
        const market = markets[position.marketId] ?? null;
        const redeemable = market ? canRedeemPosition(position, market) : false;
        return {
            position,
            market,
            canRedeem: redeemable,
            payout: redeemable ? position.size : null,
        };
    });

    // Group positions by market ID
    const positionsByMarket = positions.reduce(
        (acc, position) => {
            if (!acc[position.marketId]) acc[position.marketId] = [];
            acc[position.marketId].push(position);
            return acc;
        },
        {} as Record<string, ParsedPosition[]>,
    );

    const redeemablePositions = positionsWithMarket.filter((p) => p.canRedeem);

    return {
        positions,
        positionsWithMarket,
        positionsByMarket,
        redeemablePositions,
        markets,
        isLoading,
        error,
        refetch: fetchPositions,
    };
}
