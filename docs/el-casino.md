---
doc: OVERVIEW
project: el-casino
version: 0.1
status: draft
owner: business-analyst
reviewed_by: null
score: null
activities: [wallet, deposit, gameplay, withdraw, fairness-audit, General]
refs: []
updated: 2026-05-31
tags: [project-docs, overview]
---

# El Casino

El Casino is a provably-fair browser-based casino running on the Ethereum Sepolia testnet. Players connect a MetaMask wallet, deposit testnet ETH, play a house-edged game whose randomness is verifiable on-chain, and withdraw their balance at any time. The project is an MVP scoped to approximately 48 hours of build time, targeting a public Railway (or equivalent) deployment.

## Status

| Doc | Version | Status | Last review score |
|---|---|---|---|
| [[brd\|Business Requirements]] | 0.1 | draft | — |
| [[srs\|System Requirements]] | — | — | — |
| [[overview\|Architecture Overview]] | — | — | — |
| [[plan\|Project Plan]] | — | — | — |

## User Activities

Canonical activity taxonomy. Owned by business-analyst. All `@` tags in requirements and stories reference these slugs.

- **@wallet** — wallet connection, MetaMask interactions, connected-account display, network detection
- **@deposit** — depositing testnet ETH into the casino smart contract, balance visibility
- **@gameplay** — placing bets, submitting game transactions, receiving win/loss outcomes
- **@withdraw** — withdrawing casino balance back to the player's wallet
- **@fairness-audit** — on-chain verification flow for skeptical players; reading contract state and events on a block explorer
- **@General** — cross-cutting concerns: availability, security, error handling, performance thresholds

## Business

- **BRD:** [[brd|Business Requirements]]
- **User stories by activity:**
  - **@wallet:** [[us-connect-wallet|US1 Connect wallet]]
  - **@deposit:** [[us-deposit|US2 Deposit funds]]
  - **@gameplay:** [[us-place-bet|US3 Place a bet and play]] · [[us-view-result|US4 View game result]]
  - **@withdraw:** [[us-withdraw|US5 Withdraw balance]]
  - **@fairness-audit:** [[us-verify-fairness|US6 Verify fairness on-chain]]

## System

- **SRS:** [[srs|System Requirements]] — to be produced by systems-analyst
- **Use cases by activity:** — to be produced by systems-analyst

## Architecture

- **Overview:** [[overview|Architecture Overview]] — to be produced by architect
- **ADRs:** — to be produced by architect

## Open Questions (aggregated)

All BRD open questions (Q1–Q6) resolved in operator Q&A on 2026-05-31. See [[brd|BRD]] §Open Questions.

## Reading Order

For first-time readers:
1. This file
2. [[brd|Business Requirements]] — what's needed and why
3. [[srs|System Requirements]] — what the system does and to what standard
4. Specific [[us-connect-wallet]], [[us-deposit]], [[us-place-bet]], [[us-view-result]], [[us-withdraw]], [[us-verify-fairness]] as needed
5. [[overview|Architecture Overview]] — how it's built
