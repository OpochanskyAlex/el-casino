---
doc: RISK
project: el-casino
version: 0.1
status: draft
owner: project-manager
reviewed_by: null
score: null
refs:
  - {doc: brd, version: 0.1}
  - {doc: srs, version: 0.1}
  - {doc: arch, version: 0.1}
activities: [wallet, deposit, gameplay, withdraw, fairness-audit, General]
updated: 2026-05-31
tags: [project-docs, risks]
---

# Risk Register

| ID | Category | Risk | Probability | Impact | Severity | Mitigation | Contingency | Owner |
|---|---|---|---|---|---|---|---|---|
| RISK1 | Technical | **Solidity bug in payout or liquidity math** — incorrect payout formula or liquidity check (e.g., integer division ordering, `totalPendingReserved` not decremented on timeout) causing over/underpayment or contract insolvency. Most likely in T9 (commitBet pre-checks) or T10 (revealBet payout). | M | H | MH | Claude generates tests in T13 that explicitly verify each formula at MIN_BET, MAX_BET, and edge values. Foundry 0.8.x checked arithmetic reverts on overflow. Payout formula reviewed against ADR-004 (multiplication-before-division). T14 fixes all failures before deploy. | Do not deploy until `forge test` exits 0. If bug found post-deploy, redeploy contract and update `NEXT_PUBLIC_CONTRACT_ADDRESS`; house pool can be migrated via `houseWithdraw` before redeployment. | Operator |
| RISK2 | Technical | **Reveal bot crashes and secrets are lost** — if the bot process dies before persisting the secret to DB (T32), the betId cannot be revealed, `blockhash` expires after 256 blocks, and the player must claim a refund manually. If the DB itself is lost, secrets for all in-flight bets are irrecoverable. | M | H | MH | Bot persists secret to DB atomically before broadcasting the commitBet tx confirmation (T32). DB is Railway-managed PostgreSQL with daily backups. Bot start-up re-queries DB for all pending bets and resumes (T31). Alert at block 200 (T33). | Player uses `claimTimeout()` for full refund after 256 blocks — no funds lost. Restart bot from DB state. If DB lost: all pending bets expire to timeout refunds; house absorbs lost reveals as refund cost (testnet: no financial impact). | Operator |
| RISK3 | Technical | **wagmi v2 / viem API incompatibility** — wagmi v2 and viem have significantly changed APIs vs wagmi v1/ethers.js v5; Claude code generation may use stale patterns, causing runtime errors or silent wrong behavior in transaction submission or event watching. | M | M | MM | Claude explicitly pins to wagmi v2 and viem latest docs during code generation. ADR-003 flags this risk. T18 wires provider and tests `useReadContract` before any component work begins. | Downgrade to wagmi v1 + ethers.js v5 if v2 proves problematic; estimated 4-hour rework of T18–T30. | Operator+Claude |
| RISK4 | Technical | **Foundry test coverage gaps — bug not caught before deploy** — T13 test suite written by Claude may miss edge cases (e.g., re-entrant claimTimeout, double-reveal attempt, or blockhash-expiry path); the bug reaches Sepolia. | M | M | MM | Test plan in T13 explicitly enumerates all named revert conditions from the SRS API contract. T14 iterates until `forge test` exits 0. Architect reviewed security posture (reentrancy guards, CEI). | Post-deploy redeploy if critical bug found. On testnet: no real funds at risk. `houseWithdraw` allows draining house pool before redeploy. | Claude / Operator |
| RISK5 | Technical | **`blockhash` zero-hash edge case not handled in bot** — if the reveal bot is slow and attempts `revealBet` after 256 blocks, `blockhash(commitBlock)` returns `bytes32(0)` and the contract reverts (Q8 resolution in arch). Bot must detect this and not retry indefinitely. | L | M | LM | Contract correctly reverts with "Blockhash expired; player may claim timeout". Bot logs revert reason (T31). Alert at block 200 fires first (T33) giving operator 56 blocks to intervene. Bot should mark bet as expired and stop retrying on this specific revert. | Player calls `claimTimeout()` for full refund. Bot marks bet expired in DB. | Claude |
| RISK6 | Technical | **Sepolia RPC endpoint downtime during evaluation** — Alchemy or Infura Sepolia endpoint goes down during the evaluator's 48-hour review window, making all frontend interactions fail. | L | H | LH | Configure a fallback RPC URL as a second environment variable; frontend wagmi transport falls back automatically if primary fails (viem transport fallback config). Use Alchemy as primary, Infura as secondary. | Operator switches `NEXT_PUBLIC_RPC_URL` to backup endpoint and redeploys Railway app (< 5 minutes). | Operator |
| RISK7 | Technical | **Etherscan API verification fails at deploy time** — Foundry `--verify` flag may fail due to Etherscan API rate limits, transient network issues, or compiler version mismatch, leaving contract unverified at M2. NFR9 requires verified source before public URL is "done". | M | M | MM | `forge verify-contract` can be rerun independently after deploy (ADR-005 mitigations). Allow 30-minute buffer in Phase 1 schedule between T15 and T16. Confirm compiler version in `foundry.toml` matches what Etherscan expects. | Retry `forge verify-contract` with explicit `--compiler-version` flag. If Etherscan API is down, wait and retry; no code change needed. | Operator+Claude |
| RISK8 | Scope | **Commit-reveal mechanism judged insufficient by evaluator (BRD U1 / SRS Q7)** — the evaluator may expect Chainlink VRF or equivalent oracle-based randomness rather than operator-controlled commit-reveal; G2 (verifiable fairness) may be judged unmet. This uncertainty was explicitly tracked in BRD as U1 and is now RESOLVED as operator-confirmed sufficient, but evaluator opinion remains a residual risk. | L | H | LH | ADR-002 fully documents the choice and its limitations. FR33 requires UI disclosure of the operator griefing limitation. FR35 requires a verification code snippet. README "How to verify" section (T41) explains the mechanism in full. The operator griefing risk is fully mitigated by `claimTimeout()` — player funds are never at risk. | If evaluator flags: provide supplementary explanation referencing ADR-002 and the architectural upgrade path to Chainlink VRF post-MVP. No code change needed for the evaluation itself. | Operator |
| RISK9 | Scope | **Mobile viewport QA failures (NFR10)** — Tailwind CSS responsive classes may produce horizontal overflow or broken layouts at 320 px, particularly in the CoinFlipGame or GameHistory components. QA (T36) is the last Phase 4 task; fixes compete with T42 buffer. | M | L | ML | Claude uses Tailwind responsive prefixes (`sm:`, `md:`) and `overflow-x-hidden` on root layout throughout Phase 2. T36 tests at 320 px and 375 px before T41. | Triage: game-breaking layout issues fixed in T42 buffer. Minor cosmetic issues deferred with note in README. | Operator+Claude |
| RISK10 | Scope | **Game history load too slow (NFR1 — p95 < 2 000 ms)** — `eth_getLogs` with a 10,000-block window (FR27) against Alchemy may be slow on Sepolia if there are many events or the RPC node is loaded, pushing the p95 past 2,000 ms. | L | L | LL | FR27 explicitly caps the block range at 10,000 to prevent genesis-to-tip scans. History panel uses async loading with skeleton placeholder (never blocks page render). T27 tests history load time manually. | If too slow: reduce block window to 5,000 or add a "Load history" button rather than auto-loading. | Claude |
| RISK11 | Team | **Single operator — no backup; operator blocks on Solidity or deployment** — the operator has near-zero Solidity experience; if Claude-generated code has a bug the operator cannot diagnose without guidance, progress stalls. Given the 48-hour window, a multi-hour block is significant. | M | H | MH | CLAUDE.md mandates plain-language explanations for every contract decision. Claude generates test output explanations alongside code. All contract decisions use boring, well-audited patterns (OpenZeppelin). T14 is explicitly an Operator+Claude collaborative task. | Operator escalates to Claude for full diagnostic. If stuck > 2 hours, simplify scope: remove GameHistory (R14 is [should]) or remove mobile QA (R18 is [could]) to recover time. | Operator |
| RISK12 | Team | **LLM-generated code has subtle off-by-one or logic bug not caught in tests** — Claude may generate code that passes the unit tests but has a logic error in the interaction between components (e.g., pending-bet count not decremented correctly on refund, causing a player to be permanently blocked after a timeout). | M | M | MM | T13 includes end-to-end sequence tests (deposit → commit → reveal cycle) not just unit tests. T34 runs a full E2E manual test on Sepolia which exercises the live contract. Critical path tasks (T9, T10, T11) have high token budgets to allow for iteration. | If discovered post-deploy on testnet: redeploy. No real funds at risk. | Claude / Operator |
| RISK13 | External | **Railway cold-start or sleep during evaluation** — Railway free-tier services sleep after inactivity; a sleeping service returns a 5xx during the evaluator's first request, leaving a bad first impression. NFR6 requires >= 99% uptime. | M | M | MM | Use Railway Hobby plan (paid tier, no sleep) or set up UptimeRobot to ping the URL every 5 minutes, preventing sleep. ADR-005 notes this risk explicitly. Confirm plan tier during T38. | Switch to Hobby plan ($5/month) immediately if free tier shows sleep behavior in T39 testing. | Operator |
| RISK14 | Compliance | **Accidental mainnet deploy** — operator mistakes the RPC URL or private key configuration and deploys to Ethereum mainnet instead of Sepolia, violating C1 and potentially losing real ETH to gas. | L | H | LH | `.env` files include explicit `CHAIN_ID=11155111` check. Deploy script in T15 includes a `require(block.chainid == 11155111)` assertion in `DeployScript.s.sol`. Operator verifies RPC URL before running deploy command. | If mainnet deploy occurs: do not fund house pool. Contract is harmless with no ETH. Deploy again on Sepolia. No real ETH lost to contract logic (only gas). | Operator |
| RISK15 | Compliance | **House edge formula incorrect — edge not "real" or applied inconsistently** — if the payout formula or `HOUSE_EDGE_BPS` constant is wrong (e.g., 1.96 calculated as 2× instead of 1.96×, or edge applied to both win and loss), the casino either overpays (house loses money) or under-pays (player over-charged), violating R7, G4, and BR1. | L | H | LH | T13 tests include explicit assertions on payout amount: `assertEq(payout, betAmount * 9800 / 5000)`. `HOUSE_EDGE_BPS = 200` is a Solidity `constant` (NFR8). FR21 specifies the exact formula. T35 smoke test observes an actual win payout and verifies the amount. | If wrong: redeploy contract with correct formula (testnet; no real funds). T42 buffer absorbs the rework time. | Claude / Operator |

