import { useReadContract, usePublicClient } from "wagmi";
import {
  ORION_MOMENTUM_SERIES_ADDRESS,
  ORION_MOMENTUM_SERIES_ABI,
} from "@/config/contracts";
import { useEffect, useState } from "react";

export interface AuctionData {
  auctionId: string;
  exists: boolean;
  seller: string;
  metadataURI: string;
  minBid: bigint;
  buyNowPrice: bigint;
  bidBond: bigint;
  startTime: bigint;
  endTime: bigint;
  cancelled: boolean;
  settled: boolean;
  winner: string;
  winningBid: bigint;
  amountPaid: bigint;
  bidderCount: bigint;
}

/**
 * Hook to fetch all auction IDs
 */
export function useAllAuctionIds() {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: ORION_MOMENTUM_SERIES_ADDRESS,
    abi: ORION_MOMENTUM_SERIES_ABI,
    functionName: "getAllAuctionIds",
  });

  return {
    auctionIds: (data as string[]) || [],
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook to fetch auction details by ID
 */
export function useAuction(auctionId: string | undefined) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: ORION_MOMENTUM_SERIES_ADDRESS,
    abi: ORION_MOMENTUM_SERIES_ABI,
    functionName: "getAuction",
    args: auctionId ? [auctionId] : undefined,
    query: {
      enabled: !!auctionId,
    },
  });

  const [auction, setAuction] = useState<AuctionData | null>(null);

  useEffect(() => {
    if (data && auctionId) {
      const [
        exists,
        seller,
        metadataURI,
        minBid,
        buyNowPrice,
        bidBond,
        startTime,
        endTime,
        cancelled,
        settled,
        winner,
        winningBid,
        amountPaid,
        bidderCount,
      ] = data as any[];

      setAuction({
        auctionId,
        exists,
        seller,
        metadataURI,
        minBid,
        buyNowPrice,
        bidBond,
        startTime,
        endTime,
        cancelled,
        settled,
        winner,
        winningBid,
        amountPaid,
        bidderCount,
      });
    }
  }, [data, auctionId]);

  return {
    auction,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook to fetch all auctions with their details
 */
export function useAllAuctions() {
  const { auctionIds, isLoading: loadingIds } = useAllAuctionIds();
  const publicClient = usePublicClient();
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuctions = async () => {
      if (!auctionIds || auctionIds.length === 0) {
        setAuctions([]);
        setIsLoading(false);
        return;
      }

      if (!publicClient) {
        setIsLoading(true);
        return;
      }

      try {
        setIsLoading(true);
        const results = await Promise.all(
          auctionIds.map(async (id) => {
            const data = (await publicClient.readContract({
              address: ORION_MOMENTUM_SERIES_ADDRESS,
              abi: ORION_MOMENTUM_SERIES_ABI,
              functionName: "getAuction",
              args: [id],
            })) as any[];

            if (!data[0]) {
              return null;
            }

            return {
              auctionId: id,
              exists: data[0],
              seller: data[1],
              metadataURI: data[2],
              minBid: data[3],
              buyNowPrice: data[4],
              bidBond: data[5],
              startTime: data[6],
              endTime: data[7],
              cancelled: data[8],
              settled: data[9],
              winner: data[10],
              winningBid: data[11],
              amountPaid: data[12],
              bidderCount: data[13],
            } as AuctionData;
          })
        );

        setAuctions(results.filter((auction): auction is AuctionData => Boolean(auction)));
      } catch (error) {
        console.error("Error fetching auctions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, [auctionIds, publicClient]);

  return {
    auctions,
    isLoading: loadingIds || isLoading,
  };
}

/**
 * Hook to get bid summary for a specific user and auction
 */
export function useBidSummary(auctionId: string | undefined, bidder: string | undefined) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: ORION_MOMENTUM_SERIES_ADDRESS,
    abi: ORION_MOMENTUM_SERIES_ABI,
    functionName: "getBidSummary",
    args: auctionId && bidder ? [auctionId, bidder as `0x${string}`] : undefined,
    query: {
      enabled: !!auctionId && !!bidder,
    },
  });

  return {
    bidSummary: data ? {
      exists: data[0],
      revealed: data[1],
      revealedAmount: data[2],
      bondPaid: data[3],
      bondClaimed: data[4],
      isWinner: data[5],
    } : null,
    isLoading,
    isError,
    refetch,
  };
}
