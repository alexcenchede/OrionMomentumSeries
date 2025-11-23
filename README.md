# Orion Momentum Series — FHE Private Auction Platform

Orion Momentum Series is a **sealed-bid private auction platform** powered by fhEVM. Sellers can create auction listings with configurable minimum bids, buy-now prices, bonds, and durations. Bidders submit encrypted bids (`externalEuint64`) with bonds before the auction closes. All bids remain encrypted on-chain until the auction ends, when decryption is triggered by the contract itself—no centralized auctioneer or offline matching required.

## Core Workflow

| Step | Description |
| --- | --- |
| `createAuction(auctionId, metadataURI, minBid, buyNowPrice, duration, bidBond)` | Seller creates auction with unique ID, minimum bid, optional buy-now price, bond requirement, and time window |
| `placeEncryptedBid` / `updateEncryptedBid` | Bidders submit or update FHE-encrypted bids and pay a one-time bond |
| `enablePublicBidReveal` → `submitAuctionReveal` | After auction ends, anyone can trigger decryption. Contract receives all plaintext bids in callback and determines the highest bidder |
| `settleWinningBid` & `sellerWithdraw` | Winner pays the revealed bid amount; seller withdraws proceeds |
| `claimBond` | After auction ends or is cancelled, all bidders can reclaim their bonds (winner must pay first) |

## FHE Features

- Bids use `externalEuint64` + `FHE.fromExternal` to import encrypted data on-chain, decrypted only after auction lock to prevent bid sniping and front-running
- Contract holds only encrypted handles until `enablePublicBidReveal` initiates decryption via `submitAuctionReveal` callback; the callback process is secured by fhEVM's `FHE.checkSignatures`
- `bidCipher` can be updated throughout the auction and is not enumerable; only the bidder and contract have decryption authorization, ensuring a true "sealed-bid" experience

## Integration Guidelines

1. **Frontend**: Use Zama fhEVM SDK to generate `externalEuint64` encrypted bids with proofs, then call `placeEncryptedBid` / `updateEncryptedBid`
2. **Event Monitoring**: Listen to `AuctionCreated`, `BidPlaced`, `BidUpdated`, `BidRevealRequested`, `BidsRevealed`, `WinnerSettled`, `BondClaimed` events to update UI
3. **Decryption Trigger**: After lock time, any node can trigger `enablePublicBidReveal`—no need to wait for seller. If no bids are placed, seller can directly call `cancelAuction` to end
4. **Settlement**: Winner must pay the exact revealed amount via `settleWinningBid`, then call `claimBond` to retrieve their bond. Seller withdraws proceeds via `sellerWithdraw`
5. **Privacy Options**: To hide complete bid lists during reveal, upper-layer protocols can implement batch hashing or staged decryption strategies. Default implementation records final amounts in plaintext on-chain for auditability

## Technology Stack

### Smart Contracts
- **Solidity** with Zama fhEVM for FHE operations
- **Sepolia Testnet** deployment
- Comprehensive unit tests using Hardhat

### Frontend
- **React** with TypeScript
- **Vite** for fast development and builds
- **Wagmi v3** for Ethereum interactions
- **RainbowKit** for wallet connections
- **Ant Design** components
- **FHE SDK 0.3.0-5** for client-side encryption

## Project Structure

```
OrionMomentumSeries/
├── contracts/               # Solidity smart contracts
│   └── OrionMomentumSeries.sol
├── test/                   # Unit tests
│   ├── BasicAuction.test.js
│   ├── EncryptedBidding.test.js
│   └── AuctionSettlement.test.js
├── scripts/                # Deployment scripts
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   └── config/       # Configuration files
│   └── public/           # Static assets
└── hardhat.config.js     # Hardhat configuration
```

## Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
cd frontend && npm install
```

### Smart Contract Deployment

```bash
# Deploy to Sepolia testnet
SEPOLIA_RPC_URL="YOUR_RPC_URL" PRIVATE_KEY="YOUR_PRIVATE_KEY" npx hardhat run scripts/deploy.js --network sepolia
```

### Running Tests

```bash
# Run all unit tests
npx hardhat test

# Run specific test file
npx hardhat test test/BasicAuction.test.js
```

### Frontend Development

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:8080`

## Features

- ✅ Create sealed-bid auctions with FHE encryption
- ✅ Place and update encrypted bids
- ✅ Automatic bid reveal after auction ends
- ✅ Winner settlement and bond management
- ✅ Real-time auction monitoring
- ✅ Responsive UI with dark mode support
- ✅ Comprehensive error handling
- ✅ Full unit test coverage

## Live Demo

Watch the demo video on the About page to see the complete encrypted bid placement process in action.

## Security

- All bids encrypted using Zama's FHE technology
- No bid information revealed until auction ends
- Tamper-proof on-chain execution
- Comprehensive unit tests for contract security

## License

MIT

## Links

- **Live Demo**: [Vercel Deployment](https://orionmomentumseries.vercel.app)
- **Contract Address**: `0x85FEffb3fa01366f475A02F53Cf8B9C3518eDC7f` (Sepolia)
- **Zama Documentation**: [https://docs.zama.org](https://docs.zama.org)
