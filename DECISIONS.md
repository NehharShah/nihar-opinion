# Architecture Decisions & Trade-offs

## 1. Smart Contract Architecture

### 1.1 LS-LMSR Implementation Choice

**Decision**: Implemented LS-LMSR (Logarithmic Market Scoring Rule) calculations **on-chain** with alpha value of 2%.

**Rationale**:
- **Security**: All calculations performed on-chain prevent manipulation
- **Transparency**: Market mechanics are fully auditable on blockchain
- **Correctness**: Eliminates client-side calculation errors
- **Trust**: Users don't need to trust off-chain calculations

**Implementation Details**:
- `shares_for_cost()`: Calculates shares from SOL cost input
- `sell_cost()`: Calculates SOL payout from shares sold
- `market_price()`: Real-time price calculation for UI
- All math uses fixed-point arithmetic for precision

**Trade-offs**:
- ✅ **Pros**: Maximum security, transparency, correctness
- ❌ **Cons**: Higher compute costs (~2000 CU per calculation)

### 1.2 Account Structure Design

**Decision**: Used PDA (Program Derived Address) seeds for deterministic account addresses.

**Rationale**:
- **Deterministic**: Predictable account addresses for better UX
- **Security**: No need to pass account addresses in transactions
- **Gas Efficiency**: Reduces transaction size

**Structure**:
```
Market: [MARKET_SEED, market_id]
Position: [POSITION_SEED, market_key, user_key]
Admin: [ADMIN_SEED]
Fees: [FEES_SEED]
```

### 1.3 Fee Collection Strategy

**Decision**: Centralized fee collection with admin-controlled withdrawal.

**Rationale**:
- **Security**: Admin control prevents fee theft
- **Transparency**: All fees visible in dedicated account
- **Flexibility**: Can implement complex fee structures later

## 2. Backend Architecture

### 2.1 NestJS Framework Choice

**Decision**: Used NestJS for the backend API and indexer.

**Rationale**:
- **TypeScript**: Full type safety across the stack
- **Modularity**: Clean separation of concerns
- **Scalability**: Built-in support for microservices
- **Documentation**: Excellent OpenAPI/Swagger integration

### 2.2 Database Design

**Decision**: PostgreSQL with TypeORM for data persistence.

**Rationale**:
- **ACID Compliance**: Critical for financial data
- **JSON Support**: Flexible storage for market options
- **Performance**: Excellent for read-heavy workloads
- **Relationships**: Proper foreign key constraints

**Entity Relationships**:
```
Market (1) -> (N) Position
Market (1) -> (N) Order
User (1) -> (N) Position
```

### 2.3 Indexing Strategy

**Decision**: Real-time event streaming with WebSocket updates.

**Rationale**:
- **Real-time**: Immediate price updates for users
- **Efficiency**: Only process relevant transactions
- **Scalability**: Can handle high transaction volumes
- **Reliability**: Event sourcing pattern for data consistency

**Event Types**:
- Market Created
- Buy/Sell Orders
- Market Resolution
- Price Updates

## 3. Security Considerations

### 3.1 Input Validation

**Decision**: Multi-layer validation (client, API, smart contract).

**Rationale**:
- **Defense in Depth**: Multiple layers of protection
- **User Experience**: Early error detection
- **Security**: Prevents malicious inputs

### 3.2 Access Control

**Decision**: Admin-controlled operations with proper authorization.

**Rationale**:
- **Security**: Prevents unauthorized market resolution
- **Flexibility**: Can implement complex governance later
- **Auditability**: Clear admin actions

### 3.3 Slippage Protection

**Decision**: Built-in slippage tolerance with user-specified limits.

**Rationale**:
- **User Protection**: Prevents MEV attacks
- **Transparency**: Clear slippage expectations
- **Flexibility**: Users can set their own tolerance

## 4. Testing Strategy

### 4.1 Test Coverage

**Decision**: Comprehensive testing across all layers.

**Test Types**:
- Unit tests for smart contracts
- Integration tests for API
- Live API testing script

### 4.2 Test Environment

**Decision**: Separate test environments for each component.

**Rationale**:
- **Isolation**: Tests don't interfere with each other
- **Reliability**: Consistent test results
- **Security**: No risk to production data

## 5. Future Considerations

### 5.1 Governance

**Decision**: Admin-controlled operations with potential for DAO governance.

**Rationale**:
- **Flexibility**: Can evolve governance model
- **Security**: Current admin control is secure
- **Upgradability**: Can implement complex governance later

### 5.2 Cross-chain Integration

**Decision**: Solana-first with potential for cross-chain bridges.

**Rationale**:
- **Performance**: Solana's high throughput
- **Cost**: Low transaction fees
- **Ecosystem**: Growing DeFi ecosystem

### 5.3 Advanced Features

**Decision**: Modular design for easy feature addition.

**Planned Features**:
- Liquidity mining
- Advanced order types
- Market categories
- Social features