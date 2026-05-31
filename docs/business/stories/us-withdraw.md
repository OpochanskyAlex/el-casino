---
doc: US
id: US5
project: el-casino
version: 0.1
status: draft
owner: business-analyst
reviewed_by: null
score: null
activities: [withdraw]
refs:
  - {doc: brd, version: 0.1}
updated: 2026-05-31
tags: [project-docs, user-story]
---

# US5: Withdraw Balance

Traces to [[brd|R9]], [[brd|R11]], [[brd|R12]] and [[brd|G1]], [[brd|G3]].

Activity tags: `@withdraw`

## Story

As a **player with a non-zero casino balance**, I want **to withdraw testnet ETH from the casino back to my wallet**, so that **I can access my winnings or recover my remaining funds**.

## Acceptance Criteria

- AC5.1 A "Withdraw" action is visible and enabled only when the player is connected, on Sepolia, and has a casino balance greater than zero.
- AC5.2 The player can specify the amount to withdraw (partial withdrawal) or select "Withdraw all".
- AC5.3 The withdrawal amount must be greater than zero and must not exceed the player's current casino balance; the UI validates this before submitting.
- AC5.4 Submitting the withdrawal triggers a MetaMask transaction prompt signed by the player.
- AC5.5 While the transaction is pending, the UI shows a loading indicator and disables the withdraw button.
- AC5.6 After 1 block confirmation, the player's casino balance in the UI decreases by the withdrawn amount, and the corresponding ETH appears in their MetaMask wallet balance.
- AC5.7 If the player rejects the MetaMask prompt, the UI returns to the ready state with no balance change and a dismissible message.
- AC5.8 If the transaction reverts (e.g., contract has insufficient liquidity to pay), the UI displays: "Withdrawal failed. Please try a smaller amount. View the transaction on Etherscan for details." with a link to the transaction on Sepolia Etherscan.
- AC5.9 Only the player who owns a balance can withdraw it; the contract must reject any withdrawal attempt from a different address.
- AC5.10 The withdrawal amount must be at least 0.001 ETH; entering a lower value shows a validation error before the MetaMask prompt is triggered.

## Notes

AC5.9 is a security invariant, not just UX. The contract enforces this at the EVM level (`msg.sender` check). It is stated here so that the SA and architect are explicitly aware it is a business requirement, not an implementation detail to be inferred.

Partial vs. full withdrawal (AC5.2) is important for usability: a player may want to withdraw winnings while leaving a stake for further play.

## Open Questions

- ~~Q_US5_1 Is there a minimum withdrawal amount?~~ **RESOLVED (BRD Q4):** Minimum 0.001 ETH, matching the deposit floor. Captured in AC5.10.
