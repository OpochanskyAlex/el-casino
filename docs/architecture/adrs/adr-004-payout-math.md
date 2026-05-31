---
doc: ADR
id: ADR-004
project: el-casino
version: 0.1
status: accepted
owner: architect
refs:
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, adr]
---

# ADR-004: Integer Arithmetic for Payout (Basis Points)

## Status

Accepted

## Context

Solidity has no floating-point types. The house edge is 2% and the winning payout is 1.96× the bet. These values must be represented and computed exactly in integer arithmetic. The chosen approach must be correct for all valid bet amounts (0.001 ETH to 0.1 ETH), produce no overflow, and be legible to an operator with near-zero Solidity experience (BRD C6). The house edge must be declared as a contract constant that cannot change post-deploy (NFR8, BR1).

## Options Considered

- **Option A: Basis-points integer math** — Express the house edge as `HOUSE_EDGE_BPS = 200` (200 basis points = 2%). Payout formula: `payout = (betAmount * (10000 - HOUSE_EDGE_BPS)) / 5000`. For a winning flip (probability 1/2), the expected-value-neutral payout would be 2× the bet; applying 2% edge gives 1.96×. In integer terms: `payout = betAmount * 9800 / 5000`. The liquidity reserve formula is `betAmount * 196 / 100` (equivalent, used in `totalPendingReserved`).
- **Option B: Fixed-point library (PRBMath)** — Use the PRBMath library's `UD60x18` type for 18-decimal fixed-point arithmetic. More expressive for complex formulas; adds a library dependency.
- **Option C: Floating point** — Not possible in Solidity. Eliminated.

## Decision

Option A: basis-points integer math.

The payout formula is simple enough that a fixed-point library adds zero value: there is one multiplication and one division. Basis points are the standard Solidity convention for percentage values (used throughout OpenZeppelin and DeFi contracts); any Solidity reader will recognize `HOUSE_EDGE_BPS = 200` immediately.

**Overflow analysis (Q2 closure):** The multiplication before division is `betAmount * 9800`. Maximum `betAmount` is 0.1 ETH = 1e17 wei. Maximum intermediate value: `1e17 * 9800 = 9.8e20`. Solidity `uint256` max is approximately `1.15e77`. No overflow is possible. Solidity 0.8.x checked arithmetic would additionally revert before any silent wrap. Q2 is closed.

**Multiplication-before-division ordering:** The formula must multiply before dividing to avoid precision loss. `(betAmount * 9800) / 5000` is correct. `betAmount / 5000 * 9800` would lose precision for small bets; this ordering is never used.

**Liquidity formula consistency:** The portfolio liquidity check (FR18, BR5) uses `betAmount * 196` (equivalent to `1.96 × betAmount` scaled by 100) to keep all arithmetic integer. `totalPendingReserved` accumulates `betAmount * 196 / 100` per bet. This is consistent with the payout formula and avoids mixing scales.

## Consequences

**Positive:**
- No external library dependency for payout math; one less attack surface and one less import.
- `HOUSE_EDGE_BPS = 200` is self-documenting and matches industry convention.
- Formula `(betAmount * 9800) / 5000` is auditable in ~5 seconds by any Solidity reader.
- Immutable `constant` declaration satisfies NFR8; cannot be modified without redeployment.
- Integer division truncates (rounds down), which slightly favors the house — correct behavior for a casino.

**Negative / Trade-offs:**
- If a second game type (R17, deferred-post-MVP) has a different payout structure, the formula may need generalizing. Basis points handle any integer percentage edge cleanly; non-integer edges (e.g., 1.5%) would require a different denominator.
- `betAmount * 196 / 100` (used in `totalPendingReserved`) and `betAmount * 9800 / 5000` (used in payout) are equivalent but written differently. Both should have inline comments explaining they represent `1.96 × betAmount` to avoid confusion during future code review.

**NFRs addressed:** NFR8 (`HOUSE_EDGE_BPS` as contract `constant`), NFR11 (integer math avoids floating-point edge cases that could produce incorrect payout reverts)
