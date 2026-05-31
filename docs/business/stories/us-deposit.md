---
doc: US
id: US2
project: el-casino
version: 0.1
status: draft
owner: business-analyst
reviewed_by: null
score: null
activities: [deposit]
refs:
  - {doc: brd, version: 0.1}
updated: 2026-05-31
tags: [project-docs, user-story]
---

# US2: Deposit Funds

Traces to [[brd|R3]], [[brd|R4]], [[brd|R11]], [[brd|R12]], [[brd|R13]] and [[brd|G1]], [[brd|G3]].

Activity tags: `@deposit`

## Story

As a **player with a connected MetaMask wallet on Sepolia**, I want **to deposit testnet ETH into the casino**, so that **I have a casino balance to bet with**.

## Acceptance Criteria

- AC2.1 A deposit form is visible and enabled only when the wallet is connected and on Sepolia.
- AC2.2 The player can enter an amount of testnet ETH to deposit; the input accepts decimal values (e.g., 0.01 ETH).
- AC2.3 Submitting the deposit triggers a MetaMask transaction prompt for the exact entered amount to the casino contract address.
- AC2.4 While the transaction is pending (mempool through confirmation), the UI shows a loading/pending indicator and disables the deposit button.
- AC2.5 After 1 block confirmation, the player's casino balance displayed in the UI increases by the deposited amount.
- AC2.6 If the player rejects the transaction in MetaMask, the UI returns to the ready state with a dismissible message: "Transaction rejected. No funds were moved."
- AC2.7 If the transaction reverts on-chain, the UI displays: "Deposit failed. Your funds were not moved. Check Etherscan for details." with a link to the transaction on Sepolia Etherscan.
- AC2.8 If the entered amount exceeds the player's wallet balance, the UI displays a validation error before the MetaMask prompt is triggered: "Amount exceeds your wallet balance."
- AC2.9 A link to a Sepolia ETH faucet (e.g., sepoliafaucet.com) is displayed near the deposit form for players with zero wallet balance.
- AC2.10 The player's current casino balance is visible at all times while connected, updated after every confirmed transaction.
- AC2.11 The deposit amount must be at least 0.001 ETH and must not exceed 0.1 ETH; entering a value outside this range shows a validation error before the MetaMask prompt is triggered.

## Notes

The deposit operation is a `payable` function call on the casino contract. The ETH value is attached to the transaction, not a separate approval step (no ERC-20 involved in MVP). Casino balance is read from the contract's `balanceOf(address)` view function or equivalent.

## Open Questions

- ~~Q_US2_1 What is the minimum deposit amount?~~ **RESOLVED (BRD Q4):** Minimum 0.001 ETH. Captured in AC2.11.
- ~~Q_US2_2 Is there a maximum deposit amount?~~ **RESOLVED (BRD Q4):** Maximum 0.1 ETH. Captured in AC2.11.
