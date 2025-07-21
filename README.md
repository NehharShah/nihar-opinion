# Opinion Market - Solana Take-Home Assignment

A complete opinion market system built on Solana using Anchor framework, featuring LS-LMSR automated market making, real-time indexing, and NestJS backend API.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust and Cargo
- Solana CLI tools
- Anchor CLI
- PostgreSQL database

### Installation

1. **Clone and setup**
```bash
git clone <your-repo>
cd opinion-market
```

2. **Install dependencies**
```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install project dependencies
npm install
cd backend && npm install
```

3. **Environment Setup**
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Generate Solana keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Setup PostgreSQL database
createdb opinion_market
```

4. **Configure Solana for devnet**
```bash
solana config set --url devnet
solana airdrop 2
```

### Running the System

1. **Start the Solana program**
```bash
# Build and deploy the program
anchor build
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

2. **Start the backend (indexer + API)**
```bash
cd backend
npm run start:dev
```

3. **Test the API**
```bash
# Health check
curl http://localhost:3001/api/health

# List markets
curl http://localhost:3001/api/markets

# Create a test market
curl -X POST http://localhost:3001/api/markets \
  -H "Content-Type: application/json" \
  -d '{
    "marketId": "test-market-1",
    "question": "Will this test pass?",
    "options": ["Yes", "No"],
    "endTime": 1735689599,
    "liquidity": 1000000000
  }'
```

4. **Run live API tests**
```bash
node tests/api/live-api-tests.js
```

## 🔧 Environment Variables

### Root (.env)
```
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json
PROGRAM_ID=<your-program-id>
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/opinion_market
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your-program-id>
PORT=3001
```

## 🎯 Core Requirements Met

### ✅ On-Chain Program (Anchor)
- **create**: Initialize a market with LS-LMSR AMM
- **buy**: User sends SOL → handle position + market updates, transfer SOL in
- **sell**: Update market/position, transfer SOL back to user
- **LS-LMSR math**: Cost, price, buy + sell calculations with alpha=2%
- **Account validation**: Comprehensive validation with descriptive error codes

### ✅ Indexer & API (NestJS + TypeScript)
- **Stream and store program events**: Real-time blockchain event processing
- **Persist data**: Market metadata, user positions, orders
- **REST API**: Full CRUD operations for markets, positions, and orders

### ✅ Testing + Dev
- **Basic tests**: Program logic tests included
- **API testing**: Live API test script provided

## 📊 API Endpoints

### Markets
- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get market details
- `POST /api/markets` - Create new market

### Positions
- `GET /api/positions` - List all positions
- `GET /api/positions/wallet/:address` - Get positions by wallet
- `POST /api/positions` - Create position

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create order

## 🧪 Testing

### Smart Contract Tests
```bash
anchor test
```

### API Tests
```bash
# Start the backend first
cd backend && npm run start:dev

# Run live API tests
node tests/api/live-api-tests.js
```

## 📝 Documentation

- [DECISIONS.md](./DECISIONS.md) - Architecture decisions and trade-offs
- [ASSUMPTIONS.md](./ASSUMPTIONS.md) - Assumptions and simplifications
- [NEXT_STEPS.md](./NEXT_STEPS.md) - Future improvements and roadmap