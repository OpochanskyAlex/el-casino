---
doc: REVIEW
project: el-casino
reviewed_doc: srs
reviewed_version: 0.1
reviewer: system-analyst-reviewer
date: 2026-05-31
previous_review: srs-v0.1-20260531T0040Z.md
verdict: approved
score: 8.0
suggest_major_bump: false
---

# SRS Re-Review — v0.1 (Revision 1)

---

## Universal Checks (re-run)

**U1 — Boundary: PASS**
SA files unchanged in scope: `srs.md`, all eight `uc-*.md` files, `use-case-diagram.puml`. No business or architecture files touched. Changelog entry `2026-05-31T01:10Z` confirms files modified: `srs.md`, `uc-commit-bet.md`, `uc-reveal-bet.md`, `uc-deposit.md`, `use-case-diagram.puml`. All within boundary.

**U2 — Version discipline: PASS**
All SA-owned files remain at `version: 0.1`. No version drift or spurious bumps.

**U3 — Refs hygiene: PASS**
- `srs.md` front-matter: `refs: [{doc: brd, version: 0.1}]`. Correct.
- All eight UC files carry `refs: [{doc: brd, version: 0.1}, {doc: srs, version: 0.1}]`. Correct and complete.

**U4 — Obsidian links: PASS**
Use Cases Index uses `[[uc-connect-wallet|UC1 Connect Wallet]]` etc. UC trace sections reference BRD items and US items by plain ID. No broken link targets found.

**U5 — Activity tags: PASS**
All FR1–FR38 and NFR1–NFR11 carry exactly one valid `@<act>` tag from the canonical taxonomy. BR entries also tagged. No missing or invalid tags.

**U6 — ID stability: PASS**
FRs FR1–FR38, NFRs NFR1–NFR11, BRs BR1–BR9, UCs UC1–UC8 — all sequential, no gaps, no renames from prior review.

**User story file existence: PASS**
All six `us-*.md` files referenced from FRs and BRD exist: `us-connect-wallet.md`, `us-deposit.md`, `us-place-bet.md`, `us-view-result.md`, `us-withdraw.md`, `us-verify-fairness.md`.

---

## Previous Findings Resolution

**F1 [fixed]** — `commitBet` is now `external` (non-payable) with signature `commitBet(uint256 betAmount, bytes32 commitHash, uint8 choice)`; FR15, FR16, API contract, and Q6 resolution all consistent. Payable split eliminated.

**F2 [fixed]** — FR18 and BR5 now use `houseBalance * 100 >= totalPendingReserved * 110 + betAmount * 196`. The 1.10 safety factor applies to the entire `totalPendingReserved` pool; the new bet's payout is added in full (×1.0 without buffer). This matches the R21 intent. API contract pre-check updated to match. Formula is consistent across FR18, BR5, and `commitBet` pre-checks.

**F3 [fixed]** — Open Questions section now shows Q3, Q4, Q6 with strikethrough and explicit `RESOLVED:` notes. Inline notes in FR23 carry `> Q3 RESOLVED (2026-05-31)`. FR35 updated from `[should]` to `[must]` for Q4. Q6 resolution note in Open Questions is explicit. All three resolved questions have no remaining unresolved-sounding language in the SRS body.

**F4 [fixed]** — Preimage is now `keccak256(abi.encodePacked(secret))` — secret alone, no `betId`. DM1 `commitHash` field explicitly states "preimage is the secret alone; no betId in preimage." UC3 step 5 updated accordingly. UC3 EC2 marked `(RESOLVED)` with a one-sentence rationale. Race condition eliminated by design.

**F5 [fixed]** — `deposit()` revert conditions now read: "None in MVP (contract-level range checks deferred per Q5). If architect adds `msg.value == 0` guard: `msg.value == 0 → 'Zero deposit not allowed'`." Architect decision is explicitly surfaced with a recommended guard.

**F6 [fixed]** — UC2 now has A2: "Player already has a non-zero casino balance and tops up." Postcondition correctly states `playerBalances[player] += depositAmount` (additive). UI behaviour on updated total balance described.

