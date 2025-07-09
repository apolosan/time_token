# TIME Token Finance

![TIME Token Logo](logo/time_token_logo.svg)

## Overview

TIME Token Finance is a decentralized finance (DeFi) protocol that introduces a unique tokenomics system centered around the concept of "time" as a financial asset. Built on multiple blockchain networks, this protocol allows users to mine TIME tokens, participate in liquidity pools, and earn returns through various mechanisms.

### Key Concepts

- **TIME Token**: A native ERC-20 token representing time-based value
- **Mining System**: Block-based mining mechanism for TIME token generation
- **Employer Contract**: Investment vehicle offering yield generation
- **Multi-Chain Support**: Deployed across Ethereum, BSC, Polygon, Fantom, Arbitrum, and more

## Platform

Visit the live platform at: [https://timetoken.finance](https://timetoken.finance)

## Architecture

### Core Contracts

#### 1. TimeToken.sol
The main contract implementing the TIME token with the following features:

- **ERC-20 Compliance**: Standard token functions with custom transfer logic
- **Mining System**: Users can enable mining to earn TIME tokens per block
- **Liquidity Pool**: Internal AMM for TIME/ETH swaps
- **Dividend System**: Profit sharing mechanism for token holders
- **Dynamic Fee Structure**: Adaptive fees based on network conditions

**Key Functions:**
- `enableMining()`: Enable mining for ETH payment
- `enableMiningWithTimeToken()`: Enable mining with TIME tokens
- `mining()`: Mint TIME tokens based on blocks mined
- `saveTime()`: Exchange ETH for TIME tokens
- `spendTime()`: Exchange TIME tokens for ETH
- `withdrawShare()`: Claim dividend earnings

#### 2. Employer.sol
Investment contract offering yield generation through TIME token integration:

- **Deposit System**: Accept ETH deposits for yield generation
- **Yield Anticipation**: Use TIME tokens to accelerate earnings
- **Compounding**: Automatic reinvestment of earnings
- **ROI Tracking**: Real-time and historical return calculations

**Key Functions:**
- `deposit()`: Deposit ETH and TIME tokens
- `compound()`: Compound earnings back into deposits
- `anticipate()`: Use TIME tokens to anticipate yields
- `withdrawEarnings()`: Withdraw earned returns
- `withdrawDeposit()`: Withdraw principal deposit

#### 3. ITimeToken.sol
Interface defining the TIME token contract structure for external integrations.

## Network Deployments

The protocol is deployed across multiple blockchain networks with network-specific configurations:

| Network | Base Fee | Time Base Liquidity | Time Base Fee |
|---------|----------|-------------------|---------------|
| Ethereum | 0.01 ETH | 2,000,000 TIME | 48,000,000 TIME |
| Polygon | 10 MATIC | 200,000 TIME | 4,800,000 TIME |
| BSC | 0.1 BNB | 200,000 TIME | 4,800,000 TIME |
| Fantom | 20 FTM | 400,000 TIME | 9,600,000 TIME |
| Arbitrum | 0.01 ETH | 2,000,000 TIME | 48,000,000 TIME |

## Tokenomics

### Mining Mechanism
- **Block-based Mining**: 1 TIME token per block per enabled address
- **Enable Mining Fee**: Dynamic fee based on network conditions
- **Miner Rewards**: 1% of mined tokens go to block validators

### Fee Structure
- **Commission Rate**: 2% on all transactions
- **Share Rate**: 4x distribution of commissions
- **Developer Fee**: 50% of commissions to development fund
- **Miner Fee**: 50% of commissions to block validators

### Liquidity Factors
- **Native Liquidity Factor**: 11-20 range affecting swap rates
- **TIME Liquidity Factor**: 11-20 range affecting swap rates
- **Dynamic Adjustment**: Factors adjust based on trading activity

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Hardhat development environment

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/time_token.git
cd time_token

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables
Create a `.env` file with the following variables:

```env
MNEMONIC_PRODUCTION=your_production_mnemonic
MNEMONIC_LOCAL=your_local_mnemonic
MNEMONIC_MUMBAI=your_mumbai_testnet_mnemonic
PRIVATE_KEY_EVMOS=your_evmos_private_key
```

### Available Scripts

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.js --network development

# Deploy to testnet
npx hardhat run scripts/deploy.js --network mumbai

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network polygon
```

## Testing

The project includes comprehensive tests for all contract functionality:

### Test Files
- `test/timetoken_test.js`: TIME token contract tests
- `test/employer_test.js`: Employer contract tests
- `test/sample-test.js`: Additional test cases

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/timetoken_test.js

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

## Smart Contract Security

### Security Features
- **Reentrancy Protection**: All external calls protected with nonReentrant modifier
- **SafeMath**: Mathematical operations protected against overflow/underflow
- **Access Control**: Developer address hardcoded for security
- **Emergency Functions**: Emergency withdrawal functions for user protection

### Audit Considerations
- Contract uses OpenZeppelin security standards
- All external calls properly protected
- State changes occur before external calls
- Input validation on all public functions

## Usage Examples

### Mining TIME Tokens

```javascript
const timeToken = await TimeToken.deploy("TIME", "Time Token");

// Enable mining with ETH
const fee = await timeToken.fee();
await timeToken.enableMining({ value: fee });

// Mine TIME tokens
await timeToken.mining();
```

### Using Employer Contract

```javascript
const employer = await Employer.deploy(timeTokenAddress);

// Deposit ETH and TIME tokens
await timeToken.approve(employer.address, timeAmount);
await employer.deposit(timeAmount, false, { value: ethAmount });

// Compound earnings
await employer.compound(0, false);
```

### Liquidity Operations

```javascript
// Buy TIME tokens with ETH
await timeToken.saveTime({ value: ethAmount });

// Sell TIME tokens for ETH
await timeToken.spendTime(timeAmount);

// Check swap prices
const buyPrice = await timeToken.swapPriceNative(ethAmount);
const sellPrice = await timeToken.swapPriceTimeInverse(timeAmount);
```

## API Reference

### TimeToken Contract

#### View Functions
- `fee()`: Get current mining enable fee in native currency
- `feeInTime()`: Get current mining enable fee in TIME tokens
- `averageMiningRate()`: Get average TIME tokens mined per block
- `swapPriceNative(uint256)`: Get TIME/ETH swap price
- `swapPriceTimeInverse(uint256)`: Get ETH/TIME swap price
- `accountShareBalance(address)`: Get claimable dividend balance
- `withdrawableShareBalance(address)`: Get total withdrawable balance

#### State-Changing Functions
- `enableMining()`: Enable mining for caller
- `enableMiningWithTimeToken()`: Enable mining with TIME tokens
- `mining()`: Mint TIME tokens for caller
- `saveTime()`: Exchange ETH for TIME tokens
- `spendTime(uint256)`: Exchange TIME tokens for ETH
- `withdrawShare()`: Withdraw dividend earnings
- `donateEth()`: Donate ETH to increase shared balance

### Employer Contract

#### View Functions
- `queryEarnings(address)`: Get current earnings for depositant
- `queryAnticipatedEarnings(address, uint256)`: Get anticipated earnings
- `getCurrentROI()`: Get current return on investment
- `getROI()`: Get historical return on investment
- `anticipationFee()`: Get fee for enabling anticipation

#### State-Changing Functions
- `deposit(uint256, bool)`: Deposit ETH and TIME tokens
- `compound(uint256, bool)`: Compound earnings
- `anticipate(uint256)`: Anticipate earnings with TIME tokens
- `withdrawEarnings()`: Withdraw earnings only
- `withdrawDeposit()`: Withdraw principal deposit
- `enableAnticipation()`: Enable anticipation feature

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines
- Follow existing code style and patterns
- Add comprehensive tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting PRs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is provided as-is, without any warranties. Users should conduct their own research and due diligence before using this protocol. The developers are not responsible for any losses incurred through the use of this software.

## Contact

- Website: [https://timetoken.finance](https://timetoken.finance)
- Developer: 0x731591207791A93fB0Ec481186fb086E16A7d6D0

---

*Built with Hardhat, OpenZeppelin, and Solidity 0.8.0*
