---
doc: UC
id: UC6
project: el-casino
version: 0.1
status: draft
owner: system-analyst
activities: [withdraw]
refs:
  - {doc: brd, version: 0.1}
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, use-case]
---

# UC6: Withdraw Balance

**Actor:** Player
**Preconditions:**
- Wallet connected and on Sepolia (UC1 complete).
- Player's casino balance (`playerBalances[player]`) > 0.

**Postconditions (success):**
- `playerBalances[player]` reduced by the withdrawn amount.
- Withdrawn ETH transferred to player's MetaMask wallet.
- `Withdrawn(player, amount)` event emitted.
- Frontend shows updated (reduced) casino balance.
- Player's MetaMask wallet ETH balance increases by `amount`.

**Postconditions (failure):**
- Casino balance and wallet balance unchanged.

---

## Main Flow

1. Player views the withdrawal section; "Withdraw" form is enabled.
2. Player enters an amount to withdraw or clicks "Withdraw all".
3. Frontend validates: amount >= 0.001 ETH and amount <= casino balance.
4. MetaMask prompt appears for `withdraw(amount)` call.
5. Player clicks "Confirm" in MetaMask.
6. Transaction submitted to Sepolia mempool; loading state begins; withdraw button disabled.
7. Transaction mined (1 block); `Withdrawn` event emitted.
8. Frontend calls `getBalance(player)`; updates displayed casino balance.
9. Loading state cleared; success message shown: "Withdrawal successful."

---

## Alternative Flows

**A1 — "Withdraw all" selected**
1. Player clicks "Withdraw all".
2. Frontend pre-fills amount with the full `playerBalances[player]` value.
3. Flow continues from step 3 (validation passes trivially for the full balance).

**A2 — Partial withdrawal**
1. Player enters an amount less than their full casino balance.
2. After confirmation, casino balance decreases by the partial amount; remaining balance stays in contract.

---

## Error Flows

**E1 — Amount below minimum (step 3)**
1. Entered amount < 0.001 ETH.
2. Frontend shows: "Minimum withdrawal is 0.001 ETH."
3. MetaMask not triggered.

**E2 — Amount exceeds casino balance (step 3)**
1. Entered amount > `playerBalances[player]`.
2. Frontend shows: "Amount exceeds your casino balance."
3. MetaMask not triggered.

**E3 — Player rejects MetaMask prompt (step 5)**
1. EIP-1193 error code 4001.
2. Frontend shows dismissible message: "Transaction rejected. No funds were moved."
3. Returns to withdraw-ready state.

**E4 — Transaction reverts on-chain (step 7)**
1. Contract reverts (e.g., concurrent state change reduced balance).
2. Frontend shows: "Withdrawal failed. Please try a smaller amount. View the transaction on Etherscan for details." with Etherscan link.

**E5 — Casino balance drops to zero after withdrawal**
1. After confirmed withdrawal, `getBalance(player)` returns 0.
2. Withdrawal form is disabled.
3. Deposit form is highlighted as the next available action.

---

## Edge Cases

- **EC1 — Withdrawal while pending bet exists:** A player with a committed, unrevealed bet has a reduced available balance (the bet amount has been deducted from `playerBalances` at commit time). The withdrawal form shows only the remaining free balance. No special handling needed; the contract invariant ensures the bet deduction at commit time.
- **EC2 — Reentrancy protection:** `withdraw()` uses checks-effects-interactions and `ReentrancyGuard`. A malicious contract calling back into `withdraw()` will be blocked. This is a contract-level invariant (NFR5) with no UX surface.

---

## Traces

FR28, FR29, FR30, FR31 <- R9, R11, R12, US5, BR7