**F7 [fixed]** — Player Balance Lifecycle state machine now has two separate loss transitions: `Funded --> Funded : loss [casinoBalance > bet.amount]` and `Funded --> Zero : loss [casinoBalance == bet.amount]`. The misleading direct Funded→Zero via generic loss is gone.

**F8 [fixed]** — NFR6 now reads "measured via UptimeRobot or equivalent synthetic monitor at 1-minute intervals during the 48-hour evaluation window." Monitoring instrument and cadence specified.

**F9 [fixed]** — `use-case-diagram.puml` contains comment `' UC1: MetaMask RPC calls only (eth_chainId, eth_requestAccounts); no on-chain tx — Blockchain actor not connected intentionally`. Intentional omission explicitly documented in the diagram file.

**F10 [partially-fixed]** — The UC4 A1 section now carries a `> Q3 RESOLVED` note clarifying the 256-block shared window for timeout and blockhash availability. However, the architect decision between "revert if blockhash unavailable vs. proceed with zero hash" remains open in UC4 A1 body ("Architect to decide: revert if blockhash unavailable vs. proceed with zero hash."). The note links the dual-use intent but does not resolve it. No formal Open Questions SRS entry was added for this as suggested. Partially addressed — dual-window intent documented, resolution still delegated to architect without a numbered Q entry.

**F11 [praise — carried forward]** — Commit-reveal two-step specification quality unchanged; remains thorough and correct.

**F12 [praise — carried forward]** — All three state machines present; the Player Balance Lifecycle is now improved (F7 fix). Quality maintained.

**F13 [praise — carried forward]** — API contract precision maintained; F1 and F5 fixes improve the section further.

**F14 [praise — carried forward]** — NFR measurability maintained; NFR6 measurement instrument added (F8 fix). Quality improved.

---

## New Findings

**F15 [minor] Criterion 4 — `houseWithdraw` pre-check uses subtraction that can underflow in older Solidity patterns**

The `houseWithdraw` API entry states pre-check: `houseBalance - totalPendingReserved >= amount`. In Solidity versions < 0.8.0 (or with `unchecked` blocks in 0.8+), if `totalPendingReserved > houseBalance` due to any accounting edge case, this subtraction would underflow silently. The SRS should specify the check as `houseBalance >= totalPendingReserved + amount` (addition, no underflow risk) or explicitly note that Solidity 0.8+ default overflow protection makes subtraction safe. As written, an architect unfamiliar with Solidity version semantics could implement this check in a way that silently allows over-withdrawal in an unchecked context.

Suggested fix: Rewrite the pre-check as `houseBalance >= totalPendingReserved + amount` — "House balance insufficient for withdrawal." This form is algebraically equivalent and overflow-safe under all Solidity versions.

**F16 [nit] Criterion 2 — UC7 history panel shows up to 20 events but front-matter says "up to the last 5 completed rounds (or up to 20 loaded)"**

UC7 precondition says "at least one completed bet" and postcondition says "displays up to the last 5 completed rounds (or up to 20 loaded)." The parenthetical "or up to 20 loaded" is awkward phrasing that mixes the display limit (5 visible rows per FR25) with the event load limit (20 per FR27). FR25 says "at minimum the last 5" (implying more can show), and FR27 says "last 20 events max". The UC postcondition should reflect the FR25/FR27 numbers explicitly: "loads up to 20 events; displays all loaded rows (minimum 5 if available)." Currently the parenthetical introduces ambiguity about whether only 5 rows are ever shown.

---

## Scores

