---
doc: REVIEW
project: el-casino
reviewed_doc: project/plan
reviewed_version: 0.1
reviewer: project-manager-reviewer
date: 2026-05-31
verdict: approved
score: 8.1
suggest_major_bump: false
---

# Project Plan Review — v0.1

## Universal Checks

**U1 — Boundary:** PASS. plan.md written to `/docs/project/plan.md`; risks.md written to `/docs/project/risks.md`. Both within the permitted PM write boundary.

**U2 — Version discipline:** PASS. plan.md `version: 0.1`; risks.md `version: 0.1`. Both at correct initial version.

**U3 — Refs hygiene:** PASS. Both plan.md and risks.md carry:
```
refs:
  - {doc: brd, version: 0.1}
  - {doc: srs, version: 0.1}
  - {doc: arch, version: 0.1}
```
All three upstream documents referenced with correct version pins.

**U4 — Obsidian links:** PASS (not applicable). Neither plan.md nor risks.md contain prose cross-references to other docs that would require wiki-link formatting. The frontmatter refs cover all upstream document citations.

**U5 — Activity tags:** MINOR GAP. Neither plan.md nor risks.md has an `activities:` frontmatter field. The state.yaml lists `activities: [wallet, deposit, gameplay, withdraw, fairness-audit, General]`. PM docs are not required to carry per-task activity tags, but the `activities:` frontmatter population rule was applied to all prior docs (srs, arch). Recommend adding `activities: [wallet, deposit, gameplay, withdraw, fairness-audit, General]` to both frontmatter blocks for pipeline consistency.

**U6 — ID stability:** PASS with nit. Task IDs T1–T42 are sequential with no gaps. Risk IDs RISK1–RISK15 are sequential with no gaps. One nit: in the Summary Totals table, the L row reads "T9, T10, T13, T23, T24, T31, T42, T13" — T13 is listed twice. This is a summary-table typo, not a task-level ID instability; no actual duplicate task ID exists in the WBS.

---

## Findings

**F1 [major] Criterion 1 — WBS / T8 — FR29 and FR30 orphaned: no task implements `withdraw()` in Solidity.**

T8 is scoped to `deposit()`, `getBalance()`, and view functions. T12 covers `houseDeposit()` and `houseWithdraw()` (owner-only). No task anywhere in T7–T17 writes the player-facing `withdraw(uint256 amount)` function specified in the SRS API contract (FR29, FR30) and required by NFR5 (reentrancy guard on withdraw). T22 implements the *frontend* withdrawal form via `useWriteContract`, but the contract function it calls has no corresponding implementation task.

Impact: without the Solidity `withdraw()` function, US5 (Withdraw Balance) cannot be delivered. This is a deliverable gap that will be discovered at T13 when the test suite tries to test it — likely causing T14 iteration burn.

Suggested fix: add a new task T8a (or expand T8) to implement `withdraw(uint256 amount) external nonReentrant` with CEI pattern, balance check, ETH transfer, `Withdrawn` event, and `nonReentrant` modifier per NFR5. Add it to Phase 1 between T8 and T9; make T9 depend on T8a. Token estimate: M / 8,000–10,000 tokens.

---

**F2 [minor] Criterion 4 — Risk register — "trigger" field absent from all 15 risk entries.**

The risk register table header contains: ID, Category, Risk, Probability, Impact, Severity, Mitigation, Contingency, Owner. There is no "Trigger" column. A trigger describes the observable event that should cause the risk to be escalated from monitoring to active response (e.g., for RISK2: "trigger: bot process exits non-zero, or any BetCommitted event has no corresponding BetRevealed within 200 blocks"). Without triggers, risk owners have no defined threshold for activating contingency plans.

Suggested fix: add a "Trigger" column to the risk register table. One sentence per risk is sufficient (e.g., RISK6 trigger: "Alchemy endpoint returns 5xx or connection timeout on 3 consecutive requests").

---

**F3 [minor] Criterion 3 — Dependency graph — T28 not listed as a prerequisite of T35.**

T35 (US1–US6 smoke test) has `Depends-on: T34, T29`. T28 implements "error and loading states for all async operations" — it is the task that ensures FR36 and FR37 acceptance criteria are met. The smoke test explicitly checks all AC criteria for US1–US6, which includes error-state ACs (AC1.4, AC1.8, AC2.6, AC2.7, AC3.11, AC3.12, AC5.7, AC5.8). If T28 is still in progress when T35 begins, the smoke test will log failures against error-state criteria that haven't been implemented yet.

Suggested fix: add T28 to T35's `Depends-on` list: `Depends-on: T28, T34, T29`.

---

**F4 [minor] Criterion 3 — Critical path narrative omits T31 and T33.**

The stated critical path is `T7 → T9 → T10 → T13 → T14 → T15 → T16 → T24 → T25 → T34 → T39`. T34 (E2E test on Sepolia) has `Depends-on: T31, T33, T25, T27`. T31 (reveal bot script) and T33 (bot alerting) are therefore on the critical path — a delay in the reveal bot delays T34 which delays T39. The critical path section correctly identifies T34 as a gate but omits the bot tasks that feed it.

Suggested fix: extend the critical path to read: `T7 → T9 → T10 → T13 → T14 → T15 → T16 → T31 → T34 → T39` (parallel with T24 → T25 → T34). Note T31 depends on T10 and T32, which depends on T16, so T16 is already the merge point.

---

**F5 [nit] Criterion 2 — Summary Totals table has two transcription errors.**

(a) The S-size row says "S | 10 (T3, T12, T15, T16, T20, T29, T30, T33, T37, T38, T39)" — the count says 10 but lists 11 tasks. The correction note below the table gives the right count (S=11) but the table body is wrong.

