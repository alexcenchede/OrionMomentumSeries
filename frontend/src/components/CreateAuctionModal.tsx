import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Gavel } from "lucide-react";
import { useCreateAuction } from "@/hooks/useCreateAuction";

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAuctionModal({ isOpen, onClose }: CreateAuctionModalProps) {
  const [formData, setFormData] = useState({
    auctionId: "",
    title: "",
    description: "",
    imageUrl: "",
    minBid: "",
    buyNowPrice: "",
    durationDays: "",
    bidBond: "",
  });

  const { createAuction, isPending } = useCreateAuction();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create metadata JSON
    const metadata = {
      title: formData.title,
      description: formData.description,
      image: formData.imageUrl,
    };

    // In production, you'd upload this to IPFS and get the URI
    const metadataURI = `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;

    try {
      await createAuction({
        auctionId: formData.auctionId || `auction-${Date.now()}`,
        metadataURI,
        minBid: formData.minBid,
        buyNowPrice: formData.buyNowPrice || "0",
        duration: parseInt(formData.durationDays) * 24 * 60 * 60, // Convert days to seconds
        bidBond: formData.bidBond,
      });

      // Reset form and close on success
      setFormData({
        auctionId: "",
        title: "",
        description: "",
        imageUrl: "",
        minBid: "",
        buyNowPrice: "",
        durationDays: "",
        bidBond: "",
      });
      onClose();
    } catch (error) {
      console.error("Failed to create auction:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5" />
            Create New Auction
          </DialogTitle>
          <DialogDescription>
            Set up your private FHE-powered auction. Bids will remain encrypted until the auction ends.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Auction Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Cyberpunk Metropolis #001"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isPending}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your NFT or item..."
                value={formData.description}
                onChange={handleChange}
                disabled={isPending}
                rows={3}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={handleChange}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minBid">Minimum Bid (ETH) *</Label>
              <Input
                id="minBid"
                name="minBid"
                type="number"
                step="0.01"
                min="0"
                placeholder="1.0"
                value={formData.minBid}
                onChange={handleChange}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyNowPrice">Buy Now Price (ETH)</Label>
              <Input
                id="buyNowPrice"
                name="buyNowPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="10.0 (optional)"
                value={formData.buyNowPrice}
                onChange={handleChange}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bidBond">Bid Bond (ETH) *</Label>
              <Input
                id="bidBond"
                name="bidBond"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.1"
                value={formData.bidBond}
                onChange={handleChange}
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Bidders must deposit this amount to participate
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationDays">Duration (Days) *</Label>
              <Input
                id="durationDays"
                name="durationDays"
                type="number"
                step="1"
                min="1"
                max="14"
                placeholder="7"
                value={formData.durationDays}
                onChange={handleChange}
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Between 1 and 14 days
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Auction"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
