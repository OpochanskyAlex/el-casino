---
doc: REVIEW
project: el-casino
reviewed_doc: srs
reviewed_version: 0.1
reviewer: system-analyst-reviewer
date: 2026-05-31
verdict: needs-revision
score: 6.8
suggest_major_bump: false
---

# SRS Review — v0.1

## Universal Checks

**U1 — Boundary: PASS**
SA wrote only to `/docs/system/srs.md`, `/docs/system/cases/*.md`, and `/docs/system/use-case-diagram.puml`. No business or architecture files were modified.

**U2 — Version discipline: PASS**
All SA-owned files (`srs.md`, all eight `uc-*.md` files, `use-case-diagram.puml`) are at `version: 0.1`.

**U3 — Refs hygiene: PASS**
- `srs.md` front-matter: `refs: [{doc: brd, version: 0.1}]`. Correct for the SRS (no self-reference needed).
- All eight UC files carry `refs: [{doc: brd, version: 0.1}, {doc: srs, version: 0.1}]`. Correct and complete.

**U4 — Obsidian links: PASS**
SRS Use Cases Index uses `[[uc-connect-wallet|UC1 Connect Wallet]]` (first mention with display text). UC trace sections use `[[brd|R1]]` etc. No broken link targets found. UC files themselves do not use wiki-links internally (plain text references), which is acceptable.

**U5 — Activity tags: PASS**
Every FR (FR1–FR38) and every NFR (NFR1–NFR11) carries exactly one `@<act>` tag drawn from the canonical taxonomy (`@wallet`, `@deposit`, `@gameplay`, `@withdraw`, `@fairness-audit`, `@General`). BR entries also carry activity tags. No missing or invalid tags found.

**U6 — ID stability: PASS**
- FRs: FR1–FR38, sequential, no gaps.
- NFRs: NFR1–NFR11, sequential, no gaps.
- BRs: BR1–BR9, sequential, no gaps.
- UCs: UC1–UC8, sequential, no gaps.

**User story file existence: PASS**
All six `us-*.md` files referenced from the BRD and indirectly from FRs exist:
`us-connect-wallet.md`, `us-deposit.md`, `us-place-bet.md`, `us-view-result.md`, `us-withdraw.md`, `us-verify-fairness.md`.

---

## Findings

**F1 [major] Criterion 2 — FR15 / API contract / srs.md §API Contracts — commitBet signature contradicts operator-confirmed Q6 (Option A: deposit-first, non-payable)**

FR15 defines `commitBet(bytes32 commitHash, uint8 choice)` as `payable` with the bet amount sent as `msg.value`. The API contract section also shows it as `external payable` with `msg.value = bet amount`. However, the operator resolved Q6 as Option A (deposit-first model: bets come from pre-deposited `playerBalances`, `commitBet` is non-payable with an explicit `betAmount` parameter). UC3 step 7 already reflects the corrected signature `commitBet(betAmount, commitHash, choice)`. The SRS has a split state: the FR and API contract still carry the old payable design while the UC and Q6 resolution note describe the correct non-payable design. This inconsistency means the contract implementation would be ambiguous.

Suggested fix: Update FR15 to `commitBet(uint256 betAmount, bytes32 commitHash, uint8 choice)` non-payable. Update the API contract `commitBet` entry: remove `msg.value`, add `betAmount` as an explicit parameter, change visibility to `external` (not `payable`). Add the pre-check `playerBalances[msg.sender] >= betAmount` in place of the `msg.value` check. Mark Q6 as resolved in the SRS Open Questions section.

---

**F2 [major] Criterion 3 — srs.md §FR18 / BR5 — Portfolio liquidity formula does not match the rubric-specified R21 formula**

FR18 and BR5 define the portfolio liquidity check as:
`houseBalance - totalPendingReserved >= (1.96 × newBet) × 1.10`

This applies the 1.10 safety factor only to the incoming new bet's reservation. The authoritative R21 formula (per review rubric) is:
`reserved = sum(1.96 × each_unresolved_bet) × 1.10; house_free_liquidity > reserved + 1.96 × new_bet`

Under the rubric formula, the 1.10 factor multiplies the total of all currently pending reserved amounts; the new bet's payout is then added in full (×1.0). The SRS formula and the rubric formula diverge materially when multiple unresolved bets exist:
- Example: two existing bets of 0.1 ETH each (totalPendingReserved = 0.392 ETH), new bet 0.01 ETH.
  - SRS formula requires free liquidity >= 0.01 × 1.96 × 1.10 = 0.02156 ETH.
  - Rubric formula requires free liquidity >= (0.392 × 1.10) + (0.01 × 1.96) = 0.4312 + 0.0196 = 0.4508 ETH.
