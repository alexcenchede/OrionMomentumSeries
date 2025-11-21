import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { ORION_MOMENTUM_SERIES_ADDRESS, ORION_MOMENTUM_SERIES_ABI } from "@/config/contracts";
import { encryptBidAmount, initializeFHE } from "@/lib/fhe";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { parseEther } from "viem";

export interface PlaceBidParams {
  auctionId: string;
  bidAmount: string; // In ETH as string
  bondAmount: string; // In ETH as string
}

export function usePlaceBid() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending: isWriting, error } = useWriteContract();
  const [isEncrypting, setIsEncrypting] = useState(false);

  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  // Monitor transaction status and show notifications
  useEffect(() => {
    if (hash && isConfirming) {
      toast.loading("Confirming transaction...", {
        id: `tx-${hash}`,
        description: `View on Etherscan: https://sepolia.etherscan.io/tx/${hash}`,
        action: {
          label: "View",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank'),
        },
      });
    }
  }, [hash, isConfirming]);

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Bid placed successfully!", {
        id: `tx-${hash}`,
        description: "Your encrypted bid has been submitted to the blockchain",
        duration: 10000,
        action: {
          label: "View on Etherscan",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank'),
        },
      });
    }
  }, [isSuccess, hash]);

  useEffect(() => {
    if (isError && hash) {
      toast.error("Transaction failed", {
        id: `tx-${hash}`,
        description: "The transaction was rejected or failed",
        duration: 10000,
        action: {
          label: "View on Etherscan",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank'),
        },
      });
    }
  }, [isError, hash]);

  const placeBid = async ({ auctionId, bidAmount, bondAmount }: PlaceBidParams) => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setIsEncrypting(true);
      toast.loading("Encrypting bid amount...", { id: "encrypt-bid" });

      await initializeFHE();

      // Convert bid amount to wei and encrypt
      const bidAmountWei = parseEther(bidAmount);
      const { handle, proof } = await encryptBidAmount(bidAmountWei, address);

      toast.dismiss("encrypt-bid");

      // Place bid with bond payment
      writeContract({
        address: ORION_MOMENTUM_SERIES_ADDRESS,
        abi: ORION_MOMENTUM_SERIES_ABI,
        functionName: "placeEncryptedBid",
        args: [auctionId, handle, proof],
        value: parseEther(bondAmount), // Send bond amount with transaction
      });
    } catch (err) {
      console.error("Bid placement failed:", err);
      toast.error("Failed to place bid");
      throw err;
    } finally {
      setIsEncrypting(false);
    }
  };

  return {
    placeBid,
    isPending: isEncrypting || isWriting || isConfirming,
    isEncrypting,
    isWriting,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useUpdateBid() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending: isWriting, error } = useWriteContract();
  const [isEncrypting, setIsEncrypting] = useState(false);

  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Bid updated successfully!", {
        id: `tx-${hash}`,
        description: `View transaction: https://sepolia.etherscan.io/tx/${hash}`,
        duration: 10000,
      });
    }
  }, [isSuccess, hash]);

  const updateBid = async ({ auctionId, bidAmount }: Omit<PlaceBidParams, 'bondAmount'>) => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setIsEncrypting(true);
      toast.loading("Encrypting new bid amount...", { id: "encrypt-bid-update" });

      await initializeFHE();

      const bidAmountWei = parseEther(bidAmount);
      const { handle, proof } = await encryptBidAmount(bidAmountWei, address);

      toast.dismiss("encrypt-bid-update");

      writeContract({
        address: ORION_MOMENTUM_SERIES_ADDRESS,
        abi: ORION_MOMENTUM_SERIES_ABI,
        functionName: "updateEncryptedBid",
        args: [auctionId, handle, proof],
      });
    } catch (err) {
      console.error("Bid update failed:", err);
      toast.error("Failed to update bid");
      throw err;
    } finally {
      setIsEncrypting(false);
    }
  };

  return {
    updateBid,
    isPending: isEncrypting || isWriting || isConfirming,
    isSuccess,
    error,
    hash,
  };
}
