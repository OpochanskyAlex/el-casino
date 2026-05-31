---
doc: UC
id: UC8
project: el-casino
version: 0.1
status: draft
owner: system-analyst
activities: [fairness-audit]
refs:
  - {doc: brd, version: 0.1}
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, use-case]
---

# UC8: Verify Fairness On-Chain

**Actor:** Player (or on-chain Verifier / SH3)
**Preconditions:**
- No wallet connection required.
- App is accessible at its public URL.
- At least one completed bet exists on-chain (to verify a real round).

**Postconditions:**
- Verifier can independently recompute any historical bet outcome from public blockchain data alone.
- Verifier has confirmed the contract source is verified on Sepolia Etherscan.

---

## Main Flow

1. Verifier opens the El Casino app.
2. Verifier sees the deployed contract address and a direct Sepolia Etherscan link in the footer/header (no wallet connection required).
3. Verifier navigates to the "How to Verify" section from the main navigation.
4. Verifier reads the plain-language explanation of the commit-reveal mechanism.
5. Verifier follows the step-by-step instructions:
   a. Go to Sepolia Etherscan, open the contract address.
   b. Navigate to the "Events" tab; find a `BetRevealed` event.
   c. Note the event fields: `betId`, `player`, `choice`, `outcome`, `amount`, `payout`, `secret`, `blockHashUsed`.
   d. Recompute: `derived_outcome = keccak256(abi.encodePacked(secret, blockHashUsed)) % 2`.
   e. Confirm `derived_outcome == outcome` from the event.
   f. Confirm `payout == (amount × 9800) / 5000` if outcome matched the player's choice; else `payout == 0`.
6. Verifier reads the honest disclosure of the commit-reveal limitation: the operator must submit the reveal, and could theoretically withhold it (but the player can claim a refund after 256 blocks).
7. Verifier optionally runs the provided code snippet (Python or JavaScript) to automate step 5d–f.
8. Verifier clicks the "View verified contract source" link to Sepolia Etherscan and confirms source code is published.

---

## Alternative Flows

**A1 — Verifier has no prior round to check**
1. Verifier visits app before any bets have been placed.
2. "How to Verify" section still explains the mechanism and links to the contract.
3. Verifier can manually inspect the contract's source and state on Etherscan.

---

## Error Flows

**E1 — Contract source not yet verified on Etherscan**
1. Etherscan shows "Contract Source Code Not Verified."
2. Verifier cannot complete step 8.
3. This violates NFR9 and C3; this is an operational deployment failure, not a UI state.

**E2 — Event fields insufficient for recomputation**
1. `BetRevealed` event is missing `secret` or `blockHashUsed`.
2. Verifier cannot complete step 5d.
3. This violates NFR7; architect must ensure all fields are emitted.

---

## Edge Cases

- **EC1 — blockhash not available for old rounds:** If the commit block is more than 256 blocks ago and the operator revealed using `bytes32(0)` as the blockhash (see UC4 A1), the verifier must be told that `blockHashUsed == 0x000...000` means the blockhash was unavailable at reveal time. The "How to Verify" section must explain this degenerate case.
- **EC2 — Verifier uses the code snippet:** The snippet reads the event log directly from the Sepolia RPC, extracts the fields, and prints whether the computed outcome matches. This requires no Solidity knowledge, satisfying G2 and AC6.7.

---

## Traces

FR32, FR33, FR34, FR35 <- R10, R15, R16, US6, NFR7, NFR9
