# 80U Matrix System - Production Implementation

This project is a high-performance, configuration-driven matrix referral system built with a React frontend and an Express/Node.js backend.

## Architecture

- **Backend**: Express.js + SQLite/PostgreSQL (configured for differential performance bonuses and FIFO matrix placement).
- **Frontend**: React 18 + Tailwind CSS 4 + Wagmi/Viem (Web3).
- **Security**: Hardened backend validation for all seat purchases and rewards.

## Environment Variables

Create a `.env` file in the root:

```env
# Server Config
PORT=3000
NODE_ENV=production

# Database (Optional: defaults to SQLite if not provided)
# DATABASE_URL=postgres://user:password@localhost:5432/matrix_db

# Web3 Config
VITE_RPC_URL_BSC=https://bsc-dataseed.binance.org/
VITE_SYSTEM_WALLET=0xYourSystemWalletAddress
VITE_USDT_CONTRACT_BSC=0x55d398326f99059fF775485246999027B3197955
```

## Production Deployment Instructions

### 1. Prerequisites
- **Docker & Docker Compose**
- **Domain Name** pointed to your server IP.
- **SSL Certificate** (Cloudflare or Nginx Proxy Manager recommended).

### 2. Configuration (`.env`)
Create your production `.env` file based on `.env.example`:

```bash
cp .env.example .env
nano .env
```

**Key Production Variables:**
- `DATABASE_URL`: The Docker Compose file is preset to use the internal Postgres service.
- `VITE_SYSTEM_WALLET_ADDRESS`: Set this to your safe cold wallet or the wallet intended to collect the 80U deposits.
- `VITE_RPC_URL_BSC`: Use a reliable provider like Alchemy, Quicknode, or Ankr for production stability.

### 3. Launching
Run the following command to start both the application and the database in detached mode:
```bash
docker-compose up -d --build
```

### 4. Wallet & Contract References
| Network | USDT Contract Address | RPC URL |
| :--- | :--- | :--- |
| **BNB Chain (BSC)** | `0x55d3...7955` | `https://bsc-dataseed.binance.org/` |
| **Ethereum** | `0xdAC1...1ec7` | `https://eth-mainnet.g.alchemy.com/v2/...` |

### 5. Managing the System Wallet
**Security Note:** 
- The **Private Key** of your `VITE_SYSTEM_WALLET_ADDRESS` is **NOT** required by the web server if you are only verifying incoming payments.
- If you plan to implement **Automated Payouts** (Settlement Engine 2.0), you will need to add a `SYSTEM_WALLET_PRIVATE_KEY` to your server environment. 
- **DO NOT** commit private keys to GitHub. Always use a secret manager or encrypted `.env` files.

### 6. Admin Panel Access
Once deployed, log in with the administrator wallet address (default configured in `server.ts` or via `system_config` table) to manage reward queueing and manual overrides.
