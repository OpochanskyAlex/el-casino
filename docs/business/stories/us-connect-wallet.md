---
doc: US
id: US1
project: el-casino
version: 0.1
status: draft
owner: business-analyst
reviewed_by: null
score: null
activities: [wallet]
refs:
  - {doc: brd, version: 0.1}
updated: 2026-05-31
tags: [project-docs, user-story]
---

# US1: Connect Wallet

Traces to [[brd|R1]], [[brd|R2]], [[brd|R11]], [[brd|R12]] and [[brd|G1]], [[brd|G3]].

Activity tags: `@wallet`

## Story

As a **player**, I want **to connect my MetaMask wallet to El Casino**, so that **the app knows my address and I can deposit funds and play**.

## Acceptance Criteria

- AC1.1 A "Connect Wallet" button is visible and actionable on the landing page before any wallet is connected.
- AC1.2 Clicking the button triggers the MetaMask extension's account-selection prompt.
- AC1.3 After the player approves, the app displays the connected account address (truncated, e.g., `0xABCD…1234`).
- AC1.4 If MetaMask is not installed, the app displays an error message stating "MetaMask not found. Please install MetaMask to play." with a link to metamask.io.
- AC1.5 If the connected wallet is on a network other than Sepolia (chain ID 11155111), the app displays a prompt stating "Wrong network. Please switch to Sepolia testnet." and provides a one-click "Switch to Sepolia" action.
- AC1.6 After switching to Sepolia, the app re-reads network and account state without requiring a page reload.
- AC1.7 A "Disconnect" option is available once connected; triggering it returns the UI to the disconnected state.
- AC1.8 If the player rejects the MetaMask connection prompt, the app returns to the disconnected state with no error crash.

## Notes

MetaMask injects `window.ethereum`. The app should use the EIP-1193 provider API (`eth_requestAccounts`, `wallet_switchEthereumChain`). If MetaMask is not present, `window.ethereum` is undefined — this is the detection path for AC1.4.

The "Switch to Sepolia" action maps to `wallet_switchEthereumChain` with `chainId: '0xaa36a7'`.

## Open Questions

- Q_US1_1 Should the app support WalletConnect as a second wallet option, or MetaMask only? CLAUDE.md says MetaMask; default to MetaMask only for MVP.
