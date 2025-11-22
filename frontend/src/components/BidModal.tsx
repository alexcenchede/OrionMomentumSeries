import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import { usePlaceBid } from "@/hooks/usePlaceBid";
import { formatEther } from "viem";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  bondAmount: bigint; // Required bond in wei
  currentHighestBid?: bigint; // Optional current highest bid in wei
}

export function BidModal({
  isOpen,
  onClose,
  auctionId,
  bondAmount,
  currentHighestBid,
}: BidModalProps) {
  const [bidAmount, setBidAmount] = useState("");
  const { placeBid, isPending, isEncrypting } = usePlaceBid();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      return;
    }

    try {
      await placeBid({
        auctionId,
        bidAmount,
        bondAmount: formatEther(bondAmount),
      });

      // Reset and close on success
      setBidAmount("");
      onClose();
    } catch (error) {
      console.error("Failed to place bid:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place Encrypted Bid</DialogTitle>
          <DialogDescription>
            Your bid will be encrypted using FHE and remain private until the auction ends.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid Amount (ETH)</Label>
            <Input
              id="bidAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              disabled={isPending}
              className="text-lg"
            />
            {currentHighestBid && (
              <p className="text-xs text-muted-foreground">
                Current highest bid: {formatEther(currentHighestBid)} ETH
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Required Bond:</span>
              <span className="font-semibold">{formatEther(bondAmount)} ETH</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll need to deposit this bond to place a bid. It will be refunded after the auction ends.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg">
            <Lock className="w-4 h-4 text-primary" />
            <span>Your bid will be encrypted and hidden until reveal</span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !bidAmount}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEncrypting ? "Encrypting..." : "Submitting..."}
                </>
              ) : (
                "Place Bid"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
