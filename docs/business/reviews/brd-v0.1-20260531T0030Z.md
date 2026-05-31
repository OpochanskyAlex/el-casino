---
doc: REVIEW
project: el-casino
reviewed_doc: brd
reviewed_version: 0.1
reviewer: business-analyst-reviewer
date: 2026-05-31
previous_review: brd-v0.1-20260531T0020Z.md
verdict: approved
score: 8.8
suggest_major_bump: false
---

# BRD Re-Review — v0.1 (Revision 1)

## Universal Checks

- U1 Boundary — PASS. BA wrote only within `/docs/business/` and `/docs/el-casino.md`. No boundary violations detected.
- U2 Version discipline — PASS. All documents retain `version: 0.1`; no mid-revision bump. Revision 1 is a content-only correction on the same version, which is correct.
- U3 refs hygiene — PASS. BRD carries `refs: []` (correct for top-level doc). All six US files carry `refs: [{doc: brd, version: 0.1}]`. No stale or missing refs.
- U4 Obsidian links — PASS (with nit). All six US story files now use plain wiki-links with display text (`[[brd|R1]]`, `[[brd|G1]]`, etc.). No broken block-anchor targets remain. F1 is resolved. Minor formatting nit: `us-connect-wallet.md` frontmatter line 13 has `updated: 2026-05-31tags: [project-docs, user-story]` — the `tags` key is concatenated onto the `updated` value, forming an invalid YAML line. This would cause frontmatter parsers to misread the tags field. See F15.
- U5 Activity tags — PASS. Every R in the BRD carries one `@` tag. All six US files carry activity tags in frontmatter and body. All tags (`@wallet`, `@deposit`, `@gameplay`, `@withdraw`, `@fairness-audit`, `@General`) match the taxonomy in `el-casino.md`. New R21 carries `@gameplay`, which is in taxonomy.
- U6 ID stability — PASS. R1–R21 are sequential with no gaps or renumbering. New R21 is an addition, not a renumbering. Goals G1–G4, stakeholders SH1–SH4, constraints C1–C7, stories US1–US6, and ACs within each story are stable. No removals without marking.

---

## Previous Findings Resolution

F1 [fixed] — All six US files now use plain wiki-links (`[[brd|R1]]`) instead of broken block-anchor targets (`[[brd#^R1|R1]]`). Links are navigable.

F2 [fixed] — `el-casino.md` Open Questions section replaced with a single resolved notice: "All BRD open questions (Q1–Q6) resolved in operator Q&A on 2026-05-31. See BRD §Open Questions." No longer stale.

F3 [fixed] — `us-deposit.md` Q_US2_1 and Q_US2_2 closed as resolved; AC2.11 added covering both minimum (0.001 ETH) and maximum (0.1 ETH) deposit bounds with UI validation.

F4 [fixed] — `us-withdraw.md` Q_US5_1 closed as resolved; AC5.10 added specifying minimum withdrawal of 0.001 ETH with UI validation before MetaMask prompt.

F5 [fixed] — `us-verify-fairness.md` Q_US6_1 closed; AC6.3 and AC6.4 confirmed as authoritative final criteria for the commit-reveal verification flow, not placeholders.

F6 [fixed] — `us-place-bet.md` now includes AC3.16 (pending-reveal UI state: "Waiting for result..." with committed amount and "Check result" button) and AC3.17 (player reclaim on operator liveness failure via "Claim timeout refund" action). Q_US3_2 closed as resolved at business level. Both business-level gaps are covered.

F7 [fixed] — BRD R17 now annotated `[could][deferred-post-MVP per Q3]` with body text "coin flip is the only game in this release." The contradiction with resolved Q3 scope is eliminated.

F8 [fixed] — Uncertainty register U2 now reads "Resolved: commit-reveal chosen per Q1." U5 now reads "Resolved: 2% house edge confirmed per Q2." Stale validation actions removed.

F9 [fixed] — AC5.8 now reads "Withdrawal failed. Please try a smaller amount. View the transaction on Etherscan for details." with an Etherscan link. Dead-end "contact support" language removed.

F10 [fixed] — AC3.7 rewritten as: "The commit transaction is submitted to the blockchain before any reveal transaction for the same bet exists; this ordering is verifiable via Etherscan block timestamps and transaction nonces." Now a directly observable, testable behavior.

F11 [fixed] — AC3.2 now reads "greater than the minimum bet of 0.001 ETH, does not exceed the maximum bet of 0.1 ETH, and does not exceed the player's current casino balance." Self-contained with resolved values inline.

F12 [praise] — Remains valid. AC craft in US1, US2, and US5 continues to be exemplary.

F13 [praise] — Remains valid. SH3 On-chain Verifier/Skeptic inclusion demonstrates strong product thinking.

F14 [praise] — Remains valid. Full traceability G→R→US maintained, taxonomy clean, R19–R21 correctly incorporated.

---

## New Findings

