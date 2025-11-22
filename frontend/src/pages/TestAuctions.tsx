import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAllAuctions } from "@/hooks/useAuctions";
import { BidModal } from "@/components/BidModal";
import { CreateAuctionModal } from "@/components/CreateAuctionModal";
import { AuctionBidButton } from "@/components/AuctionBidButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEther } from "viem";
import { Loader2, Plus, Users, Clock, Wallet, Lock, Gavel, Calendar, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TestAuctions() {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { auctions, isLoading } = useAllAuctions();
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const selectedAuctionData = auctions.find((a) => a.auctionId === selectedAuction);

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

  const parseMetadata = (uri: string) => {
    try {
      return JSON.parse(uri);
    } catch {
      return { title: "Unknown", description: "", image: "" };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Orion Momentum Series</h1>
              <Badge variant="outline" className="ml-2">FHE Powered</Badge>
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
              className="text-foreground"
              onClick={() => navigate("/test-auctions")}
            >
              <Lock className="w-4 h-4 mr-2" />
              Active Auctions
            </Button>
            <Button
              variant="ghost"
              size="sm"
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
          <h2 className="text-3xl font-bold mb-2">Private FHE Auctions</h2>
          <p className="text-muted-foreground">
            All bids are encrypted using Fully Homomorphic Encryption and remain private until auction ends
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Loading auctions...</span>
          </div>
        ) : auctions.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground mb-4">No auctions found</p>
              {address && (
                <Button onClick={() => setShowCreateModal(true)}>
                  Create First Auction
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => {
              const metadata = parseMetadata(auction.metadataURI);
              const isEnded = Number(auction.endTime) < Math.floor(Date.now() / 1000);

              return (
                <Card key={auction.auctionId} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      {isEnded && <Badge variant="destructive">Ended</Badge>}
                      {auction.settled && <Badge variant="secondary">Settled</Badge>}
                    </div>
                    {metadata.description && (
                      <CardDescription className="line-clamp-2">{metadata.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          Min Bid
                        </p>
                        <p className="font-bold text-lg">{formatEther(auction.minBid)} ETH</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Time Left
                        </p>
                        <p className="font-semibold">{formatTimeRemaining(auction.endTime)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{auction.bidderCount.toString()} bidders</span>
                      </div>
                      <div className="text-muted-foreground">
                        Bond: {formatEther(auction.bidBond)} ETH
                      </div>
                    </div>

                    {auction.settled && auction.winner !== "0x0000000000000000000000000000000000000000" && (
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-xs text-muted-foreground">Winning Bid</p>
                        <p className="font-bold text-primary">{formatEther(auction.winningBid)} ETH</p>
                      </div>
                    )}

                    {!isEnded && !auction.cancelled && address ? (
                      <AuctionBidButton
                        auctionId={auction.auctionId}
                        isEnded={isEnded}
                        isCancelled={auction.cancelled}
                        onPlaceBid={() => setSelectedAuction(auction.auctionId)}
                        onUpdateBid={() => setSelectedAuction(auction.auctionId)}
                      />
                    ) : isEnded && !auction.settled && Number(auction.bidderCount) > 0 ? (
                      <Button variant="outline" className="w-full" disabled>
                        Waiting for Reveal
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bid Modal */}
      {selectedAuction && selectedAuctionData && (
        <BidModal
          isOpen={!!selectedAuction}
          onClose={() => setSelectedAuction(null)}
          auctionId={selectedAuction}
          bondAmount={selectedAuctionData.bidBond}
          currentHighestBid={selectedAuctionData.winningBid}
        />
      )}

      {/* Create Auction Modal */}
      <CreateAuctionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