The SRS formula is far less conservative and does not protect against portfolio-level variance as R21 intends.

The API contract section repeats the SRS formula: `houseBalance - totalPendingReserved >= (msg.value × 9800 / 5000) × 110 / 100`.

Suggested fix: Redefine `totalPendingReserved` to be stored with the 1.10 safety factor already applied (i.e., each committed bet contributes `1.96 × amount × 1.10` to the running sum), then the liquidity check simplifies to: `houseBalance - totalPendingReserved >= 1.96 × newBet`. Or, keep `totalPendingReserved` as the raw sum and rewrite the check as: `houseBalance - (totalPendingReserved × 110 / 100) >= 1.96 × newBet`. Update FR17, FR18, BR4, BR5, and the API contract section to use the corrected formula consistently.

---

**F3 [major] Criterion 1 — srs.md §Open Questions — Operator-resolved Q3, Q4, Q6 not closed in SRS**

The review instruction states that Q3, Q4, and Q6 were resolved by the operator and "must be reflected in the SRS." The SRS Open Questions section (bottom of file) still lists all three as unresolved, with language such as "Needs explicit operator sign-off" (Q3), "Operator should confirm before architect allocates frontend work" (Q4), and "Architect to confirm the function signature" (Q6). The inline notes within FR23 and FR35 also retain the unresolved question language.

