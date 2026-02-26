# Prediction Market

A decentralized prediction market built on Quai Network testnet.

## Project Overview

A blockchain-based prediction market where users can bet on the outcome of real-world events. Winners receive their proportional share of the losing pool plus their original stake.

## Built On

- **Network**: Quai Network Testnet (Chain ID: 15000)
- **RPC**: https://orchard.rpc.quai.network
- **Framework**: Hardhat
- **Language**: Solidity ^0.8.20
- **Frontend**: React + Vite + ethers.js v6

## Smart Contract Features

- Owner-controlled market resolution
- Custom error handling
- Reentrancy protection
- Proportional reward distribution
- Non-custodial betting

## How to Deploy

```
bash
# Set your private key (Windows)
setx PRIVATE_KEY "your_private_key"

# Install dependencies
npm install

# Deploy to Quai testnet
npm run deploy
```

## How to Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional environment file:

```bash
cp .env.example .env
```

## Smart Contract Functions

- `buyYes()` / `buyNo()` - Place bets
- `resolveMarket(outcome)` - Owner resolves the market (after deadline)
- `claimReward()` - Winners claim their rewards

## Future Roadmap

- **AMM-style Pricing**: Dynamic odds based on pool ratios
- **Tokenization**: NFT positions representing bets
- **Governance**: DAO-controlled market creation
- **Multi-outcome Markets**: Support for more than binary outcomes
- **Layer 2 Scaling**: Cross-chain compatibility
# Prediction-Market-Quai-Network---Hacksrm7.