| # | Criterion | Weight | Score | Justification |
|---|---|---|---|---|
| 1 | Traceability to BRD | 0.25 | 9.0 | All BRD R1–R21 have ≥1 downstream FR. All FRs/NFRs carry explicit `<-` traces to BRD R items, Goals, and US items. Q3/Q4/Q6 resolved in Open Questions with strikethrough and RESOLVED notes. Inline FR notes updated to match. Minor residual: F10 (partially-fixed) means one architect decision (blockhash zero hash) lacks a numbered Q entry in SRS Open Questions, which is a minor traceability gap for architecture handoff. |
| 2 | Completeness of functional spec | 0.25 | 8.5 | All F1/F4 major gaps closed: commitBet is non-payable with correct signature throughout; preimage scheme resolved as secret-only with explicit rationale; UC2 A2 added; UC3 EC2 resolved. Every major FR has a corresponding UC with happy path, alternatives, error flows, and edge cases. F15 (minor) flags an API pre-check form that could mislead an architect, minor deduction. F16 (nit) for UC7 postcondition wording. |
| 3 | Data model & state consistency | 0.15 | 9.0 | DM1 commitHash field explicitly states "preimage is the secret alone; no betId in preimage." DM3 totalPendingReserved definition consistent with FR18 formula. All three state machines present and syntactically valid. Player Balance Lifecycle now correctly handles partial-balance loss (F7 fix). No remaining inconsistencies. |
| 4 | API contract precision | 0.15 | 8.5 | All seven contract functions documented with method, auth, inputs, effects, events, and revert messages. commitBet pre-checks now enumerate the corrected portfolio formula. deposit() revert conditions updated with deferred-MVP note and recommended guard. Minor deduction for F15: houseWithdraw pre-check form is subtraction-based and could mislead on underflow safety semantics. |
| 5 | NFR measurability | 0.10 | 9.5 | All 11 NFRs measurable with concrete thresholds. NFR6 now includes explicit monitoring instrument (UptimeRobot, 1-minute cadence). NFR1 p95 latency, NFR2 block confirmation, NFR4/5 named security patterns, NFR8 constant/immutable requirement, NFR9 Etherscan verification tool — all remain sharp. Virtually no deductions. |
| 6 | Use case diagram currency | 0.10 | 9.0 | All 8 UC files have corresponding diagram nodes. All diagram nodes have corresponding files. Actors (Player, Operator, Blockchain) are present and connected to their UCs. UC1/Blockchain intentional omission is explicitly commented in the .puml file. `<<include>>` and `<<extend>>` relationships are present and correct. Diagram updated in the revision pass (changelog entry confirms `use-case-diagram.puml` modified at 2026-05-31T01:10Z, newer than UC file changes). No deprecated orphan nodes. |

---

## Weighted Total

```
score = (9.0 × 0.25) + (8.5 × 0.25) + (9.0 × 0.15) + (8.5 × 0.15) + (9.5 × 0.10) + (9.0 × 0.10)
      = 2.250 + 2.125 + 1.350 + 1.275 + 0.950 + 0.900
      = 8.850
```

Adjusted downward for F15 (minor, API pre-check form) and F16 (nit, UC postcondition wording) and F10 partial-fix:

```
Deduction: F10 partial-fix (–0.5), F15 minor (–0.2), F16 nit (–0.05)
Adjusted score: 8.850 - 0.750 = 8.1 → rounded to 8.0
```

No blockers. Score 8.0 exceeds the 7.0 approval threshold.

---

## Verdict

**approved** — The SRS revision successfully addresses all four major findings from the previous review and all five minor findings. The document is internally consistent, traces cleanly to the BRD, and provides sufficient precision for the architecture stage to begin.

Top 3 findings for SA awareness:

1. **F10 (partially-fixed)** — UC4 A1 still carries an open architect decision ("revert if blockhash unavailable vs. proceed with zero hash") without a numbered Q entry in the SRS Open Questions list. The intent is documented, but the architect has no formal tracking item. Recommend SA add this as Q8 in the next pass if it is not resolved during architecture.

2. **F15 (minor)** — `houseWithdraw` pre-check is written as `houseBalance - totalPendingReserved >= amount`. Recommend rewriting as `houseBalance >= totalPendingReserved + amount` for underflow safety clarity. Architect should address this in contract implementation.

3. **F16 (nit)** — UC7 postcondition mixes display and load limits. Recommend aligning postcondition with FR25/FR27 exact numbers in the next pass.

Score 8.0. No blockers. Stage advances to `arch`.

---

*Review produced by system-analyst-reviewer on 2026-05-31.*
