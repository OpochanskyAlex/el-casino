---
doc: ADR
id: ADR-001
project: el-casino
version: 0.1
status: accepted
owner: architect
refs:
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, adr]
---

# ADR-001: Single-Contract Architecture

## Status

Accepted

## Context

The system needs to manage player balances, bet lifecycle (commit, reveal, timeout), house liquidity, and access control in a Solidity smart contract. The question is whether these responsibilities belong in one contract or should be split across multiple specialized contracts. The operator has near-zero Solidity experience (BRD C6), so the architecture must minimize complexity at every layer. Verification on Etherscan is a hard requirement (BRD C3, NFR9).

## Options Considered

- **Option A: Single `CasinoV1.sol`** — All logic (player ledger, bet lifecycle, house management, access control) in one contract. One address to verify on Etherscan.
- **Option B: Separate `PlayerLedger.sol` + `GameEngine.sol`** — Balance management in one contract, game logic in another. Contracts call each other via interfaces.
- **Option C: Upgradeable proxy pattern (UUPS or Transparent Proxy)** — Single address that delegates to an implementation contract; can be upgraded post-deploy.

## Decision

Option A: single `CasinoV1.sol`.

The SRS defines three data models (DM1 Bet, DM2 Player Record, DM3 Contract State) that are tightly coupled — `commitBet()` atomically updates all three. Splitting them across contracts would require cross-contract calls, introducing re-entrancy surface, gas overhead, and deployment ordering complexity. For this MVP, the entire state fits comfortably in one contract.

Verification is simpler: one address on Etherscan, one source file for the evaluator to read. The evaluator (SH4) and skeptic (SH3) can inspect all logic in one place without chasing interfaces.

Option B is appropriate when contracts exceed the 24 KB bytecode limit or when different teams own different components; neither applies here. Option C adds proxy storage collision risk and ownership complexity that an operator with near-zero Solidity experience cannot safely manage (BRD C6).

## Consequences

**Positive:**
- Single Etherscan verification step; single ABI for the frontend; simplest possible deployment.
- All invariants (liquidity, pending count, payout) are checked and updated atomically in one transaction, with no cross-contract call surface.
- Minimal audit surface for a 48-hour MVP.
- Any future auditor sees the complete system in one file.

**Negative / Trade-offs:**
- Game logic and financial logic are co-located. To add a second game type (R17, deferred-post-MVP), the contract must be redeployed or a new contract added. There is no runtime upgrade path.
- If the contract exceeds the 24 KB EVM bytecode limit (unlikely for this scope), the single-contract approach would need revisiting.

**NFRs addressed:** NFR4 (owner-gated functions in one `Ownable` contract), NFR5 (ReentrancyGuard applied once), NFR9 (single-address Etherscan verification)
