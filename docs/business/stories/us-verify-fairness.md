---
doc: US
id: US6
project: el-casino
version: 0.1
status: draft
owner: business-analyst
reviewed_by: null
score: null
activities: [fairness-audit]
refs:
  - {doc: brd, version: 0.1}
updated: 2026-05-31
tags: [project-docs, user-story]
---

# US6: Verify Fairness On-Chain

Traces to [[brd|R10]], [[brd|R15]], [[brd|R16]] and [[brd|G2]], [[brd|G3]].

Activity tags: `@fairness-audit`

## Story

As a **skeptical player or on-chain verifier**, I want **to independently confirm that a game round was decided fairly using only public blockchain data**, so that **I can trust the casino is not manipulating outcomes**.

## Acceptance Criteria

- AC6.1 The app displays the deployed casino contract address and a direct link to that contract on Sepolia Etherscan, visible without connecting a wallet.
- AC6.2 Each completed game round's outcome transaction, when viewed on Sepolia Etherscan, exposes a log event containing: player address, round ID, player choice, randomness input(s), outcome, bet amount, and payout amount.
- AC6.3 The app includes a "How to Verify" section (page or modal) written in plain language (no Solidity knowledge assumed), explaining step-by-step how to locate a round's transaction on Etherscan and recompute the outcome from the logged values.
- AC6.4 The "How to Verify" section explicitly states what randomness mechanism is used (e.g., "commit-reveal" or "Chainlink VRF") and what guarantee it provides — and what it does not guarantee (honest disclosure of limitations).
- AC6.5 The contract source code is verified on Sepolia Etherscan (ABI and Solidity source publicly readable); the "How to Verify" section includes a link to the verified contract.
- AC6.6 The README in the repository includes the same verification instructions as AC6.3 for an evaluator who reads the codebase directly.
- AC6.7 A verifier who follows the steps in AC6.3 can recompute any historical outcome using only: the Etherscan event log, the verified contract source code, and basic arithmetic or a simple script — without needing to contact the operator.

## Notes

This story captures the "paranoid player" persona from the CLAUDE.md task statement. The acceptance criteria are written to be verifiable by an evaluator who acts as SH3.

AC6.4 honest disclosure requirement: if commit-reveal is used, the operator must submit the reveal and could theoretically withhold it (griefing). This limitation must be stated in the "How to Verify" section. This is not a blocker for G2, but the limitation must not be hidden.

AC6.5 requires the deploy process to include contract verification via Etherscan API. This is an operational constraint on the deployer — raise to architect.

## Open Questions

- ~~Q_US6_1 If Chainlink VRF is used (BRD Q1), verification steps differ from commit-reveal; AC6.3/AC6.4 were placeholders.~~ **RESOLVED (BRD Q1):** Commit-reveal chosen. AC6.3 and AC6.4 are authoritative final criteria for the commit-reveal verification flow, not placeholders.
- Q_US6_2 Should the "How to Verify" section include a code snippet (e.g., Python or JavaScript) showing how to recompute an outcome? This would significantly strengthen G2 for a technical evaluator. Recommended: yes. Needs operator confirmation.