(b) The L-size row lists T13 twice: "L | 8 (T9, T10, T13, T23, T24, T31, T42, T13)". T13 should not appear twice; the 8th entry should be T19 or another L-sized task (T19 is actually M; checking: L tasks are T9, T10, T13, T23, T24, T31, T42 — that is only 7. Either T8 at 10k tokens could be considered borderline, or this is simply a count error). The note says L=8 but the list only has 7 unique tasks after deduplication.

Suggested fix: reconcile the summary table — list exactly the unique T-IDs per size bucket; ensure count matches list length.

---

**F6 [nit] Criterion 1 — U5 activity tags absent from plan.md and risks.md frontmatter.**

(Duplicated from U5 check above for completeness in the findings list.) Both PM output files lack `activities:` frontmatter. While not a functional gap in plan execution, it breaks pipeline consistency with SRS and ARCH docs.

Suggested fix: add `activities: [wallet, deposit, gameplay, withdraw, fairness-audit, General]` to the frontmatter of both plan.md and risks.md.

---

**F7 [praise] Criterion 4 — Risk register: highly specific, project-calibrated entries.**

All 15 risks are specific to this project's technology stack and constraints. RISK2 correctly identifies the sequence hazard (secret must persist to DB *before* the reveal tx is broadcast). RISK5 identifies the exact EVM edge case (blockhash returns bytes32(0) after 256 blocks) and cites the Q8 architecture resolution. RISK14 uses a contract-level chain ID assertion (`require(block.chainid == 11155111)`) as a technical control — this is the right defense-in-depth approach. Risk ownership is never "team" — every entry names Operator, Claude, or Operator+Claude as owner.

---

**F8 [praise] Criterion 3 — Critical path is plausible and risk-annotated.**

The critical path section does more than list the chain — it identifies the highest-risk tasks within it (T9 commitBet liquidity math, T13 test breadth, T24 browser secret management) and explains *why* each is risky. This gives the operator actionable focus points rather than a bare topological sort.

---

**F9 [praise] Criterion 2 — Q-PLAN-2 and Q-PLAN-3 cleanly resolved in plan.**

T32 correctly documents the PostgreSQL decision (Q-PLAN-2) inline in its description with the resolution date. The `Depends-on: T3, T16` for T32 correctly reflects the Q-PLAN-3 patch — the task no longer has a circular or impossible dependency. Both resolutions are traceable.

---

## Scores

| # | Criterion | Weight | Score | Justification |
|---|---|---|---|---|
| 1 | Scope completeness (WBS) | 0.25 | 7.5 | 36 of 38 FRs covered by at least one task; all non-feature tasks present (CI, test, deploy, ops, README, smoke test, mobile QA). One major gap: no task writes the player `withdraw()` Solidity function (F1; FR29, FR30 orphaned). All architecture components (CasinoV1.sol functions, Next.js, reveal bot, Railway, Etherscan, README) have tasks. |
| 2 | Estimate realism (tokens + T-shirt) | 0.20 | 8.5 | All 42 tasks carry both `size` and `tokens` fields; operator-only tasks correctly carry 0 tokens. T-shirt sizes are consistent with task complexity descriptions. Total 376k tokens is plausible for 35 code-generating tasks in a 48-hour LLM-assisted build. Summary table has minor transcription errors (F5) but individual task specs are clean. |
| 3 | Dependency correctness | 0.20 | 8.0 | No dependency cycles. Q-PLAN-3 patch correctly applied (T32 → T3+T16). Critical path identified and plausible. Two minor gaps: T28 missing as prereq of T35 (F3); T31/T33 omitted from critical path narrative despite being on the critical path via T34 (F4). No hidden external dependencies. |
| 4 | Risk coverage | 0.20 | 8.0 | All required specific risks present: RISK2 (bot crash/secret loss), RISK6 (Sepolia RPC downtime), RISK8 (commit-reveal evaluator), RISK11 (single operator). All 6 expected categories covered (technical, scope, external, team, compliance — schedule risks embedded in RISK11/RISK9). All fields populated except "trigger" column (F2, systemic across all 15 entries). |
| 5 | RACI clarity | 0.15 | 9.0 | One Accountable per row (Operator throughout — correct for single-person team). R present on every row. No "team" or "everyone" as owner. RACI rules explicitly stated below matrix. Minor density in Phase 0 row blending multiple sub-task responsibilities, but unambiguous. |

## Weighted Total

```
score = (7.5 × 0.25) + (8.5 × 0.20) + (8.0 × 0.20) + (8.0 × 0.20) + (9.0 × 0.15)
      = 1.875 + 1.700 + 1.600 + 1.600 + 1.350
      = 8.125
      ≈ 8.1
```

## Verdict

**approved** — Score 8.1, no blockers.

The plan is well-structured, covers the vast majority of scope, and demonstrates strong risk hygiene. The single major finding (F1: no Solidity `withdraw()` implementation task) is a genuine gap that will surface during T13 testing and should be patched before build begins — it requires adding approximately one M-sized task (~8k tokens) between T8 and T9 and adjusting downstream dependencies. The two minor dependency findings (F3, F4) are editorial fixes to the plan document that do not affect build execution. The missing trigger column (F2) is a risk-register polish issue.

**Top 3 findings:**
1. F1 [major] — FR29/FR30 orphaned: no task implements `withdraw()` in Solidity. Add T8a before T9.
2. F2 [minor] — Risk trigger field absent from all 15 risk entries. Add Trigger column to risk table.
3. F3 [minor] — T28 not listed as dependency of T35. Add T28 to T35 Depends-on.

**Workflow completion status:** Stage advances to `done`. `versions.plan: 0.1` confirmed. Operator may proceed to build phase.
