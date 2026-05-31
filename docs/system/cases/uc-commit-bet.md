---
doc: UC
id: UC3
project: el-casino
version: 0.1
status: draft
owner: system-analyst
activities: [gameplay]
refs:
  - {doc: brd, version: 0.1}
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, use-case]
---

# UC3: Commit Bet

**Actor:** Player
**Preconditions:**
- Wallet connected and on Sepolia (UC1 complete).
- Player casino balance > 0 (UC2 complete or previous winnings).
- Player has fewer than 2 pending (committed, unrevealed) bets.
- House liquidity check would pass for the proposed bet amount.

**Postconditions (success):**
- A new Bet record is created with status `Committed`.
- Player's casino balance is debited by the bet amount.
- `totalPendingReserved` increased by `1.96 × bet`.
- `BetCommitted(betId, player, amount, commitHash, choice, blockNumber)` event emitted.
- Frontend shows "Waiting for result..." state for this bet.
- UC4 (Reveal Bet) becomes the next expected action by the Operator.

**Postconditions (failure):**
- No state change; player balance unchanged.

---

## Main Flow

1. Player views the game area; bet form is enabled.
2. Frontend displays "House edge: 2%. Winning payout: 1.96× your bet." adjacent to bet input.
3. Player enters bet amount (e.g., `0.01`) and selects Heads (choice = 0) or Tails (choice = 1).
4. Frontend validates: amount >= 0.001 ETH, amount <= 0.1 ETH, amount <= casino balance, pending bet count < 2.
5. Frontend generates a cryptographically random `secret` (32 bytes) locally; computes `commitHash = keccak256(abi.encodePacked(secret))`.
6. Frontend stores `secret` in session memory (not persisted to localStorage or server).
7. MetaMask prompt appears for `commitBet(betAmount, commitHash, choice)` call.
8. Player clicks "Confirm" in MetaMask.
9. Transaction submitted to Sepolia mempool; frontend enters loading state.
10. Transaction mined (1 block); `BetCommitted` event emitted.
11. Frontend reads `betId` from event; stores association of `betId → secret`.
12. Frontend transitions game area to "Waiting for result..." state showing the committed bet amount.
13. "Place Bet" button disabled; "Claim timeout refund" button shown (disabled until timeout block reached).

---

## Alternative Flows

**A1 — Player already has 1 pending bet (2-bet limit not yet reached)**
- Steps 1–13 proceed normally; pending bet count becomes 2.
- After step 13, "Place Bet" button is disabled with message: "You have reached the maximum of 2 pending bets."

---

## Error Flows

**E1 — Bet below minimum (step 4)**
1. Amount < 0.001 ETH.
2. Frontend shows: "Minimum bet is 0.001 ETH."
3. MetaMask not triggered.

**E2 — Bet above maximum (step 4)**
1. Amount > 0.1 ETH.
2. Frontend shows: "Maximum bet is 0.1 ETH."
3. MetaMask not triggered.

**E3 — Bet exceeds casino balance (step 4)**
1. Amount > playerBalances[player].
2. Frontend shows: "Bet exceeds your casino balance."
3. MetaMask not triggered.

**E4 — 2 pending bets already (step 4)**
1. `pendingBetCount[player] == 2`.
2. Frontend shows: "You have reached the maximum of 2 pending bets. Please resolve your existing bets before placing a new one."
3. MetaMask not triggered.

**E5 — Insufficient house liquidity (contract revert)**
1. Contract's liquidity check fails.
2. Transaction reverts with reason "Insufficient house liquidity".
3. Frontend shows: "The house cannot cover this payout right now. Try a smaller bet or wait for liquidity to free up."

**E6 — Player rejects MetaMask prompt (step 8)**
1. EIP-1193 error code 4001.
2. Frontend shows dismissible message: "Transaction rejected. Bet not placed."
3. Returns to bet-ready state; balance unchanged.

**E7 — Transaction reverts (other reason)**
1. On-chain revert for any other reason.
2. Frontend shows: "Bet failed on-chain. No balance change. View transaction on Etherscan." with link.

---

## Edge Cases

- **EC1:** Player closes the browser between commit (step 10) and reveal (UC4). On next visit, frontend must detect pending bets via `getPendingBets(player)` and restore "Waiting for result..." state. The stored `secret` is lost if session memory was cleared; player must use `claimTimeout` (UC5) to recover funds.
- **EC2 (RESOLVED):** The preimage for `commitHash` is the secret alone: `keccak256(abi.encodePacked(secret))`. `betId` is not included in the preimage. This eliminates the race condition that would arise from including `nextBetId` (which is assigned inside the transaction and cannot be known by the frontend before mining). The frontend generates `secret` and computes the hash before calling `commitBet`; the contract assigns `betId` independently. See FR15 and DM1.

---

## Traces

FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19 <- R5, R6, R7, R8, R19, R20, R21, US3
