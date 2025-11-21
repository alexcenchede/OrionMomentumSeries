import { useEffect, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import {
  ORION_MOMENTUM_SERIES_ADDRESS,
  ORION_MOMENTUM_SERIES_ABI,
} from "@/config/contracts";
import { toast } from "sonner";
import { parseEther } from "viem";
import { publicDecryptHandles } from "@/lib/fhe";

export interface CreateAuctionParams {
  auctionId: string;
  metadataURI: string;
  minBid: string; // In ETH as string
  buyNowPrice: string; // In ETH as string (0 for no buy now)
  duration: number; // In seconds
  bidBond: string; // In ETH as string
}

export function useCreateAuction() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (hash && isPending) {
      toast.loading("Creating auction...", {
        id: `tx-${hash}`,
        description: `View on Etherscan: https://sepolia.etherscan.io/tx/${hash}`,
      });
    }
  }, [hash, isPending]);

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Auction created successfully!", {
        id: `tx-${hash}`,
        description: `View transaction: https://sepolia.etherscan.io/tx/${hash}`,
        duration: 10000,
      });
    }
  }, [isSuccess, hash]);

  useEffect(() => {
    if (isError && hash) {
      toast.error("Transaction failed", {
        id: `tx-${hash}`,
        description: `View on Etherscan: https://sepolia.etherscan.io/tx/${hash}`,
        duration: 10000,
      });
    }
  }, [isError, hash]);

  const createAuction = async ({
    auctionId,
    metadataURI,
    minBid,
    buyNowPrice,
    duration,
    bidBond,
  }: CreateAuctionParams) => {
    try {
      writeContract({
        address: ORION_MOMENTUM_SERIES_ADDRESS,
        abi: ORION_MOMENTUM_SERIES_ABI,
        functionName: "createAuction",
        args: [
          auctionId,
          metadataURI,
          parseEther(minBid),
          buyNowPrice ? parseEther(buyNowPrice) : BigInt(0),
          BigInt(duration),
          parseEther(bidBond),
        ],
      });
    } catch (err) {
      console.error("Auction creation failed:", err);
      toast.error("Failed to create auction");
      throw err;
    }
  };

  return {
    createAuction,
    isPending: isPending || isConfirming,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useEnableBidReveal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Bids can now be publicly decrypted", {
        duration: 5000,
      });
    }
  }, [isSuccess, hash]);

  const enableReveal = (auctionId: string) => {
    writeContract({
      address: ORION_MOMENTUM_SERIES_ADDRESS,
      abi: ORION_MOMENTUM_SERIES_ABI,
      functionName: "enablePublicBidReveal",
      args: [auctionId],
    });
  };

  return {
    enableReveal,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useSettleWinningBid() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Payment successful!", {
        description: "You can now claim your bond",
        duration: 5000,
      });
    }
  }, [isSuccess, hash]);

  const settleWinningBid = (auctionId: string, winningAmount: string) => {
    writeContract({
      address: ORION_MOMENTUM_SERIES_ADDRESS,
      abi: ORION_MOMENTUM_SERIES_ABI,
      functionName: "settleWinningBid",
      args: [auctionId],
      value: parseEther(winningAmount),
    });
  };

  return {
    settleWinningBid,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useClaimBond() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Bond claimed successfully!", {
        duration: 5000,
      });
    }
  }, [isSuccess, hash]);

  const claimBond = (auctionId: string) => {
    writeContract({
      address: ORION_MOMENTUM_SERIES_ADDRESS,
      abi: ORION_MOMENTUM_SERIES_ABI,
      functionName: "claimBond",
      args: [auctionId],
    });
  };

  return {
    claimBond,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useSubmitAuctionReveal() {
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Bids revealed successfully!", { duration: 5000 });
    }
  }, [isSuccess, hash]);

  const submitReveal = async (auctionId: string) => {
    if (!publicClient) {
      toast.error("Public client not ready");
      throw new Error("Public client not ready");
    }

    try {
      setIsDecrypting(true);
      const handles = (await publicClient.readContract({
        address: ORION_MOMENTUM_SERIES_ADDRESS,
        abi: ORION_MOMENTUM_SERIES_ABI,
        functionName: "getBidHandles",
        args: [auctionId],
      })) as `0x${string}`[];

      if (!handles || handles.length === 0) {
        throw new Error("No encrypted bids available for reveal");
      }

      const formattedHandles = handles.map((handle) => handle as `0x${string}`);
      const { abiEncoded, proof } = await publicDecryptHandles(formattedHandles);

      writeContract({
        address: ORION_MOMENTUM_SERIES_ADDRESS,
        abi: ORION_MOMENTUM_SERIES_ABI,
        functionName: "submitAuctionReveal",
        args: [auctionId, abiEncoded, proof],
      });
    } catch (err) {
      console.error("Reveal submission failed:", err);
      toast.error((err as Error).message || "Failed to reveal bids");
      throw err;
    } finally {
      setIsDecrypting(false);
    }
  };

  return {
    submitReveal,
    isDecrypting,
    isPending: isPending || isConfirming || isDecrypting,
    isSuccess,
    error,
    hash,
  };
}
