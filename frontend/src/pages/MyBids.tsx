import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAllAuctions } from "@/hooks/useAuctions";
import { useBidSummary } from "@/hooks/useAuctions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEther } from "viem";
import { Loader2, Wallet, Lock, CheckCircle2, Clock, Trophy, XCircle, Gavel, Calendar, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function AuctionBidCard({ auction, address }: { auction: any; address: string | undefined }) {
  const { bidSummary, isLoading: isBidLoading } = useBidSummary(auction.auctionId, address);
  const navigate = useNavigate();

  // Don't show if user hasn't bid
  if (!isBidLoading && !bidSummary?.exists) {
    return null;
  }

  const parseMetadata = (uri: string) => {
    try {
      return JSON.parse(uri);
    } catch {
      return { title: "Unknown", description: "", image: "" };
    }
  };

  const formatTimeRemaining = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const end = Number(endTime);
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const metadata = parseMetadata(auction.metadataURI);
  const isEnded = Number(auction.endTime) < Math.floor(Date.now() / 1000);
  const isWinner = bidSummary?.isWinner || false;
  const revealedAmount = bidSummary?.revealedAmount || 0n;

  if (isBidLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="py-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {metadata.image && (
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={metadata.image}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{metadata.title}</CardTitle>
          <div className="flex gap-2 flex-wrap justify-end">
            {isEnded && <Badge variant="destructive">Ended</Badge>}
            {auction.settled && isWinner && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                <Trophy className="w-3 h-3 mr-1" />
                Winner
              </Badge>
            )}
            {auction.settled && !isWinner && (
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                Not Winner
              </Badge>
            )}
          </div>
        </div>
        {metadata.description && (
          <CardDescription className="line-clamp-2">{metadata.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bid Status */}
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              You placed a bid
            </span>
          </div>
          {bidSummary?.isRevealed && revealedAmount > 0n && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Your bid amount</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatEther(revealedAmount)} ETH
              </p>
            </div>
          )}
          {!bidSummary?.isRevealed && (
            <p className="text-xs text-muted-foreground mt-1">
              <Lock className="w-3 h-3 inline mr-1" />
              Bid encrypted - will be revealed after auction ends
            </p>
          )}
        </div>

        {/* Auction Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Min Bid</p>
            <p className="font-bold">{formatEther(auction.minBid)} ETH</p>
          </div>
          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Status
            </p>
            <p className="font-semibold">
              {isEnded ? "Ended" : formatTimeRemaining(auction.endTime)}
            </p>
          </div>
        </div>

        {/* Bond Status */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Bond Deposited</span>
            <span className="font-semibold">{formatEther(auction.bidBond)} ETH</span>
          </div>
          {auction.settled && !isWinner && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              ✓ Bond can be claimed back
            </p>
          )}
          {auction.settled && isWinner && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
              Winner must pay winning bid to claim bond
            </p>
          )}
        </div>

        {/* Actions */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/test-auctions")}
        >
          View Auction Details
        </Button>
      </CardContent>
    </Card>
  );
}

const MyBids = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { auctions, isLoading } = useAllAuctions();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Gavel className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">My Bids</h1>
            </div>
            <div className="flex items-center gap-4">
              {address && balance?.value && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                  </span>
                </div>
              )}
              <ConnectButton />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/test-auctions")}
            >
              <Lock className="w-4 h-4 mr-2" />
              Active Auctions
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground"
              onClick={() => navigate("/my-bids")}
            >
              <Gavel className="w-4 h-4 mr-2" />
              My Bids
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/upcoming-auctions")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/about")}
            >
              <Info className="w-4 h-4 mr-2" />
              About
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Auction Participation</h2>
          <p className="text-muted-foreground">
            Track all auctions where you've placed encrypted bids. Your bid information is protected by FHE technology.
          </p>
        </div>

        {!address ? (
          <Card>
            <CardContent className="py-20 text-center">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Connect your wallet to view your bids
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Loading your bids...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionBidCard key={auction.auctionId} auction={auction} address={address} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBids;
