---
doc: UC
id: UC4
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

# UC4: Reveal Bet (Operator)

**Actor:** Operator (contract owner)
**Preconditions:**
- A bet with status `Committed` exists on-chain.
- Operator holds the private key of the contract owner address.
- Operator knows the `secret` that was committed for this bet (stored in the operator's reveal service).
- `block.number <= bets[betId].blockNumber + TIMEOUT_BLOCKS (256)` — reveal is still within the valid window.

**Postconditions (success — Win):**
- Bet status = `Win`.
- `playerBalances[player] += payout` where `payout = (amount × 9800) / 5000`.
- `totalPendingReserved -= 1.96 × amount`.
- `pendingBetCount[player] -= 1`.
- `BetRevealed(betId, player, choice, outcome, amount, payout, secret, blockHashUsed)` emitted.
- Frontend detects `BetRevealed` event; displays win state; updates balance.

**Postconditions (success — Loss):**
- Bet status = `Loss`.
- `houseBalance += amount`.
- `totalPendingReserved -= 1.96 × amount`.
- `pendingBetCount[player] -= 1`.
- `BetRevealed` emitted with `payout = 0`.
- Frontend detects `BetRevealed` event; displays loss state; updates balance.

**Postconditions (failure):**
- Bet remains `Committed`; no balance changes.

---

## Main Flow

1. Operator's automated reveal service detects a new `BetCommitted` event on-chain.
2. Service retrieves the `secret` associated with `betId` from its internal store.
3. Service calls `revealBet(betId, secret)` as the contract owner.
4. Contract verifies: `keccak256(abi.encodePacked(secret)) == bets[betId].commitHash`.
5. Contract reads `blockhash(bets[betId].blockNumber)`.
6. Contract computes `outcome = uint8(uint256(keccak256(abi.encodePacked(secret, blockHashUsed))) % 2)`.
7. Outcome is compared to `bets[betId].choice`.
8. If outcome matches choice: player wins; `payout = (amount × 9800) / 5000`; credited to player balance.
9. If outcome does not match choice: player loses; bet amount credited to house balance.
10. Bet status updated; reserves adjusted; `BetRevealed` event emitted.
11. Frontend polls for or subscribes to `BetRevealed` event indexed by `betId`.
12. On event receipt, frontend dismisses "Waiting for result..." state and shows win/loss animation and updated balance.

---

## Alternative Flows

**A1 — Operator reveal arrives after blockhash window**
- `blockhash()` in Solidity only returns a valid hash for the most recent 256 blocks.
- If `revealBet` is called more than 256 blocks after the commit block, `blockhash(commitBlock)` returns `bytes32(0)`.
- The contract must handle this: if `blockHashUsed == bytes32(0)`, the reveal is still processed using `bytes32(0)` as the hash input. This is a degenerate randomness case but not a security failure (it still deterministic and verifiable from events).
- Architect to decide: revert if blockhash unavailable vs. proceed with zero hash.

  > Q3 RESOLVED (2026-05-31): The 256-block timeout window and the 256-block blockhash availability window share the same constant intentionally. If the operator does not reveal within 256 blocks, the player may claim a timeout refund AND the blockhash is no longer available. Architect must document this dual use in the contract; 256 blocks is confirmed as the value by operator.

---

## Error Flows

**E1 — Invalid secret (hash mismatch)**
1. Contract computes hash of provided `secret`; does not match stored `commitHash`.
2. Contract reverts: "Invalid secret".
3. Operator service logs the failure; no state change.

**E2 — Bet already resolved**
1. Bet status is not `Committed` (already Win, Loss, or Refunded).
2. Contract reverts: "Bet not pending".

**E3 — Caller is not owner**
1. `msg.sender != owner`.
2. Contract reverts via `onlyOwner` modifier.

---

## Edge Cases

- **EC1 — Race between reveal and claimTimeout:** If the player calls `claimTimeout` in the same block as the operator calling `revealBet`, only the first transaction mined wins. The losing transaction reverts cleanly ("Bet not pending" or "Timeout not reached"). No double-spend possible.

---

## Traces

FR20, FR21, FR22 <- R5, R6, R7, US3
