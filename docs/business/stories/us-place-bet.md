---
doc: US
id: US3
project: el-casino
version: 0.1
status: draft
owner: business-analyst
reviewed_by: null
score: null
activities: [gameplay]
refs:
  - {doc: brd, version: 0.1}
updated: 2026-05-31
tags: [project-docs, user-story]
---

# US3: Place a Bet and Play

Traces to [[brd|R5]], [[brd|R6]], [[brd|R7]], [[brd|R8]], [[brd|R11]], [[brd|R12]], [[brd|R19]], [[brd|R20]], [[brd|R21]] and [[brd|G1]], [[brd|G2]], [[brd|G4]].

Activity tags: `@gameplay`

## Story

As a **player with a non-zero casino balance**, I want **to place a bet and play a round**, so that **I can win or lose testnet ETH and experience the game**.

## Acceptance Criteria

- AC3.1 The game UI is visible and the "Place Bet" action is enabled only when the player is connected, on Sepolia, and has a casino balance greater than zero.
- AC3.2 The player can enter a bet amount; the UI validates that the amount is greater than the minimum bet of 0.001 ETH, does not exceed the maximum bet of 0.1 ETH, and does not exceed the player's current casino balance.
- AC3.3 The house edge percentage is displayed plainly near the bet input before the player submits (e.g., "House edge: 2%. Winning payout: 1.96× your bet.").
- AC3.4 The player selects their game choice (e.g., Heads or Tails for a coin flip); the choice is required before the "Play" button is enabled.
- AC3.5 Submitting the bet triggers a MetaMask transaction prompt (or an on-chain transaction if the casino balance covers it without a new ETH transfer).
- AC3.6 While the transaction is pending, the UI shows a loading state: the "Play" button is disabled and a spinner or status message is visible.
- AC3.7 The commit transaction is submitted to the blockchain before any reveal transaction for the same bet exists; this ordering is verifiable via Etherscan block timestamps and transaction nonces.
- AC3.8 If the player wins, their casino balance increases by (bet × payout multiplier) and a win state is shown in the UI.
- AC3.9 If the player loses, their casino balance decreases by the bet amount and a loss state is shown in the UI.
- AC3.10 The payout multiplier on a win must satisfy: `payout_multiplier = 2 × (1 − house_edge_fraction)` where `house_edge_fraction` is the stated edge encoded in the contract.
- AC3.11 If the player rejects the MetaMask prompt, the UI returns to the ready state with no balance change and a dismissible message.
- AC3.12 If the transaction reverts (e.g., insufficient contract liquidity), the UI displays a human-readable error with an Etherscan link.
- AC3.13 The UI rejects bet submission if the player already has 2 unresolved (committed, not yet revealed) bets, displaying: "You have reached the maximum of 2 pending bets. Please resolve your existing bets before placing a new one."
- AC3.14 The UI rejects bet submission if house liquidity is below 1.96 × the requested bet amount, with a clear message indicating the house cannot cover the payout.
- AC3.15 The contract rejects a new bet if the total potential payout from all currently unresolved bets (up to the 2-bet limit, R19), calculated at 1.96× each committed amount with a 10% safety factor, would exceed available house liquidity.
- AC3.16 While a bet awaits reveal (commit transaction confirmed, reveal transaction not yet submitted), the game area shows a "Waiting for result..." state displaying the committed bet amount and a "Check result" button; the player cannot place another bet while this state is active, subject to the 2-bet limit (R19).
- AC3.17 [must] If the operator has not submitted the reveal transaction within the timeout period after the commit transaction is confirmed, the player can trigger a "Claim timeout refund" action to recover their committed bet in full; the contract enforces this refund without operator involvement. The specific timeout duration (in blocks) is deferred to SA/architect.

## Notes

Game type: coin flip. Player picks Heads or Tails; contract determines outcome; 2% house edge applied (winning payout = 1.96× bet).

Randomness: commit-reveal pattern. Player's bet transaction includes a hash commitment; the operator submits a reveal transaction to complete the round. The UI must handle the two-step latency: AC3.16 covers the pending-reveal UI state; AC3.17 covers the player's right to reclaim funds if the operator never reveals. Q_US3_1 carried forward to SA for concrete latency/polling specification.

## Open Questions

- Q_US3_1 Acceptable latency between bet commit and result reveal. Should the UI auto-poll and update, or require a manual "Check result" action? Carry to SA for concrete specification.
- ~~Q_US3_2 If the operator never submits the reveal (liveness failure), the player must be able to reclaim their bet after a timeout.~~ **RESOLVED at business level:** AC3.17 establishes the business requirement for player reclaim on operator liveness failure. Timeout duration (in blocks) is deferred to SA/architect.
