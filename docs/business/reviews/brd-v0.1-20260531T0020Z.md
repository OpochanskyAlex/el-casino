---
doc: REVIEW
project: el-casino
reviewed_doc: brd
reviewed_version: 0.1
reviewer: business-analyst-reviewer
date: 2026-05-31
verdict: needs-revision
score: 7.5
suggest_major_bump: false
---

# BRD Review — v0.1

## Universal Checks

- U1 Boundary — PASS. BA wrote only within `/docs/business/` and `/docs/el-casino.md`. No system or architecture files created.
- U2 Version discipline — PASS. All documents carry `version: 0.1`; no mid-revision bumps detected across BRD and all six user stories.
- U3 refs hygiene — PASS. BRD has `refs: []` (correct; it is the top-level business document). All six US files carry `refs: [{doc: brd, version: 0.1}]`. No stale or missing refs.
- U4 Obsidian links — MINOR violation. See F1. First-mention links in BRD and el-casino.md use `[[file|Display Text]]` correctly. US files use block-anchor style `[[brd#^R1|R1]]` throughout; these are consistent but block anchors (`^R1`) are not defined in brd.md, making them non-resolvable in Obsidian. Broken anchor targets on every traceability link in all six US files.
- U5 Activity tags — PASS. Every R in the BRD carries one `@` tag from the canonical taxonomy. All six US files carry activity tags in frontmatter and body. All tags (`@wallet`, `@deposit`, `@gameplay`, `@withdraw`, `@fairness-audit`, `@General`) match the taxonomy defined in `el-casino.md`.
- U6 ID stability — PASS. Requirements R1–R20 are sequential with no gaps. Goals G1–G4, stakeholders SH1–SH4, constraints C1–C7, and stories US1–US6 are all sequential. No removed items detected.

---

## Findings

**F1** [minor] U4 — `docs/business/stories/*.md` (all six files), traceability section — Block-anchor targets (`[[brd#^R1|R1]]`, `[[brd#^G1|G1]]`, etc.) are used in every user story traceability line, but no block anchors (`^R1`, `^G1`, etc.) are defined in `brd.md`. Obsidian resolves these as broken links; navigating from a story to a specific BRD requirement will fail. Suggested fix: either add `^R1`–`^R20` anchor comments to each requirement line in brd.md, or change traceability links to plain wiki-links with display text (e.g., `[[brd|R1]]`).

**F2** [minor] U4 — `docs/el-casino.md`, Open Questions section (lines 61–65) — The overview file lists Q1–Q5 as open, but the BRD marks all five (plus Q6) as `~~resolved~~`. The overview's Open Questions section was not updated after operator Q&A, creating a stale information panel that will mislead SA-stage readers. Suggested fix: strike through resolved questions in el-casino.md or replace with a one-line "All BRD open questions resolved; see BRD §Open Questions."

**F3** [minor] Criterion 1 — `docs/business/stories/us-deposit.md`, Open Questions Q_US2_1 and Q_US2_2 — These questions ask for minimum and maximum deposit amounts and reference "BRD Q4" as pending, but Q4 is resolved in the BRD (min 0.001 ETH, max 0.1 ETH). No AC in US2 validates the minimum deposit amount floor. Suggested fix: close Q_US2_1 and Q_US2_2 as resolved; add an AC: "AC2.X The deposit amount must be at least 0.001 ETH; entering a lower value shows a validation error before triggering MetaMask."

**F4** [minor] Criterion 1 — `docs/business/stories/us-withdraw.md`, Open Question Q_US5_1 — The question asks whether a minimum withdrawal amount is needed and references "BRD Q4" as pending. Q4 is resolved (min 0.001 ETH). The floor for withdrawal is not captured in any AC. Suggested fix: close Q_US5_1 as resolved; add an AC: "AC5.X The withdrawal amount must be at least 0.001 ETH; entering a lower value shows a validation error."

**F5** [minor] Criterion 1 — `docs/business/stories/us-verify-fairness.md`, Open Question Q_US6_1 — The question states "BRD Q1" is unresolved and marks AC6.3/AC6.4 as placeholders. Q1 is resolved (commit-reveal). The open question should be closed and the ACs confirmed as final. Suggested fix: mark Q_US6_1 resolved; confirm AC6.3 and AC6.4 are authoritative for commit-reveal and not placeholders.

**F6** [major] Criterion 1 — `docs/business/stories/us-place-bet.md`, Notes and Open Questions — The commit-reveal two-step flow (commit transaction, wait, reveal transaction, result) is described in notes but has no acceptance criteria covering it. Specifically: (a) there is no AC for the UI state between commit and reveal (pending reveal state); (b) Open Question Q_US3_2 identifies a player-fund-protection scenario (operator liveness failure / timeout for reclaim) but carries it to SA with no business-level AC. A player being unable to reclaim funds after operator liveness failure is a trust and safety concern, not merely an implementation detail. Suggested fix: add ACs covering (a) UI state while awaiting reveal, and (b) a business requirement that the player can reclaim a committed bet after a timeout (specific duration deferred to SA, but the requirement itself must exist at business level).

**F7** [major] Criterion 2 — `docs/business/brd.md`, R17 — R17 states `[could] @gameplay Multiple game types (e.g., dice and coin flip) are available for the player to choose`, but Q3 is resolved as "Coin flip only for MVP." R17 directly contradicts the resolved scope decision. A BA-level clarification note is needed. Suggested fix: annotate R17 as deferred/out-of-scope for MVP per Q3 resolution, e.g., `[could][deferred-post-MVP per Q3]`, so SA and architect do not treat it as in-scope.

