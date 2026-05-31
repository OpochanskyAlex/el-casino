---
doc: ADR
id: ADR-002
project: el-casino
version: 0.1
status: accepted
owner: architect
refs:
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, adr]
---

# ADR-002: Commit-Reveal Randomness

## Status

Accepted

## Context

On-chain randomness is the hardest problem in EVM smart contract development. The game outcome must not be predictable or manipulable by either the operator or the player before the bet is committed (BRD R6, SRS FR20). The mechanism must be independently verifiable by a skeptic using only public blockchain data (BRD R10, NFR7). The 48-hour build constraint (BRD C7) limits how complex the integration can be.

## Options Considered

- **Option A: Commit-reveal** — Frontend generates a random `secret` off-chain; computes `commitHash = keccak256(abi.encodePacked(secret))`; player calls `commitBet(betAmount, commitHash, choice)`. The operator later calls `revealBet(betId, secret)`. The outcome is `keccak256(abi.encodePacked(secret, blockhash(commitBlock))) % 2`. Both the operator's secret and the commit block's hash are recorded in the `BetRevealed` event so any observer can recompute the result.
- **Option B: Chainlink VRF v2** — After `commitBet()`, the contract requests randomness from Chainlink's VRF coordinator. The Chainlink oracle delivers a random value with a cryptographic proof. Contract fulfills the bet on callback.
- **Option C: Blockhash-only** — Outcome is `blockhash(commitBlock + 1) % 2`. No operator secret; result is deterministic from a future block.

## Decision

Option A: commit-reveal.

Chainlink VRF (Option B) provides stronger guarantees — the randomness is unpredictable even to the operator — and would be the right choice for a production deployment. However, it requires LINK token funding on Sepolia (faucet availability is uncertain), a VRF subscription setup, and a callback-based contract flow that adds meaningful complexity for an operator with near-zero Solidity experience. The integration risk within 48 hours is too high.

Blockhash-only (Option C) is vulnerable to validator MEV: on proof-of-stake Sepolia, a validator who controls the next block can selectively withhold blocks to influence the outcome. This is not acceptable even on a testnet that aims to demonstrate fairness principles.

Commit-reveal (Option A) provides the core fairness guarantee needed for this MVP: neither party can manipulate the outcome after the bet is committed, because the operator's secret is locked in hash form before the player's choice is known, and the block hash is not known until after commitment. The operator liveness risk (withholding the reveal) is fully mitigated by the 256-block timeout enforced by `claimTimeout()` (FR23, BR6). The mechanism is fully auditable on-chain via the `BetRevealed` event (NFR7). VRF is noted as the natural production upgrade path.

Note on blockhash expiry (Q8 resolution): if `revealBet()` is called after 256 blocks, `blockhash(commitBlock)` returns `bytes32(0)`, making the outcome effectively operator-controlled. The contract reverts in this case (`require(blockHashUsed != bytes32(0), "Blockhash expired; player may claim timeout")`), ensuring the player can claim a full refund rather than receiving a degraded outcome.

## Consequences

**Positive:**
- Zero external dependencies; no LINK tokens, no oracle subscriptions, no callback complexity.
- Fully auditable: `BetRevealed` event contains `secret` and `blockHashUsed`; anyone can recompute `keccak256(abi.encodePacked(secret, blockHashUsed)) % 2` and verify it equals `outcome`.
- Python/JS verification snippet (FR35) is straightforward to write.
- Implementable within the 48-hour window.

**Negative / Trade-offs:**
- Operator liveness assumption: if the reveal bot is down for more than 256 blocks (~51 minutes), the player must claim a refund manually. This is a UX friction, not a fund-loss risk.
- Two-transaction flow: player pays gas for `commitBet()` and separately the operator pays gas for `revealBet()`. The operator absorbs the reveal gas cost.
- Not suitable for high-value mainnet bets: a determined miner/validator could theoretically influence `block.prevrandao`. For testnet MVP, this is acceptable and is disclosed in the "How to Verify" section (FR33).
- VRF would require contract redesign post-MVP (no upgrade path from single-contract approach).

**NFRs addressed:** NFR7 (all inputs in `BetRevealed` event; independently recomputable), NFR8 (house edge applied at reveal; edge constant cannot be manipulated)