**F15** [minor] U4 / formatting — `docs/business/stories/us-connect-wallet.md`, frontmatter line 13 — The `updated` and `tags` fields are concatenated on a single line: `updated: 2026-05-31tags: [project-docs, user-story]`. This is an invalid YAML structure; a conformant YAML parser will treat `2026-05-31tags: [project-docs, user-story]` as the value of `updated` and omit the `tags` key entirely. Suggested fix: insert a newline so `tags: [project-docs, user-story]` appears on its own line.

**F16** [nit] Criterion 3 — `docs/business/stories/us-place-bet.md`, AC3.17 — The criterion includes `[must]` as an inline tag (`- AC3.17 [must] If the operator...`). Acceptance criteria in all other stories use no inline priority tags; the tag is redundant here and inconsistent with AC formatting convention throughout the document set. Suggested fix: remove `[must]` from the AC bullet; priority is already expressed by R-level MoSCoW labels in the BRD.

**F17** [nit] Criterion 2 — `docs/business/stories/us-place-bet.md`, AC3.15 — "a 10% safety factor" is used without defining what the factor means computationally (e.g., multiply max payout by 1.10, or reserve 10% of house liquidity as buffer). The BRD R21 also uses "safety factor 10%" without elaboration. At business level this is acceptable as a named constraint to be specified in SRS; however, marking it explicitly for SA to resolve would prevent ambiguity. Suggested fix (carry to SA): in SRS, define as "total reserved payout = sum(1.96 × each_unresolved_bet) × 1.10; house liquidity must exceed this value."

**F18** [nit] Criterion 1 — `docs/business/stories/us-verify-fairness.md`, Q_US6_2 — This open question (should the "How to Verify" section include a code snippet?) is appropriately deferred to the operator for confirmation. However, it is not tagged with a `[should]` priority hint or a recommended default. For SA handoff clarity, a recommended default ("yes, include a Python/JavaScript snippet") would help the SA not block on this. This is a nit; the story is fully reviewable without it.

---

## Scores

| # | Criterion | Weight | Score | Justification |
|---|---|---|---|---|
| 1 | Completeness | 0.30 | 9.0 | All four goals have supporting Rs. All six US files exist and are indexed. All previous gaps filled: min deposit floor (AC2.11), min withdrawal floor (AC5.10), pending-reveal UI state (AC3.16), operator liveness failure / player reclaim (AC3.17). New R21 (portfolio liquidity check) added with corresponding AC3.15 and indexed in BRD US3 line. No obvious missing requirements for a testnet MVP coin-flip casino. |
| 2 | Clarity | 0.25 | 8.5 | R17 contradiction resolved; stale open questions in US2/US5/US6 all closed; uncertainty register cleaned. All major scope ambiguities eliminated. Minor residual: "10% safety factor" in R21/AC3.15 needs arithmetic definition at SRS stage (F17, nit). No banned words ("fast", "scalable", "user-friendly") found without adjacent metrics. |
| 3 | Testability | 0.20 | 8.5 | AC3.2 now includes resolved bet limits inline. AC3.7 is now an observable on-chain ordering check. AC3.16 and AC3.17 describe concrete UI states and user actions. AC3.17's timeout duration is deferred to SA, which is appropriate; the business-level observable behavior (refund action available after timeout) is stated. All other ACs across all six stories remain precise, binary, and observable with quoted strings and timing bounds. |
| 4 | Stakeholder coverage | 0.15 | 9.0 | No change from previous review. Four stakeholders with documented concerns. SH3 and SH4 non-obvious inclusions remain a strength. No missing stakeholders for a testnet MVP scope. |
| 5 | Traceability + taxonomy | 0.10 | 9.0 | All wiki-links are now navigable plain links. Every R traces to at least one G. Every US traces to its Rs in both the BRD index and the story header. R21 correctly indexed in US3 BRD index line. All activity tags match taxonomy. US index entry count (6) matches story file count (6). |

---

## Weighted Total

score = (9.0 × 0.30) + (8.5 × 0.25) + (8.5 × 0.20) + (9.0 × 0.15) + (9.0 × 0.10)
      = 2.700 + 2.125 + 1.700 + 1.350 + 0.900
      = 8.775

score: **8.8**

---

## Verdict

approved — Score 8.8 clears the 7.0 threshold. No blockers present. All two major findings from the previous review (F6, F7) are fully resolved. All minor findings (F1–F5, F8–F11) are fully resolved. Three new findings are nit/minor in severity (F15 frontmatter YAML malformation; F16 inline priority tag inconsistency; F17 safety-factor arithmetic definition; F18 open question default). None of these block SA handoff. The document set is ready for the systems-analyst stage.

Note for SA stage: F17 (safety factor arithmetic) should be the first item resolved in the SRS. Q_US3_1 (commit-reveal polling vs manual reveal UX) and Q_US6_2 (verification code snippet) remain open and should be addressed in SRS or architecture.
