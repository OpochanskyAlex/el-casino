---
doc: REVIEW
project: el-casino
reviewed_doc: architecture/overview
reviewed_version: 0.1
reviewer: architect-reviewer
date: 2026-05-31
verdict: approved
score: 8.3
suggest_major_bump: false
---

# Architecture Review — v0.1

---

## Universal Checks

**U1 — Boundary:** PASS. All architecture files written to `/docs/architecture/` and `/docs/_meta/`. No system or business files modified by the architect.

**U2 — Version discipline:** PASS. `overview.md`, all five ADRs carry `version: 0.1`. Consistent.

**U3 — Refs hygiene:** PASS. `overview.md` frontmatter carries `refs: [{doc: brd, version: 0.1}, {doc: srs, version: 0.1}]`. All ADRs carry `refs: [{doc: srs, version: 0.1}]`. Correct versions cited.

**U4 — Obsidian links:** PASS. Architecture docs do not use Obsidian wiki-link syntax internally; cross-references to ADRs use standard Markdown relative links, which is appropriate for architecture-layer documents. No violations.

**U5 — Activity tags:** PASS. `overview.md` frontmatter `activities: [wallet, deposit, gameplay, withdraw, fairness-audit, General]` is fully populated. ADR frontmatter does not carry `activities:` (not required for ADRs).

**U6 — ID stability:** PASS. ADR-001 through ADR-005 are sequential with no gaps, no renumbering.

---

## Findings

**F1 [major] Criterion 6 — overview.md § Deployment Architecture / Reveal Bot — ARCH-Q1 contradiction: confirmed decision not reflected**

The deployment architecture section reads: "Persists secret-to-betId mapping in memory (acceptable for MVP; loses state on restart, but operator can re-derive secrets from committed hash if secret generation is deterministic)."

The resolved operator Q&A for ARCH-Q1 explicitly states: "Deterministic derivation rejected. Operator accepts restart-risk mitigation via DB." The architecture therefore documents the _rejected_ mitigation (deterministic re-derivation) as the operative approach. If the operator implements from this document, they will build the wrong thing. The correct mechanism — database persistence (PostgreSQL or Redis) — must replace the in-memory description.

_Suggested fix:_ Update the Reveal Bot Deployment paragraph to state that secrets are persisted to a PostgreSQL or Redis store keyed by betId, that the bot reconnects to this store on restart, and that deterministic re-derivation was evaluated and rejected. Close ARCH-Q1 in the Open Questions table.

---

**F2 [major] Criterion 1 / Criterion 2 — overview.md § Open Questions — Q7 not closed; confirmed resolution not reflected**

The Open Questions table in the overview still lists Q7 as "Blocker? Yes — confirm before contract deploy." The resolved operator Q&A states Q7 is confirmed: commit-reveal is sufficient for the "verifiable on-chain" requirement; no VRF is needed.

Leaving Q7 listed as an unresolved blocker is misleading — any reader of the architecture document (including the operator) will believe a critical open question remains before deployment. The ADR-002 body correctly captures commit-reveal as the accepted approach; it needs to be matched by a closed Q7 entry.

_Suggested fix:_ In the Open Questions table, mark Q7 resolved, record the confirmation date and decision (commit-reveal confirmed sufficient per operator 2026-05-31), and remove the "Yes" blocker flag. Cross-reference ADR-002.

---

**F3 [minor] Criterion 7 — commit-reveal-sequence.mmd — no error paths; no prose reference**

The commit-reveal sequence diagram covers the happy path end-to-end but omits all error branches:
- Wrong network detected at Phase 0 (no `wallet_switchEthereumChain` branch shown)
- `commitBet()` revert paths (liquidity failure, pending count exceeded, insufficient balance)
- Timeout claim path (player calls `claimTimeout()` after 256 blocks)
- `revealBet()` blockhash-expired revert (Q8 resolution)

Additionally, the overview prose does not contain an explicit cross-reference to `commit-reveal-sequence.mmd`; the C4 context diagram references its standalone file (`diagrams/c4-context.mmd`) but the sequence diagram has no equivalent prose mention.

