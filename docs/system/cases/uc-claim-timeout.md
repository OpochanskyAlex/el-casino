---
doc: UC
id: UC5
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

# UC5: Claim Timeout Refund

**Actor:** Player
**Preconditions:**
- A bet with status `Committed` exists for this player.
- `block.number > bets[betId].blockNumber + 256` (timeout has elapsed — approximately 51 minutes at 12 s/block).
- The operator has not submitted `revealBet()` for this bet.
- Wallet connected and on Sepolia.

**Postconditions (success):**
- Bet status = `Refunded`.
- `playerBalances[player] += bet.amount` (full refund; no house edge).
- `totalPendingReserved -= 1.96 × bet.amount`.
- `pendingBetCount[player] -= 1`.
- `BetRefunded(betId, player, amount)` emitted.
- Frontend clears the "Waiting for result..." state; shows "Bet refunded" message with Etherscan link.
- Player's casino balance updated to reflect the refund.

**Postconditions (failure):**
- Bet remains `Committed`; balance unchanged.

---

## Main Flow

1. Player sees a pending bet in "Waiting for result..." state.
2. Frontend polls `block.number` (or subscribes to new block events).
3. When `currentBlock > bet.blockNumber + 256`, the "Claim timeout refund" button becomes enabled.
4. Frontend displays advisory: "The operator has not revealed your bet. You may claim a full refund."
5. Player clicks "Claim timeout refund".
6. MetaMask prompt appears for `claimTimeout(betId)`.
7. Player clicks "Confirm" in MetaMask.
8. Transaction submitted; frontend enters loading state.
9. Transaction mined; `BetRefunded` event emitted.
10. Frontend reads `getBalance(player)` and updates displayed casino balance.
11. "Claim timeout refund" button removed; confirmation shown: "Refund of [amount] ETH received."

---

## Alternative Flows

**A1 — Player has multiple timed-out bets**
- If multiple bets are past the timeout, each is shown independently with its own "Claim timeout refund" button.
- Player must call `claimTimeout(betId)` for each bet separately.

**A2 — Operator reveals before player claims**
- Operator's `revealBet()` transaction mines before the player's `claimTimeout()`.
- If `claimTimeout()` arrives after the reveal: bet status is already `Win` or `Loss`; contract reverts "Bet not pending".
- Frontend catches the revert and shows: "Your bet was already revealed. Check your updated balance."

---

## Error Flows

**E1 — Timeout not yet reached (step 3 check fails)**
1. `currentBlock <= bet.blockNumber + 256`.
2. "Claim timeout refund" button remains disabled.
3. Frontend shows remaining block count: "Refund available in ~X blocks (~Y minutes)."

**E2 — Caller is not the bet's player**
1. Contract checks `msg.sender == bets[betId].player`; fails.
2. Contract reverts: "Not your bet".
3. Frontend shows generic error; should not occur in normal flow since the frontend only shows bets belonging to the connected address.

**E3 — Player rejects MetaMask prompt**
1. EIP-1193 error code 4001.
2. Frontend returns to "Claim timeout refund" button enabled state.
3. Dismissible message: "Transaction rejected."

**E4 — Transaction reverts (unexpected)**
1. Revert for any unexpected reason.
2. Frontend displays: "Refund claim failed. View transaction on Etherscan." with link.

---

## Edge Cases

- **EC1 — Session loss:** Player committed a bet, then cleared browser session. On reconnect, `getPendingBets(player)` returns the betId. Frontend shows the pending bet. If timeout has elapsed, "Claim timeout refund" is enabled. Player can proceed without needing the original `secret` (contract does not require secret for timeout claim).
- **EC2 — Simultaneous race with reveal:** Covered in UC4 EC1. Only one transaction can win; the other reverts cleanly.

---

## Traces

FR23, FR24 <- R5, US3 AC3.17, BR6
