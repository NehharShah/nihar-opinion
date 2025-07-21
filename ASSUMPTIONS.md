# Assumptions & Simplifications

## 1. Smart Contract Assumptions

### 1.1 Token Standard
**Assumption**: Using SOL (native token) for all transactions and fees.

**Simplification**: 
- No SPL token support initially
- All amounts in lamports (1 SOL = 1,000,000,000 lamports)

### 1.2 Market Resolution
**Assumption**: Admin-controlled market resolution (CORE REQUIREMENT MET).

**Simplification**:
- Single admin key for market resolution
- No decentralized oracle integration
- **Status**: Resolution instruction implemented in smart contract

### 1.3 LS-LMSR Implementation
**Assumption**: Alpha value of 2% as specified in requirements.

**Simplification**:
- On-chain calculations for maximum security
- Fixed alpha parameter
- Basic slippage protection

### 1.4 Fee Structure
**Assumption**: Fixed fee collection per transaction (CORE REQUIREMENT MET).

**Simplification**:
- Simple percentage-based fees
- **Status**: Fee collection implemented in buy/sell instructions

## 2. Backend Assumptions

### 2.1 Database
**Assumption**: Single PostgreSQL instance.

**Simplification**:
- No read replicas initially
- Basic connection pooling

### 2.2 Indexing
**Assumption**: Single indexer instance.

**Simplification**:
- Real-time event streaming
- Basic error handling and retries

### 2.3 Authentication
**Assumption**: Wallet-based authentication only.

**Simplification**:
- No traditional username/password
- No social login

## 3. Testing Assumptions

### 3.1 Test Coverage
**Assumption**: Basic test coverage for core functionality.

**Simplification**:
- Unit tests for smart contract logic
- Integration tests for API endpoints
- Live API testing script provided

### 3.2 Test Environment
**Assumption**: Devnet testing environment.

**Simplification**:
- No mainnet testing
- Basic test data setup

## 4. Out of Scope Items

### 4.1 Advanced Features
- Cross-chain bridges
- Advanced order types (limit orders, etc.)
- Social features
- Mobile applications
- Advanced analytics

### 4.2 Enterprise Features
- Multi-tenant architecture
- Advanced permissions
- Custom integrations
- White-label solutions

### 4.3 Compliance Features
- KYC/AML integration
- Regulatory reporting
- Tax reporting
- Audit trails

### 4.4 Performance Features
- Auto-scaling
- Load balancing
- CDN integration
- Advanced caching

## 5. Future Considerations

### 5.1 Scalability
- Horizontal scaling
- Database sharding
- Microservices architecture

### 5.2 Security
- Hardware security modules
- Multi-sig admin
- Advanced encryption
- Security audits

### 5.3 Features
- Advanced market types
- Social features
- Mobile applications
- API marketplace

These assumptions and simplifications allow us to build a functional MVP that meets all core requirements while keeping the door open for future enhancements. 