_Suggested fix:_ Add a prose sentence in the Observability or System Overview section that links to `diagrams/commit-reveal-sequence.mmd`. Optionally extend the diagram with an alt block or separate diagram for the timeout-refund path, which is the most important failure scenario for player trust.

---

**F4 [minor] Criterion 6 — ADR-005 § Consequences — Railway free tier sleep not fully resolved; no cost ballpark**

ADR-005 correctly identifies that Railway free tier has sleep-on-inactivity behavior and states "ensure the plan level avoids this during the 48-hour evaluation window." However, it does not name the specific Railway plan required (Starter at ~$5/month or a team plan) or give any cost figure. For an operator unfamiliar with Railway pricing, this leaves a decision open that could result in the free tier being used accidentally, causing NFR6 (99% uptime) to fail.

The Sepolia faucet dependency for the initial 10 ETH house pool is mentioned in the BRD but not restated in the deployment steps, which means the operator may reach `houseDeposit()` without testnet ETH in hand.

_Suggested fix:_ Add one sentence to the ADR-005 consequences section naming the Railway plan tier and approximate monthly cost. Add a pre-deploy prerequisite note: "Obtain 10+ Sepolia ETH from a faucet (e.g., sepoliafaucet.com) before calling `houseDeposit()`."

---

**F5 [minor] Criterion 4 — overview.md § Security Posture — encryption at rest and in transit not explicitly named**

The threat model table is comprehensive. However, it does not contain a row for encryption in transit (HTTPS) or encryption at rest (Railway environment variable storage). The NFR mapping covers NFR3 (no private keys in code) but not the transport-layer and storage-layer controls. For a paranoid evaluator reading the architecture, the absence of these rows could raise questions.

_Suggested fix:_ Add a brief note under the threat model or Owner Role Scope section: Railway serves the frontend over TLS (HTTPS enforced); operator private key at rest is in Railway's encrypted environment variable store; no at-rest encryption of on-chain data is required or possible (all on-chain state is public by design).

---

**F6 [nit] Criterion 3 — ADR-002 § Consequences — "VRF would require contract redesign" statement is slightly overstated**

ADR-002 states "VRF would require contract redesign post-MVP (no upgrade path from single-contract approach)." This conflates two separate issues: (a) VRF requires a callback pattern which changes the contract interface; (b) the single-contract decision (ADR-001) means no on-the-fly upgrade. The second point is already documented in ADR-001. The statement is accurate but could mislead a reader into thinking VRF is harder to add than it is: a new `CasinoV2.sol` with VRF would be a clean redeployment, not a complex migration, since all state is player balances which can be migrated by withdrawing from V1 and depositing into V2.

_Suggested fix:_ Soften to: "VRF requires a callback-based contract pattern not present in V1; a VRF upgrade path means deploying a new contract version and having players migrate balances — straightforward for testnet, acceptable for production."

---

**F7 [praise] Criterion 2 — ADR decision quality across all five ADRs**

All five ADRs meet the rubric standard: each has a populated context, a clearly stated decision, at minimum two substantive alternatives with per-option trade-off analysis, and explicitly separated positive and negative consequences. Notably ADR-002 (commit-reveal) proactively addresses Q8 (blockhash expiry), the operator front-running impossibility argument is clearly articulated, and the liveness/griefing risk is called out as "UX friction, not fund-loss risk" — precisely the distinction an operator unfamiliar with Solidity needs to understand. ADR-004 explicitly documents multiplication-before-division ordering and shows the full overflow analysis — this level of detail in a payout math ADR is unusual and valuable.

---

**F8 [praise] Criterion 5 — Observability section is exceptionally thorough for an MVP**

The observability section includes: per-event signal table with trigger, key fields, and interpretation; SLO candidates tied directly to NFR identifiers; an oncall dashboard concept with five named monitors; and a failure scenario matrix with detection signal and response action. The bot early-warning at block 200 (before the 256-block timeout) shows concrete operational thinking. This section exceeds what is typically produced at architecture review for a 48-hour MVP.

---

**F9 [praise] Criterion 1 — NFR mapping table is complete and honest**

