---
doc: UC
id: UC2
project: el-casino
version: 0.1
status: draft
owner: system-analyst
activities: [deposit]
refs:
  - {doc: brd, version: 0.1}
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, use-case]
---

# UC2: Deposit Funds

**Actor:** Player
**Preconditions:**
- Wallet connected (UC1 completed successfully).
- Chain ID confirmed as Sepolia (`0xaa36a7`).
- Player has a non-zero testnet ETH balance in their MetaMask wallet.

**Postconditions (success):**
- Player's casino balance (held by contract) has increased by the deposited amount.
- `Deposited(player, amount)` event is emitted on-chain.
- Frontend displays the updated casino balance.

**Postconditions (failure):**
- Player's wallet balance and casino balance are unchanged.

---

## Main Flow

1. Player navigates to the deposit area; the deposit form is visible and enabled.
2. Player enters a deposit amount (e.g., `0.05`).
3. Frontend validates: amount >= 0.001 ETH, amount <= 0.1 ETH, amount <= player wallet balance.
4. Validation passes; MetaMask prompt appears for the `deposit()` payable call with the entered amount.
5. Player clicks "Confirm" in MetaMask.
6. Transaction is submitted to the Sepolia mempool.
7. Frontend enters loading state: deposit button disabled, spinner shown.
8. Transaction is mined and confirmed (1 block).
9. Frontend receives the confirmation; calls `getBalance(player)`.
10. Updated casino balance is displayed; loading state cleared.
11. Faucet link remains visible near the form.

---

## Alternative Flows

**A1 — Player uses "Withdraw all" equivalent: deposits maximum allowed**
- Amount input is pre-filled with the lesser of player wallet balance and 0.1 ETH.
- Flow continues from step 3.

**A2 — Player already has a non-zero casino balance and tops up**
- Player's casino balance is > 0 at the start of the flow.
- Main flow steps 1–9 apply without change.
- Postcondition: `playerBalances[player] += depositAmount` (additive; existing balance is not overwritten).
- Step 10: frontend re-reads `getBalance(player)` and displays the new, higher total balance. UI shows the updated total (e.g., "Casino balance: 0.07 ETH") not just the incremental amount.

---

## Error Flows

**E1 — Amount below minimum (step 3)**
1. Entered amount < 0.001 ETH.
2. Frontend shows inline validation error: "Minimum deposit is 0.001 ETH."
3. MetaMask prompt is not triggered.

**E2 — Amount above maximum (step 3)**
1. Entered amount > 0.1 ETH.
2. Frontend shows: "Maximum deposit is 0.1 ETH."
3. MetaMask prompt is not triggered.

**E3 — Amount exceeds wallet balance (step 3)**
1. Entered amount > MetaMask wallet ETH balance.
2. Frontend shows: "Amount exceeds your wallet balance."
3. MetaMask prompt is not triggered.

**E4 — Player rejects MetaMask prompt (step 5)**
1. Player clicks "Reject" in MetaMask.
2. Frontend catches EIP-1193 error code 4001.
3. Displays dismissible message: "Transaction rejected. No funds were moved."
4. Returns to deposit-ready state.

**E5 — Transaction reverts on-chain (step 8)**
1. Transaction included in block but reverted.
2. Frontend displays: "Deposit failed. Your funds were not moved. Check Etherscan for details." with link to the transaction hash on Sepolia Etherscan.
3. Casino balance unchanged.

**E6 — Wallet balance is zero**
1. Player has no ETH in wallet.
2. Faucet link displayed prominently: "Need testnet ETH? Get some from [Sepolia Faucet](https://sepoliafaucet.com)."
3. Deposit form is shown but any attempt triggers E3.

---

## Traces

FR6, FR7, FR8, FR9, FR10, FR11 <- R3, R4, R13, R11, R12, US2
