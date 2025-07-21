#!/bin/bash

# Opinion Market Deployment Script
# This script deploys the entire opinion market system to Solana devnet

set -e

echo "🚀 Starting Opinion Market Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v solana &> /dev/null; then
        print_error "Solana CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v anchor &> /dev/null; then
        print_error "Anchor CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    print_status "All dependencies are installed."
}

# Setup Solana configuration
setup_solana() {
    print_status "Setting up Solana configuration..."
    
    # Set to devnet
    solana config set --url devnet
    
    # Check if wallet exists
    if [ ! -f ~/.config/solana/id.json ]; then
        print_warning "No Solana wallet found. Creating new wallet..."
        solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
    fi
    
    # Get wallet public key
    WALLET_PUBKEY=$(solana address)
    print_status "Using wallet: $WALLET_PUBKEY"
    
    # Check balance and airdrop if needed
    BALANCE=$(solana balance)
    print_status "Current balance: $BALANCE"
    
    if [ "$BALANCE" = "0 SOL" ]; then
        print_status "Requesting airdrop..."
        solana airdrop 2
        sleep 5
        BALANCE=$(solana balance)
        print_status "New balance: $BALANCE"
    fi
}

# Build and deploy smart contract
deploy_contract() {
    print_status "Building and deploying smart contract..."
    
    # Build the program
    anchor build
    
    # Get the program ID
    PROGRAM_ID=$(solana address -k contract/target/deploy/opinion_market-keypair.json)
    print_status "Program ID: $PROGRAM_ID"
    
    # Deploy to devnet
    anchor deploy --provider.cluster devnet
    
    print_status "Smart contract deployed successfully!"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        cp ../env.example .env
        print_warning "Created .env file. Please update with your configuration."
    fi
    
    # Build the application
    npm run build
    
    cd ..
    print_status "Backend setup completed!"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        cp ../env.example .env
        print_warning "Created .env file. Please update with your configuration."
    fi
    
    cd ..
    print_status "Frontend setup completed!"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run smart contract tests
    anchor test
    
    # Run backend tests
    cd backend
    npm test
    cd ..
    
    print_status "All tests passed!"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start backend in background
    cd backend
    npm run start:dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 10
    
    # Start frontend in background
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    print_status "Services started!"
    print_status "Backend PID: $BACKEND_PID"
    print_status "Frontend PID: $FRONTEND_PID"
    print_status "Backend URL: http://localhost:3001"
    print_status "Frontend URL: http://localhost:3000"
    print_status "API Docs: http://localhost:3001/api/docs"
    
    # Save PIDs for cleanup
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    if [ -f .backend.pid ]; then
        BACKEND_PID=$(cat .backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
    fi
}

# Main deployment function
main() {
    # Set up cleanup on script exit
    trap cleanup EXIT
    
    print_status "Starting Opinion Market deployment..."
    
    # Check dependencies
    check_dependencies
    
    # Setup Solana
    setup_solana
    
    # Deploy contract
    deploy_contract
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Run tests
    run_tests
    
    # Start services
    start_services
    
    print_status "🎉 Deployment completed successfully!"
    print_status "The Opinion Market system is now running on Solana devnet."
    print_status ""
    print_status "Next steps:"
    print_status "1. Update environment files with your configuration"
    print_status "2. Initialize the program with admin configuration"
    print_status "3. Create your first market"
    print_status "4. Start trading!"
    print_status ""
    print_status "Press Ctrl+C to stop the services"
    
    # Wait for user to stop
    wait
}

# Run main function
main "$@" 