All 11 NFRs are present in the mapping table with named mechanisms. NFR10 (mobile viewport) is honestly marked "partially met — QA verification required before delivery" rather than over-claiming. The table format maps each NFR to its row by ID, making cross-checking against the SRS mechanical. This is the correct approach.

---

## Scores

| # | Criterion | Weight | Score | Justification |
|---|---|---|---|---|
| 1 | Alignment with NFRs | 0.20 | 9.0 | All 11 NFRs mapped to named mechanisms. NFR10 honestly flagged as partially met. No silent misses. One minor gap (encryption at-rest/in-transit not in threat table, F5) but NFR3 coverage is solid. |
| 2 | Decision rationale (ADRs) | 0.20 | 9.0 | All 5 ADRs have context, decision, ≥2 alternatives, positive+negative consequences. Overflow analysis, multiplication-before-division ordering, and blockhash expiry all explicitly documented. Q7 not reflected as closed (F2) reduces slightly from perfect. |
| 3 | Scalability & evolvability | 0.15 | 7.5 | Single-contract bytecode limit acknowledged. VRF upgrade path noted (ADR-002). R17 multi-game evolvability noted (ADR-001 negative). No concurrent-user capacity analysis for Railway (acceptable for testnet MVP). No identified EVM-side bottleneck beyond the inherent single-threaded chain execution. |
| 4 | Security posture | 0.15 | 8.0 | Auth named (Ownable). Authz model documented (Owner Role Scope section is explicit). Secrets handling addressed (env vars, MetaMask for players). Reentrancy mitigated at two layers. Blockhash zero-value handled. houseWithdraw addition-form guard documented. Threat table is comprehensive. Encryption at-rest/transit absent from threat table (F5, minor). |
| 5 | Observability readiness | 0.15 | 9.0 | Per-signal table. SLO candidates tied to NFR IDs. Oncall dashboard concept. Failure scenario matrix. Bot early-warning at block 200. Exceeds MVP standard. |
| 6 | Cost & operational fit | 0.10 | 6.5 | Railway free-tier sleep risk identified but not resolved to a named plan/cost (F4). ARCH-Q1 contradiction means bot restart risk is documented incorrectly — operator could implement in-memory + deterministic derivation thinking it is the approved path (F1). Sepolia faucet prerequisite not restated in deployment steps (F4). |
| 7 | Diagram quality | 0.05 | 7.5 | C4 context and container diagrams correct level, prose-referenced (context references standalone file). Container diagram is inline only, no standalone .mmd file (minor). Sequence diagram covers full happy path but no error/timeout paths and has no prose cross-reference (F3). Both diagrams syntactically valid mermaid. |

---

## Weighted Total

```
score = (9.0 × 0.20) + (9.0 × 0.20) + (7.5 × 0.15) + (8.0 × 0.15) + (9.0 × 0.15) + (6.5 × 0.10) + (7.5 × 0.05)
      = 1.800 + 1.800 + 1.125 + 1.200 + 1.350 + 0.650 + 0.375
      = 8.30
```

No blockers present. Score 8.3 ≥ 7.0 threshold.

---

## Verdict

**approved** — score 8.3; no blockers; stage advanced to `done`.

### Top 3 Findings

1. **F1 [major]** — ARCH-Q1 contradiction in Reveal Bot Deployment section. The confirmed resolution (database persistence; deterministic derivation rejected) is not reflected — the document still describes the rejected approach. Must be corrected before contract coding begins to avoid the operator implementing the wrong secret storage pattern.

2. **F2 [major]** — Q7 not closed in the Open Questions table. Operator-confirmed resolution (commit-reveal sufficient; no VRF needed) must be recorded in the architecture document so no reader believes a deploy-blocking question remains open.

3. **F4 [minor]** — Railway free-tier sleep risk not resolved to a named plan; Sepolia faucet prerequisite absent from deployment steps. Low risk if operator is attentive but is an operational gap for a near-zero-EVM-experience operator working under a 48-hour constraint.

### Condition of Approval

The two major findings (F1, F2) are documentation corrections that do not change any design decision — the correct decisions are already confirmed. They must be addressed in the overview before contract implementation begins. No re-review is required; the architect may apply the fixes and proceed to implementation.