---

# Risk Heat Map

**Axes:** Probability (vertical, H/M/L top-to-bottom) × Impact (horizontal, L/M/H left-to-right)

```
            │  Impact L   │  Impact M   │  Impact H   │
────────────┼─────────────┼─────────────┼─────────────┤
Prob H      │             │             │             │
────────────┼─────────────┼─────────────┼─────────────┤
Prob M      │  RISK9      │  RISK3      │  RISK1      │
            │             │  RISK4      │  RISK2      │
            │             │  RISK7      │  RISK11     │
            │             │  RISK12     │             │
            │             │  RISK13     │             │
────────────┼─────────────┼─────────────┼─────────────┤
Prob L      │  RISK10     │  RISK5      │  RISK6      │
            │             │             │  RISK8      │
            │             │             │  RISK14     │
            │             │             │  RISK15     │
────────────┴─────────────┴─────────────┴─────────────┘
```

**Top risks by severity (MH = highest actionable tier):**

1. **RISK1** (MH) — Solidity bug in payout/liquidity math. Mitigated by T13 test suite and T14 iteration.
2. **RISK2** (MH) — Reveal bot crash with secret loss. Mitigated by DB persistence (T32) and T33 alerting.
3. **RISK11** (MH) — Single operator blocked on Solidity debugging. Mitigated by Claude explanations and simplified fallback scope.

**Watch list (MM — monitor, mitigate proactively):**

- RISK3 (wagmi v2 API mismatch) — verify early in T18 before building components.
- RISK4 (test coverage gap) — explicit revert-condition enumeration in T13.
- RISK7 (Etherscan verification failure) — schedule buffer between T15 and T16.
- RISK12 (LLM logic bug in interaction) — E2E sequence tests in T13 and T34.
- RISK13 (Railway cold-start) — confirm paid tier in T38.
