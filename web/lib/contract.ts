import { type Address } from 'viem'

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address

export const CASINO_ABI = [
  {
    "type": "function", "name": "deposit", "inputs": [], "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function", "name": "withdraw",
    "inputs": [{"name": "amount", "type": "uint256"}], "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "commitBet",
    "inputs": [
      {"name": "betAmount", "type": "uint256"},
      {"name": "commitHash", "type": "bytes32"},
      {"name": "choice", "type": "uint8"}
    ], "outputs": [], "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "claimTimeout",
    "inputs": [{"name": "betId", "type": "uint256"}], "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "getBalance",
    "inputs": [{"name": "player", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"
  },
  {
    "type": "function", "name": "getBet",
    "inputs": [{"name": "betId", "type": "uint256"}],
    "outputs": [{
      "name": "", "type": "tuple", "components": [
        {"name": "player", "type": "address"},
        {"name": "amount", "type": "uint256"},
        {"name": "commitHash", "type": "bytes32"},
        {"name": "choice", "type": "uint8"},
        {"name": "blockNumber", "type": "uint256"},
        {"name": "status", "type": "uint8"}
      ]
    }], "stateMutability": "view"
  },
  {
    "type": "function", "name": "houseBalance", "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"
  },
  {
    "type": "function", "name": "nextBetId", "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"
  },
  {
    "type": "event", "name": "BetCommitted",
    "inputs": [
      {"name": "betId", "type": "uint256", "indexed": true},
      {"name": "player", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false},
      {"name": "commitHash", "type": "bytes32", "indexed": false},
      {"name": "choice", "type": "uint8", "indexed": false},
      {"name": "blockNumber", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event", "name": "BetRevealed",
    "inputs": [
      {"name": "betId", "type": "uint256", "indexed": true},
      {"name": "player", "type": "address", "indexed": true},
      {"name": "choice", "type": "uint8", "indexed": false},
      {"name": "outcome", "type": "uint8", "indexed": false},
      {"name": "amount", "type": "uint256", "indexed": false},
      {"name": "payout", "type": "uint256", "indexed": false},
      {"name": "secret", "type": "bytes32", "indexed": false},
      {"name": "blockHashUsed", "type": "bytes32", "indexed": false}
    ]
  },
  {
    "type": "event", "name": "BetRefunded",
    "inputs": [
      {"name": "betId", "type": "uint256", "indexed": true},
      {"name": "player", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event", "name": "Deposited",
    "inputs": [
      {"name": "player", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event", "name": "Withdrawn",
    "inputs": [
      {"name": "player", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false}
    ]
  },
] as const

export const MIN_BET = BigInt('1000000000000000')   // 0.001 ETH
export const MAX_BET = BigInt('100000000000000000') // 0.1 ETH

export const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io'
