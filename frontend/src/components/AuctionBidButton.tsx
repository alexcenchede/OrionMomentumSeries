import { useAccount } from "wagmi";
import { useBidSummary } from "@/hooks/useAuctions";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Edit } from "lucide-react";

interface AuctionBidButtonProps {
  auctionId: string;
  isEnded: boolean;
  isCancelled: boolean;
  onPlaceBid: () => void;
  onUpdateBid: () => void;
}

export function AuctionBidButton({
  auctionId,
  isEnded,
  isCancelled,
  onPlaceBid,
  onUpdateBid,
}: AuctionBidButtonProps) {
  const { address } = useAccount();
  const { bidSummary, isLoading } = useBidSummary(auctionId, address);

  if (!address) {
    return null;
  }

  if (isEnded || isCancelled) {
    return null;
  }

  if (isLoading) {
    return (
      <Button className="w-full" disabled>
        Loading...
      </Button>
    );
  }

  // User has already placed a bid
  if (bidSummary?.exists) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            You've placed a bid
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onUpdateBid}
        >
          <Edit className="w-4 h-4 mr-2" />
          Update Bid
        </Button>
      </div>
    );
  }

  // User hasn't placed a bid yet
  return (
    <Button className="w-full" onClick={onPlaceBid}>
      <Lock className="w-4 h-4 mr-2" />
      Place Encrypted Bid
    </Button>
  );
}
