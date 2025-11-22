import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Wallet, Lock, Sparkles, Gavel, Info } from "lucide-react";
import { formatEther } from "viem";
import { useNavigate } from "react-router-dom";

const UpcomingAuctions = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const navigate = useNavigate();

  // Upcoming auctions - these would come from the contract in production
  const upcomingAuctions = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800",
      title: "Neon Dreams Series",
      description: "Exclusive collection of futuristic neon-lit cityscapes",
      startDate: "Coming Soon",
      estimatedMinBid: "1.0",
      estimatedBond: "0.02",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800",
      title: "Digital Genesis Collection",
      description: "First edition AI-generated art pieces with unique attributes",
      startDate: "Coming Soon",
      estimatedMinBid: "0.8",
      estimatedBond: "0.02",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=800",
      title: "Abstract Reality",
      description: "Mind-bending abstract compositions exploring digital consciousness",
      startDate: "Coming Soon",
      estimatedMinBid: "1.2",
      estimatedBond: "0.02",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Upcoming Auctions</h1>
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
              onClick={() => navigate("/my-bids")}
            >
              <Gavel className="w-4 h-4 mr-2" />
              My Bids
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground"
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
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-3xl font-bold">Future FHE Auctions</h2>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-muted-foreground">
            Get ready for upcoming private sealed-bid auctions. All bids will be encrypted using FHE technology.
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Privacy-First Auctions</h3>
              <p className="text-muted-foreground text-sm">
                All upcoming auctions use Fully Homomorphic Encryption (FHE) to keep your bids completely private.
                No one can see your bid amount until the auction ends and results are revealed on-chain.
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingAuctions.map((auction) => (
            <Card key={auction.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={auction.image}
                  alt={auction.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <Badge className="absolute top-3 right-3 bg-yellow-500/90 hover:bg-yellow-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Coming Soon
                </Badge>
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{auction.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {auction.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      {auction.startDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Min Bid</span>
                    <span className="font-bold text-foreground">
                      {auction.estimatedMinBid} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Bond</span>
                    <span className="font-semibold text-foreground">
                      {auction.estimatedBond} ETH
                    </span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" disabled>
                  <Calendar className="w-4 h-4 mr-2" />
                  Not Yet Available
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State for No Upcoming Auctions */}
        {upcomingAuctions.length === 0 && (
          <Card>
            <CardContent className="py-20 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No upcoming auctions scheduled</p>
              <p className="text-sm text-muted-foreground">
                Check back soon for new private FHE auctions
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default UpcomingAuctions;