**F8** [minor] Criterion 2 — `docs/business/brd.md`, Uncertainty Register — Items U2 and U5 reference "answer Q1" and "answer Q2" respectively as validation plans, but Q1 and Q2 are resolved. The uncertainty register was not updated post-Q&A, leaving stale validation actions. Suggested fix: mark U2 and U5 as resolved or update their validation plans to reflect confirmed decisions.

**F9** [minor] Criterion 2 — `docs/business/stories/us-withdraw.md`, AC5.8 — The error message reads "Please try a smaller amount or contact support." No support channel is defined or in-scope for this testnet MVP. Telling a player to "contact support" in an unsupported MVP creates a dead end. Suggested fix: replace "contact support" with a concrete action, e.g., "Please try a smaller amount. View the transaction on Etherscan for details."

**F10** [minor] Criterion 3 — `docs/business/stories/us-place-bet.md`, AC3.7 — "The outcome is not predictable or manipulable by the operator before the player's bet is committed" is a system property, not an observable UI behavior. It cannot be directly tested through UI acceptance testing. Suggested fix: split into a testable contract-level assertion (carried to SRS) and a UI-level AC, e.g., "The commit transaction is submitted to the chain before any reveal transaction exists" (verifiable by block explorer).

**F11** [minor] Criterion 3 — `docs/business/stories/us-place-bet.md`, AC3.2 — States "greater than the stated minimum bet" without stating the value inline. An AC should be self-contained or explicitly reference the resolved value. Suggested fix: amend to "greater than the minimum bet of 0.001 ETH and less than or equal to 0.1 ETH" (per Q4 resolution).

**F12** [praise] Criterion 3 — `docs/business/stories/us-connect-wallet.md`, `us-deposit.md`, `us-withdraw.md` — Acceptance criteria throughout these three stories are precise, binary, and directly observable: specific error message text is quoted verbatim, balance update timing is bounded (1 block), and edge cases (rejection, revert, wrong network) all have explicit ACs. This is exemplary AC craft for an MVP.

**F13** [praise] Criterion 4 — `docs/business/brd.md`, Stakeholders section — SH3 (On-chain Verifier/Skeptic) is a non-obvious stakeholder that directly maps to the assignment's "paranoid player" requirement. Its inclusion and the dedicated US6 story demonstrate strong product thinking beyond the obvious player/operator pair.

**F14** [praise] Criterion 5 — `docs/business/brd.md`, Business Requirements — Every R traces to at least one G. The US index in the BRD lists traceability for all six stories including activity tag and R references. The taxonomy is clean and covers all activities without overlap. R19 and R20 (added post-Q&A) are correctly incorporated into US3 with corresponding ACs (AC3.13, AC3.14).

---

## Scores

| # | Criterion | Weight | Score | Justification |
|---|---|---|---|---|
| 1 | Completeness | 0.30 | 7.5 | All four goals have supporting Rs. All six US files exist and are indexed. The core deposit/withdraw/gameplay/verification flow is comprehensively covered. Deductions: no AC for minimum deposit floor despite Q4 resolution (F3); no AC for minimum withdrawal floor (F4); no business-level AC for operator liveness failure / player reclaim timeout (F6). |
| 2 | Clarity | 0.25 | 7.5 | Requirements are well-scoped and mostly unambiguous. Banned-word scan finds no occurrences of "fast", "scalable", or "user-friendly" without adjacent metrics. Deductions: R17 directly contradicts the resolved Q3 scope decision creating scope ambiguity for SA (F7); stale open questions in US2, US5, US6 leave resolved decisions unconfirmed at story level (F3–F5); uncertainty register stale (F8). |
| 3 | Testability | 0.20 | 8.0 | Most ACs are binary and observable with quoted error strings, explicit timing bounds, and clear preconditions. AC3.2 missing resolved values (F11). AC3.7 is a system property rather than an observable behavior (F10). All other gameplay, deposit, withdraw, and fairness ACs are testable as written. |
| 4 | Stakeholder coverage | 0.15 | 9.0 | Four stakeholders identified including the non-obvious evaluator (SH4) and skeptic (SH3). Each has a primary concern documented. No obvious missing stakeholders for a testnet MVP (no regulator, no real-money user). |
| 5 | Traceability + taxonomy | 0.10 | 8.5 | Every R traces to at least one G. Every US traces to its Rs in both the BRD index and the story file. All activity tags match taxonomy. Minor deduction: broken block-anchor targets in all US story files (F1) mean traceability links are non-navigable in tooling. |

---

## Weighted Total

score = (7.5 × 0.30) + (7.5 × 0.25) + (8.0 × 0.20) + (9.0 × 0.15) + (8.5 × 0.10)
      = 2.25 + 1.875 + 1.60 + 1.35 + 0.85
      = 7.93

score: **7.9**

---

## Verdict

needs-revision — Score 7.9 clears the 7.0 threshold and no blockers are present, but two major findings (F6: missing business-level AC for player reclaim timeout; F7: R17 contradicts resolved scope) and four minor stale-question findings (F3–F5, F8) must be addressed before handoff to SA to prevent scope ambiguity and incomplete system requirements.