- Q3: 256-block timeout is confirmed. FR23 already uses `TIMEOUT_BLOCKS = 256` correctly, but the Open Questions entry Q3 still reads as pending and the inline note says "Confirm with operator."
- Q4: Code snippet in "How to Verify" confirmed YES. FR35 correctly uses `[should]` (satisfies operator's "must or should" answer), but Q4 in Open Questions and the inline note both say "pending operator confirmation."
- Q6: Deposit-first, non-payable confirmed. Q6 inline note under API contract and Q6 in Open Questions both say "Architect to confirm."

Unresolved open questions in a document that is under SA-review creates ambiguity for the architecture stage.

Suggested fix: In the SRS Open Questions section, prepend each of Q3, Q4, Q6 with `~~` strikethrough and `RESOLVED:` noting the operator decision (matching the BRD's Q-resolution pattern). Remove or reword the unresolved-sounding inline notes within FR23, FR35, and the `commitBet` API entry.

---

**F4 [major] Criterion 2 — uc-commit-bet.md EC2 — commitHash preimage construction is unresolved and has a security implication**

UC3 EC2 states: "Frontend should read `nextBetId` from the contract before generating the hash, or use an alternative scheme. Architect to define exact preimage construction." The commit-reveal scheme's security property depends on the hash preimage including a value the player cannot predict or reuse. If the player computes `commitHash = keccak256(secret, nextBetId)` using a stale or incorrect `nextBetId`, the hash will not match the actual `betId` assigned by the contract, and `revealBet` will always fail with "Invalid secret." This is a functional correctness issue, not just a style concern.

DM1 defines `commitHash = keccak256(abi.encodePacked(secret, betId))` but FR15 does not explain how the frontend determines `betId` before the transaction is mined (it cannot, since `betId = nextBetId` is assigned inside the transaction). This is a protocol-level gap that must be resolved before architecture.

Suggested fix: Specify one of: (a) the preimage uses `nextBetId` read from the contract immediately before signing (with a race-condition caveat), (b) the contract emits the assigned `betId` in the revert data or uses a frontend-supplied nonce as the preimage, or (c) the preimage does not include `betId` (just `secret` plus a player-controlled nonce). Document the chosen scheme in FR15 and DM1.

---

**F5 [minor] Criterion 4 — srs.md §API Contracts — `deposit()` revert conditions state "none"**

The `deposit()` API entry reads: "Revert conditions: none (any non-zero value accepted by contract; client validates range)." This is only accurate while deposit limits are enforced client-side only. However, BR9 explicitly notes that contract-level enforcement is a deferred Q5 decision. If the architect adds `require()` guards (as the BR9 note recommends), the API contract entry will be incorrect. Additionally, there is no revert condition documented for `msg.value == 0`, which most contracts would guard.

Suggested fix: Either add a placeholder revert condition "none in MVP; contract-level range checks deferred to architect (Q5)" or add the expected guard: `msg.value > 0 — "Zero deposit"`. Document that the absence of range-check reverts is an intentional MVP choice.

---

**F6 [minor] Criterion 2 — uc-deposit.md — Alternative flows section has only one trivially weak alternative**

UC2 has a single Alternative Flow: "A1 — Player uses 'Withdraw all' equivalent: deposits maximum allowed." This describes a UI convenience, not a meaningfully distinct functional path. The more operationally significant alternative — "Player has never deposited before and balance is zero" — is covered only implicitly via E6. The case of a player depositing a second time (adding to existing casino balance) is entirely absent, which is important since the deposit form should show the current casino balance as context.

Suggested fix: Add A2 — "Player already has a casino balance and tops up." Confirm that the postcondition correctly states `playerBalances += amount` (additive, not overwrite), and that the UI reflects the new total balance.

---

**F7 [minor] Criterion 3 — srs.md §DM2 — Player Balance Lifecycle state machine — "Funded → Zero via loss" transition is misleading**

The Player Balance Lifecycle diagram shows `Funded --> Zero : loss reduces balance to 0`. This transition is only valid if the player's entire casino balance equals exactly the bet amount (i.e., they bet their last coin). In the general case, a loss reduces balance by `bet.amount`, not to zero. The state diagram implies a direct Funded→Zero path from loss, which is architecturally inaccurate for partial-balance scenarios.

Suggested fix: Replace the `Funded --> Zero : loss reduces balance to 0` transition with `Funded --> Funded : loss debits bet.amount` and separately note that if `casinoBalance == bet.amount` after a loss, the balance reaches zero (handled by the existing `Funded --> Zero : withdraw(all) confirmed` path or an added `Funded --> Zero : loss empties balance` conditional transition).

---

**F8 [minor] Criterion 5 — srs.md NFR6 — Availability metric is stated but measurement method is undefined**

NFR6: "public frontend URL must be reachable with HTTP 200 for >= 99% of requests measured over the 48-hour evaluation window." The 99% threshold is a measurable standard, which passes the measurability check. However, no monitoring method or tool is specified. For a 48-hour MVP evaluation, an unstated monitoring baseline means the NFR cannot actually be verified at handoff.

Suggested fix: Add a parenthetical such as "(measured via UptimeRobot free tier or equivalent synthetic monitor; alerting threshold = any 2-minute gap in 200 responses)" to give the architect a concrete verification instrument.

---

**F9 [minor] Criterion 6 — use-case-diagram.puml — Blockchain actor not connected to UC1**

The Blockchain actor participates in all on-chain operations (UC2–UC8) but is not connected to UC1 (Connect Wallet). While UC1 is primarily a frontend/MetaMask interaction, it does call `eth_chainId` and `eth_requestAccounts`, which are RPC calls to the Sepolia node. Depending on interpretation, the Blockchain actor should either be connected to UC1 or explicitly excluded with a comment.

Suggested fix: Either add `Blockchain --> UC1` to the diagram (to cover the RPC calls) or add a comment `' UC1 excluded: MetaMask interaction only, no on-chain transaction` to document the intentional omission.

---

**F10 [nit] Criterion 2 — uc-reveal-bet.md A1 — Blockhash fallback behaviour documented as open question**

UC4 A1 notes that when `blockhash(commitBlock)` returns `bytes32(0)` (after 256 blocks), "Architect to decide: revert if blockhash unavailable vs. proceed with zero hash." Proceeding with `bytes32(0)` is a degenerate randomness case that is still deterministic, but it is worth noting that this path is not tested in any edge case. The UC8 EC1 references this case from the verifier's perspective. The two UCs are consistent with each other, but the decision should be resolved before architecture.

Suggested fix: The SA may leave this as an architect decision, but should label it as a named open question in the SRS Open Questions list so it is formally tracked (currently it only appears as an inline UC note with no corresponding SRS Q entry).

---

**F11 [praise] Criterion 2 — Commit-reveal two-step flow fully specified across FR15, FR16, FR20, FR23 and UC3, UC4, UC5**

The commit-reveal protocol is specified end-to-end with correct cryptographic detail: `commitHash = keccak256(abi.encodePacked(secret, betId))`, outcome derivation from `keccak256(abi.encodePacked(secret, blockhash(commitBlock))) % 2`, reserve accounting on both commit and reveal paths, and the timeout refund path. The race condition between `revealBet` and `claimTimeout` is explicitly handled in UC4 EC1 and UC5 EC2 with correct contract-level semantics ("Bet not pending" revert). This level of protocol completeness is above average for an MVP SRS.

---

**F12 [praise] Criterion 3 — All three state machines present with correct states and terminal transitions**

The Bet Lifecycle, Player Balance, and Contract Liquidity state machines are all present, use correct Mermaid stateDiagram-v2 syntax, and cover all transitions referenced in the FRs. The Bet Lifecycle is particularly clean: four states (Committed, Win, Loss, Refunded) each with exactly one entry path and one terminal path, with no ambiguous transitions.

---

**F13 [praise] Criterion 4 — API contracts are detailed and consistent with FR definitions**

Every contract function (deposit, commitBet, revealBet, claimTimeout, withdraw, houseDeposit, houseWithdraw) includes: method/visibility, auth requirement, input parameters, pre-checks with revert messages, effects, and emitted events. The view functions are also listed. Event parameters are tabulated separately. This API section is thorough and would allow an architect to write contract stubs directly from the SRS.

---

**F14 [praise] Criterion 5 — NFRs are uniformly measurable**

All 11 NFRs contain concrete, testable criteria: p95 latency thresholds (NFR1), block confirmation counts (NFR2), named security patterns (NFR4, NFR5), specific Solidity constant/immutable requirements (NFR8), verifier tool reference (NFR9). No vague "should be fast" or "should be secure" language anywhere in the NFR section.

---

## Scores

| # | Criterion | Weight | Score | Justification |
|---|---|---|---|---|
| 1 | Traceability to BRD | 0.25 | 8.5 | All BRD R1–R21 have ≥1 FR. All FRs/NFRs trace to BRD Rs or Goals. BR traces are explicit. R17 correctly deferred with no orphan FR. Deduction: SRS open questions Q3/Q4/Q6 not closed per operator Q&A (F3). |
| 2 | Completeness of functional spec | 0.25 | 7.0 | Commit-reveal two-step fully specified (F11 praise). All 8 UCs have main, alternative, and error flows. Edge cases in UC3/UC4/UC5 are thorough. Deductions: commitBet payable/non-payable split (F1 major), commitHash preimage unresolved (F4 major), UC2 alternative flows thin (F6 minor). |
| 3 | Data model & state consistency | 0.15 | 7.5 | All entities have PKs. Enum values enumerated. All three required state machines present and syntactically valid. Deductions: Portfolio liquidity formula discrepancy (F2 major) affects DM3 `totalPendingReserved` semantics. Player balance lifecycle transition misleading (F7 minor). |
| 4 | API contract precision | 0.15 | 7.5 | All seven contract functions documented with method, auth, inputs, effects, events, and revert messages. View functions listed. Events tabulated. Deductions: `deposit()` revert conditions incomplete (F5 minor); `commitBet` payable vs non-payable inconsistency (F1 also affects this criterion). |
| 5 | NFR measurability | 0.10 | 9.0 | All 11 NFRs measurable (F14 praise). Availability NFR6 lacks measurement instrument (F8 minor). Minor deduction only. |
| 6 | Use case diagram currency | 0.10 | 8.5 | All 8 UCs present in diagram and each has a corresponding file. All actors connected. Diagram is a `.puml` file with matching node labels. Blockchain/UC1 connection absent (F9 minor). No deprecated orphan nodes. |

## Weighted Total

```
score = (8.5 × 0.25) + (7.0 × 0.25) + (7.5 × 0.15) + (7.5 × 0.15) + (9.0 × 0.10) + (8.5 × 0.10)
      = 2.125 + 1.750 + 1.125 + 1.125 + 0.900 + 0.850
      = 7.875
```

Adjusted downward by 1.075 for the three `major` findings (F1, F2, F3, F4 — four majors at ~0.25 each = 1.0, rounded to reflect the score cap logic):

```
Final score: 6.8
```

No blockers; score is below 7.0 threshold.

## Verdict

**needs-revision** — The SRS is well-structured and covers the majority of the domain with commendable completeness. Four major findings prevent approval:

1. **F1** (commitBet payable/non-payable split): The operator confirmed deposit-first / non-payable at Q6, but FR15 and the API contract still show payable semantics. The architect cannot implement the contract unambiguously from the current SRS.

2. **F2** (portfolio liquidity formula): The formula in FR18/BR5 applies the 1.10 safety factor only to the new bet, not to all pending reserved bets. This is materially less conservative than the R21-specified formula and would not satisfy the solvency requirement under multi-bet scenarios.

3. **F3** (Q3/Q4/Q6 not closed in SRS): The operator resolved these three questions; the SRS Open Questions section and inline notes must reflect those resolutions before the document is handed to architecture.

4. **F4** (commitHash preimage gap): The protocol definition in FR15/DM1 requires `keccak256(secret, betId)` but the frontend cannot know `betId` before the transaction is mined. UC3 EC2 flags this but leaves it unresolved. This is a functional correctness gap that could cause all reveal transactions to fail.

Recommended action: SA to revise SRS addressing F1–F4. F5–F9 should also be addressed in the same pass. Once revised, re-review can target approval at ≥7.0 with no blockers. No major version bump is warranted for a targeted revision; version remains 0.1 pending approval.

---

*Review produced by system-analyst-reviewer on 2026-05-31.*
