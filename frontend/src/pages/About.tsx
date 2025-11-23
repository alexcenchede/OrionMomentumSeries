import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield, Lock, Eye, Zap, Wallet, Info, Code, Users, Gavel, Calendar, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEther } from "viem";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Shield,
    title: "FHE Technology",
    description: "Powered by Zama's fhEVM, enabling computation on encrypted data without revealing the underlying information, ensuring complete bid privacy.",
  },
  {
    icon: Lock,
    title: "Private Bidding",
    description: "Your bids remain encrypted end-to-end using Fully Homomorphic Encryption. No one can see your bid amount until the auction concludes.",
  },
  {
    icon: Eye,
    title: "Transparent & Verifiable",
    description: "While bids are private, the auction process is completely transparent and verifiable on the Sepolia testnet blockchain.",
  },
  {
    icon: Zap,
    title: "Smart Contract Automation",
    description: "Automated settlement through smart contracts ensures instant, trustless auction resolution with no intermediaries required.",
  },
];

const technicalDetails = [
  {
    icon: Code,
    title: "Built on Zama fhEVM",
    description: "Leverages Zama's Fully Homomorphic Encryption Virtual Machine for private smart contract execution on Ethereum.",
  },
  {
    icon: Users,
    title: "Sealed-Bid Auctions",
    description: "Implements first-price sealed-bid auction mechanism where all bids remain secret until the reveal phase.",
  },
];

const About = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">About</h1>
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
              onClick={() => navigate("/upcoming-auctions")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground"
              onClick={() => navigate("/about")}
            >
              <Info className="w-4 h-4 mr-2" />
              About
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Orion Momentum Series
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-base">Powered by Zama fhEVM</Badge>
              <Badge variant="outline" className="text-base">Sepolia Testnet</Badge>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A privacy-preserving NFT auction platform powered by Fully Homomorphic Encryption,
              bringing unprecedented privacy and security to digital asset trading.
            </p>
          </div>

          {/* Demo Video - Featured at Top */}
          <Card className="mb-12 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <PlayCircle className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl">Live Demo - Placing an Encrypted Bid</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Watch this demonstration of how to place an encrypted bid on the Orion Momentum Series platform.
                The video shows the complete process from connecting your wallet to submitting an FHE-encrypted bid.
              </p>
              <div className="relative w-full rounded-lg overflow-hidden bg-black">
                <video
                  controls
                  className="w-full"
                  poster=""
                >
                  <source src="/demo_bid.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 inline mr-1" />
                  This demo showcases the FHE encryption process where your bid amount is encrypted client-side
                  before being submitted to the blockchain, ensuring complete privacy throughout the auction.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Main Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Technical Details */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Technical Implementation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {technicalDetails.map((detail, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <detail.icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="text-lg font-semibold mb-2">{detail.title}</h3>
                    <p className="text-muted-foreground text-sm">{detail.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Why FHE Section */}
          <Card className="mb-12 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Why Fully Homomorphic Encryption?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Traditional auction systems expose bid information to administrators and can be vulnerable
                to manipulation, front-running, and bid sniping. FHE changes this paradigm entirely.
              </p>
              <p className="text-muted-foreground">
                With FHE, mathematical operations can be performed on encrypted data without decrypting it.
                This means our smart contracts can determine auction winners and process transactions while
                your bid amounts remain completely private until the reveal phase.
              </p>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-medium">
                  The result? A truly fair, private, and secure auction experience that preserves the
                  competitive advantage of sealed-bid auctions while maintaining blockchain transparency.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Connect & Browse</h4>
                  <p className="text-muted-foreground text-sm">
                    Connect your wallet and browse available NFT auctions on the platform.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Place Encrypted Bid</h4>
                  <p className="text-muted-foreground text-sm">
                    Your bid amount is encrypted using FHE before being submitted to the blockchain.
                    You also deposit a bond which will be returned after the auction.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Auction Ends & Reveal</h4>
                  <p className="text-muted-foreground text-sm">
                    When the auction ends, bids are revealed through a decryption process.
                    The highest bidder wins the NFT.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Settlement</h4>
                  <p className="text-muted-foreground text-sm">
                    Winner pays their bid amount to receive the NFT. All other participants can claim their bonds back.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Info */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-xl">Smart Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono">Sepolia Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract Address</span>
                <a
                  href="https://sepolia.etherscan.io/address/0x85FEffb3fa01366f475A02F53Cf8B9C3518eDC7f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline"
                >
                  0x85FE...eDC7f
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Encryption</span>
                <span className="font-medium">Zama fhEVM</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;
