---
doc: PLAN
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
updated: 2026-05-31
tags: [project-docs, plan]
---

# Project Overview

El Casino is a browser-based, provably-fair coin-flip casino on the Ethereum Sepolia testnet. A single operator (Python/BA background, near-zero Solidity experience) assisted by Claude Code will build the complete system — one Solidity smart contract (`CasinoV1.sol`), one Next.js 14 frontend, and one Node.js operator reveal bot — within a 48-hour build window. Success means a public Railway URL where any user can connect MetaMask, deposit testnet ETH, play a commit-reveal coin flip with a 2% house edge, withdraw their balance, and verify the fairness of every round on Sepolia Etherscan. The contract must be verified on Etherscan and all 38 functional requirements from the SRS must be met at delivery.

---

# Milestones

| ID | Name | Definition | Target Hour |
|---|---|---|---|
| M1 | Environment ready | Foundry, Node.js, pnpm installed; repo initialized; wallets funded; API keys in `.env` | Hour 2 |
| M2 | Contract deployed and verified | `CasinoV1.sol` deployed to Sepolia; source verified on Etherscan; house pool funded with 10 ETH; all Foundry tests green | Hour 12 |
| M3 | Frontend connects, deposits, plays end-to-end (local) | Next.js app runs locally against Sepolia; wallet connect, deposit, commitBet, result display, withdraw all functional | Hour 28 |
| M4 | Reveal bot running; full flow on Sepolia testnet | Reveal bot persists secrets to DB, watches BetCommitted, calls revealBet; complete end-to-end flow tested on Sepolia | Hour 36 |
| M5 | Public Railway URL live; all acceptance criteria met | Frontend deployed to Railway; all US1–US6 pass manually; NFR6 uptime monitor active; README complete | Hour 48 |

---

# Work Breakdown Structure

## Phase 0 — Environment Setup

### T1 Install Foundry toolchain
- **Description:** Install `forge`, `cast`, and `anvil` using the official Foundry installer (`curl -L https://foundry.paradigm.xyz | bash`).
- **Owner:** Operator
- **Depends-on:** —
- **Size:** XS
- **Tokens:** 0
- **Milestone:** M1
- **Done:** `forge --version` returns a valid version string; `anvil --version` works.

### T2 Install Node.js 20 and pnpm
- **Description:** Install Node.js 20 LTS and pnpm package manager on the operator's machine.
- **Owner:** Operator
- **Depends-on:** —
- **Size:** XS
- **Tokens:** 0
- **Milestone:** M1
- **Done:** `node --version` returns v20.x; `pnpm --version` returns a valid version.

### T3 Initialize repository structure (Foundry project + Next.js app)
- **Description:** Create GitHub repo, initialize Foundry project under `/contracts` with `forge init`, scaffold Next.js 14 app under `/web` with `pnpm create next-app`, add `.gitignore` entries for `.env` files and `out/` directories.
- **Owner:** Operator+Claude
- **Depends-on:** T1, T2
- **Size:** S
- **Tokens:** 5,000
- **Milestone:** M1
- **Done:** `forge build` succeeds in `/contracts`; `pnpm dev` serves the Next.js app; repo pushed to GitHub with no secrets committed.

### T4 Obtain Sepolia ETH from faucet
- **Description:** Fund the operator's deployer wallet with at least 12 Sepolia ETH (10 for house pool, ~2 for gas) using Alchemy, Infura, or sepoliafaucet.com faucets.
- **Owner:** Operator
- **Depends-on:** —
- **Size:** XS
- **Tokens:** 0
- **Milestone:** M1
- **Done:** Deployer wallet shows >= 12 ETH on Sepolia Etherscan.

### T5 Obtain Etherscan API key and Alchemy/Infura RPC URL
- **Description:** Create Etherscan account and generate an API key; create Alchemy or Infura account and obtain a Sepolia JSON-RPC endpoint URL.
- **Owner:** Operator
- **Depends-on:** —
- **Size:** XS
- **Tokens:** 0
- **Milestone:** M1
- **Done:** `ETHERSCAN_API_KEY` and `SEPOLIA_RPC_URL` values are in hand (not yet committed anywhere).

### T6 Configure `.env` files
- **Description:** Create `/contracts/.env` (DEPLOYER_PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY) and `/web/.env.local` (NEXT_PUBLIC_CONTRACT_ADDRESS placeholder, NEXT_PUBLIC_RPC_URL, NEXT_PUBLIC_CHAIN_ID=11155111); Claude generates `.env.example` templates with placeholder values.
- **Owner:** Operator+Claude
- **Depends-on:** T5
- **Size:** XS
- **Tokens:** 2,000
- **Milestone:** M1
- **Done:** `.env.example` files committed; actual `.env` files exist locally and are in `.gitignore`; `grep -r "PRIVATE_KEY" /web/src` returns no results.

---

## Phase 1 — Smart Contract

### T7 Write CasinoV1.sol: storage, structs, constants, events
- **Description:** Scaffold `CasinoV1.sol` with OpenZeppelin `Ownable` and `ReentrancyGuard` imports, all data model structs (Bet, BetStatus enum), all constants (HOUSE_EDGE_BPS, TIMEOUT_BLOCKS, MIN_BET, MAX_BET), all storage variables (playerBalances, bets, houseBalance, totalPendingReserved, nextBetId, pendingBetCount), and all event declarations per SRS API contracts.
- **Owner:** Claude
- **Depends-on:** T3
- **Size:** M
- **Tokens:** 15,000
- **Milestone:** M2
- **Done:** `forge build` succeeds; all DM1/DM2/DM3 fields present; all 7 events declared with correct parameter types and indexed fields.

### T8 Implement deposit() and getBalance() / view functions
- **Description:** Implement `deposit()` payable with contract-level min/max range enforcement (Q5 resolution: `require(msg.value >= MIN_BET && msg.value <= MAX_BET)`), balance credit, and `Deposited` event; implement `getBalance()`, `getPendingBets()`, `getBet()` view functions.
- **Owner:** Claude
- **Depends-on:** T7
- **Size:** M
- **Tokens:** 10,000
- **Milestone:** M2
- **Done:** `deposit()` credits balance, emits event, reverts on range violations; view functions return correct types.

### T9 Implement commitBet() with all pre-checks
- **Description:** Implement `commitBet(uint256 betAmount, bytes32 commitHash, uint8 choice)` with the five pre-checks from the SRS API contract (bet range, player balance, pending count, single portfolio liquidity check using FR18 formula), balance deduction, bet record creation, `totalPendingReserved` update, and `BetCommitted` event emission.
- **Owner:** Claude
- **Depends-on:** T8
- **Size:** L
- **Tokens:** 20,000
- **Milestone:** M2
- **Done:** All five require() calls present with canonical error messages; `pendingBetCount` incremented; `totalPendingReserved` updated by `betAmount * 196 / 100`; BetCommitted emitted with all 6 fields.

### T10 Implement revealBet() with commit-reveal verification and payout
- **Description:** Implement `revealBet(uint256 betId, bytes32 secret)` with `onlyOwner`, hash verification, blockhash-expiry guard (Q8 resolution), outcome computation (`keccak256(abi.encodePacked(secret, blockHashUsed)) % 2`), payout using basis-points formula (`betAmount * 9800 / 5000`), balance updates for win/loss, `totalPendingReserved` decrement, `pendingBetCount` decrement, status update, and `BetRevealed` event with all 8 fields (NFR7).
- **Owner:** Claude
- **Depends-on:** T9
- **Size:** L
- **Tokens:** 20,000
- **Milestone:** M2
- **Done:** Hash mismatch reverts with "Invalid secret"; blockhash(0) reverts with "Blockhash expired"; win credits `betAmount * 9800 / 5000`; loss adds `betAmount` to `houseBalance`; BetRevealed emits all 8 fields including `secret` and `blockHashUsed`.

### T11 Implement claimTimeout() with 256-block enforcement
- **Description:** Implement `claimTimeout(uint256 betId)` with caller validation, status check, block-number timeout check, full refund to `playerBalances`, `totalPendingReserved` decrement, `pendingBetCount` decrement, status update to Refunded, and `BetRefunded` event; apply `nonReentrant` modifier (NFR5).
- **Owner:** Claude
- **Depends-on:** T9
- **Size:** M
- **Tokens:** 10,000
- **Milestone:** M2
- **Done:** All three require() calls present; refund credited before storage update (CEI); nonReentrant applied; BetRefunded emitted.

### T12 Implement houseDeposit() and houseWithdraw()
- **Description:** Implement `houseDeposit()` payable with `onlyOwner`, `houseBalance` credit, and `HouseDeposited` event; implement `houseWithdraw(uint256 amount)` with `onlyOwner`, `nonReentrant`, addition-form liquidity guard (`houseBalance >= totalPendingReserved + amount`, F15 resolution), ETH transfer, and `HouseWithdrawn` event.
- **Owner:** Claude
- **Depends-on:** T7
- **Size:** S
- **Tokens:** 8,000
- **Milestone:** M2
- **Done:** `houseWithdraw` reverts with "Would drain reserved funds" when guard fails; both emit events; `nonReentrant` on withdraw.

### T13 Write Foundry unit test suite
- **Description:** Write comprehensive Foundry tests in `test/CasinoV1.t.sol` covering: deposit happy path and range reverts; withdraw happy path, insufficient balance, zero amount; commitBet happy path, all five revert conditions, pending-count limit, liquidity checks; revealBet win and loss outcomes, hash mismatch revert, blockhash-expiry revert, onlyOwner enforcement; claimTimeout happy path, timeout-not-reached revert, not-your-bet revert; houseDeposit and houseWithdraw including drain guard; end-to-end sequence tests (deposit → commit → reveal cycle); edge cases (bet at MIN_BET, bet at MAX_BET, multiple simultaneous pending bets).
- **Owner:** Claude
- **Depends-on:** T10, T11, T12
- **Size:** L
- **Tokens:** 30,000
- **Milestone:** M2
- **Done:** `forge test` exits 0; >= 80% branch coverage; all happy paths and each named revert condition covered by at least one test.

### T14 Run forge test, diagnose and fix failures
- **Description:** Run `forge test -vv` and address any compilation errors, logic bugs, or incorrect assertions surfaced by the test suite; iterate until all tests pass.
- **Owner:** Operator+Claude
- **Depends-on:** T13
- **Size:** M
- **Tokens:** 15,000
- **Milestone:** M2
- **Done:** `forge test` exits 0 with no failures or skipped tests; gas report reviewed for unexpected costs.

### T15 Deploy CasinoV1.sol to Sepolia via forge script
- **Description:** Write `contracts/script/DeployScript.s.sol`; run `forge script ... --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY`; record the deployed contract address.
- **Owner:** Operator+Claude
- **Depends-on:** T14
- **Size:** S
- **Tokens:** 5,000
- **Milestone:** M2
- **Done:** Deployment broadcast succeeds; contract address returned; Etherscan shows contract creation transaction.

### T16 Verify contract source on Sepolia Etherscan
- **Description:** Confirm `--verify` flag succeeded during T15; if not, run `forge verify-contract` with the deployed address; confirm ABI and source are publicly readable on Etherscan.
- **Owner:** Operator+Claude
- **Depends-on:** T15
- **Size:** S
- **Tokens:** 3,000
- **Milestone:** M2
- **Done:** Etherscan contract page shows "Contract Source Code Verified"; ABI tab is populated; `HOUSE_EDGE_BPS` visible as a constant in source.

### T17 Fund house pool via houseDeposit()
- **Description:** Call `houseDeposit()` with 10 ETH using `cast send` or Etherscan's "Write Contract" tab; confirm `HouseDeposited` event on Etherscan.
- **Owner:** Operator
- **Depends-on:** T16
- **Size:** XS
- **Tokens:** 0
- **Milestone:** M2
- **Done:** `houseBalance` reads 10 ETH from `cast call`; `HouseDeposited` event visible on Etherscan.

---

## Phase 2 — Frontend Core

### T18 Scaffold Next.js 14 app with Tailwind CSS and wagmi/viem
- **Description:** Configure Tailwind CSS in the Next.js project; install and configure wagmi v2 and viem; set up `WagmiProvider` with Sepolia chain config and Alchemy/Infura transport; create contract config file with ABI and address from environment variable.
- **Owner:** Claude
- **Depends-on:** T3, T16
- **Size:** M
- **Tokens:** 15,000
- **Milestone:** M3
- **Done:** `pnpm dev` serves the app; wagmi provider wraps the app; `useReadContract` call to `getBalance` returns without error on Sepolia.

### T19 Implement WalletConnect component
- **Description:** Implement wallet connection button using wagmi `useConnect`/`useDisconnect`; detect `window.ethereum` absence (FR1, AC1.4); display truncated address on connect (FR2); detect wrong network via `eth_chainId`/`chainChanged` event and offer one-click Sepolia switch (FR3, AC1.5, AC1.6); handle user rejection (error 4001, AC1.8); disconnect returns to landing state without reload (FR4, AC1.7).
- **Owner:** Claude
- **Depends-on:** T18
- **Size:** M
- **Tokens:** 15,000
- **Milestone:** M3
- **Done:** All AC1.x acceptance criteria pass; MetaMask-not-found state shown when window.ethereum absent; wrong-network prompt shown on non-Sepolia chain.

### T20 Implement BalancePanel
- **Description:** Implement a component that reads `getBalance(connectedAddress)` via `useReadContract` and displays the casino balance in ETH; updates reactively after every deposit, withdrawal, or bet resolution without manual refresh (NFR2).
- **Owner:** Claude
- **Depends-on:** T19
- **Size:** S
- **Tokens:** 8,000
- **Milestone:** M3
- **Done:** Balance displays immediately after connection; updates within 1 block confirmation of any balance-changing transaction; shows 0.000 ETH when balance is zero.

### T21 Implement DepositForm
- **Description:** Implement deposit form with numeric ETH input; client-side validation (amount >= 0.001 ETH, <= 0.1 ETH, <= wallet balance, FR7); faucet link (FR11, R13); MetaMask tx submission via `useWriteContract`; loading state until confirmation (FR36); error display for all failure modes (FR37); balance refresh on confirmation (FR9).
- **Owner:** Claude
- **Depends-on:** T20
- **Size:** M
- **Tokens:** 12,000
- **Milestone:** M3
- **Done:** AC2.x acceptance criteria pass; validation errors show inline before MetaMask prompt; loading spinner persists until tx confirmed; balance updates after 1-block confirmation.

### T22 Implement WithdrawForm
- **Description:** Implement withdrawal form with amount input and "Withdraw all" option; client-side validation (amount >= 0.001 ETH, <= casino balance, FR28); MetaMask tx via `useWriteContract`; loading state; error states for rejection and on-chain revert; balance refresh on confirmation (FR31).
- **Owner:** Claude
- **Depends-on:** T20
- **Size:** M
- **Tokens:** 12,000
- **Milestone:** M3
- **Done:** AC5.x acceptance criteria pass; form disabled when casino balance is 0; "Withdraw all" pre-fills max; loading state covers tx confirmation.

### T23 Implement CoinFlipGame component
- **Description:** Implement the main game UI: bet amount input with validation (FR13), Heads/Tails selection (FR12, choice 0/1), house edge display "House edge: 2%. Winning payout: 1.96× your bet." (FR14, AC3.3), Play button enabled only when connected, on Sepolia, casino balance > 0, and valid bet amount; reject bet if 2 pending bets already exist (FR13, AC3.13).
- **Owner:** Claude
- **Depends-on:** T20
- **Size:** L
- **Tokens:** 20,000
- **Milestone:** M3
- **Done:** AC3.1–AC3.4, AC3.13 pass; house edge text always visible; Play button state correctly reflects all preconditions.

### T24 Implement commit transaction flow
- **Description:** On Play: generate cryptographically random `secret` (uint256) using `crypto.getRandomValues`; compute `commitHash = keccak256(abi.encodePacked(secret))` via viem; call `commitBet(betAmount, commitHash, choice)` via `useWriteContract`; store `secret` and `betId` from BetCommitted event in localStorage or component state; show pending-reveal state "Waiting for result..." with bet amount displayed (FR19, AC3.16); loading state during MetaMask prompt and tx confirmation (FR36).
- **Owner:** Claude
- **Depends-on:** T23
- **Size:** L
- **Tokens:** 20,000
- **Milestone:** M3
- **Done:** BetCommitted event received and betId extracted; secret persisted to localStorage keyed by betId; "Waiting for result..." state displayed immediately after confirmation; secret survives page refresh.

### T25 Implement result-check and display flow
- **Description:** Poll for BetRevealed event (or use `useWatchContractEvent`) filtered by betId; when event fires, display win/loss result with payout amount and outcome; clear pending-reveal state; update BalancePanel; show win/loss visual feedback (AC4.x); handle the case where reveal has not yet occurred (spinner + "Operator is revealing your bet…").
- **Owner:** Claude
- **Depends-on:** T24
- **Size:** M
- **Tokens:** 15,000
- **Milestone:** M3
- **Done:** Win/loss result displayed within 1 block of BetRevealed event; payout shown on win; balance updated; pending state cleared.

### T26 Implement claimTimeout UI
- **Description:** For each pending bet stored in state, compute whether `currentBlock > commitBlock + 256`; if true, show "Claim timeout refund" button; button calls `claimTimeout(betId)` via `useWriteContract` with loading state; on success, clear pending bet and refresh balance (FR24, AC3.17).
- **Owner:** Claude
- **Depends-on:** T24
- **Size:** M
- **Tokens:** 10,000
- **Milestone:** M3
- **Done:** Button invisible before block 256; button appears and is clickable after block 256; loading state covers tx; balance updated on success.

### T27 Implement GameHistory component
- **Description:** Load last 20 BetRevealed events for connected address using `eth_getLogs` with 10,000-block window (FR27); display each as a row showing round ID, bet amount, player choice, outcome (Win/Loss), payout, and Etherscan tx link (FR25, FR26); refresh after each new BetRevealed event.
- **Owner:** Claude
- **Depends-on:** T25
- **Size:** M
- **Tokens:** 12,000
- **Milestone:** M3
- **Done:** At least 5 rows visible after 5 completed rounds; each row has working Etherscan link; history updates within one block of new BetRevealed event; empty state shown when no history.

### T28 Implement error and loading states for all async operations
- **Description:** Audit every async operation (connect, deposit, commitBet, withdraw, claimTimeout) for FR36 loading states and FR37 error states; add React error boundary; ensure every MetaMask rejection (error 4001), on-chain revert, and network error surfaces a specific human-readable message matching canonical AC error strings; no silent failures.
- **Owner:** Claude
- **Depends-on:** T21, T22, T24, T26
- **Size:** M
- **Tokens:** 10,000
- **Milestone:** M3
- **Done:** FR37 error message matrix fully covered; error boundary in place; no uncaught promise rejections in browser console during normal usage.

### T29 Implement VerifyFairness page
- **Description:** Add `/verify` route with "How to Verify" content: plain-language explanation of commit-reveal (FR32), operator griefing disclosure (FR33), Python/JS code snippet to recompute outcome from BetRevealed event data (FR35), contract address with Etherscan deep link (FR34, FR38); accessible without wallet connection (AC6.3).
- **Owner:** Claude
- **Depends-on:** T18
- **Size:** S
- **Tokens:** 8,000
- **Milestone:** M3
- **Done:** `/verify` route accessible without wallet; code snippet present and correct; contract address shown and links to Etherscan; AC6.x criteria pass.

### T30 Wire wagmi contract config: ABI, address, chain
- **Description:** Generate TypeScript ABI from compiled contract artifact; create typed contract config object for wagmi; wire `NEXT_PUBLIC_CONTRACT_ADDRESS` and `NEXT_PUBLIC_CHAIN_ID` from environment variables; confirm all `useReadContract`/`useWriteContract` calls use the typed config.
- **Owner:** Claude
- **Depends-on:** T18
- **Size:** S
- **Tokens:** 5,000
- **Milestone:** M3
- **Done:** No raw string ABIs in component files; contract address sourced exclusively from env var; TypeScript compiler raises no type errors on contract call arguments.

---

## Phase 3 — Reveal Bot

### T31 Write reveal bot script
- **Description:** Write Node.js script (`/bot/index.js` or TypeScript) using ethers.js v6; subscribe to `BetCommitted` events on Sepolia; for each event, retrieve the pre-stored secret from the DB; call `revealBet(betId, secret)` using the operator wallet; confirm `BetRevealed` event; log all steps per architecture observability spec; handle retry on tx failure.
- **Owner:** Claude
- **Depends-on:** T10, T32
- **Size:** L
- **Tokens:** 20,000
- **Milestone:** M4
- **Done:** Bot starts, connects to Sepolia, subscribes to events; `revealBet()` called within 5 blocks of `BetCommitted`; `BetRevealed` event confirmed in logs; tx hash logged.

### T32 Add DB persistence for secret-to-betId mapping
- **Description:** Integrate PostgreSQL (or Redis) client into the reveal bot; on commitBet submission from frontend, persist `{betId, secret, commitBlock, status}` before broadcasting the tx; on bot start, query pending records and resume processing unresolved bets; handle bot restart gracefully (no double-reveal).
- **Owner:** Claude
- **Depends-on:** T3
- **Size:** M
- **Tokens:** 12,000
- **Milestone:** M4
- **Done:** Secrets survive bot restart; no double-reveal attempts; pending bets from before restart are processed on reconnect; DB schema migration applied.

### T33 Add bot alerting and block-countdown logging
- **Description:** Add log warning when any betId reaches `commitBlock + 200` without a BetRevealed event (early warning per architecture observability spec); add log error at `commitBlock + 250`; log the remaining blocks for each pending bet on each new block event.
- **Owner:** Claude
- **Depends-on:** T31
- **Size:** S
- **Tokens:** 5,000
- **Milestone:** M4
- **Done:** Warning log visible at block 200; error log at block 250; per-bet block countdown in log output.

### T34 Test full end-to-end flow on Sepolia
- **Description:** Execute a complete manual test: deposit ETH → commitBet (operator reveals via bot) → confirm BetRevealed event and result → withdraw; run the sequence for both a win outcome and a loss outcome; test claimTimeout by deploying a bet and waiting (or fast-forwarding with cast); confirm game history populates correctly.
- **Owner:** Operator+Claude
- **Depends-on:** T31, T33, T25, T27
- **Size:** M
- **Tokens:** 10,000
- **Milestone:** M4
- **Done:** Win and loss outcomes both observed on Sepolia; BetRevealed events readable on Etherscan; GameHistory shows completed rounds; claimTimeout tested at least once; no silent failures.

---

## Phase 4 — Integration, Polish, and Deploy

### T35 End-to-end smoke test: all user stories US1–US6
- **Description:** Execute manual walkthrough of all six user stories (US1 connect, US2 deposit, US3 place bet, US4 view result, US5 withdraw, US6 verify fairness) against the deployed Sepolia contract; log pass/fail per acceptance criterion.
- **Owner:** Operator+Claude
- **Depends-on:** T34, T29
- **Size:** M
- **Tokens:** 8,000
- **Milestone:** M5
- **Done:** All AC criteria for US1–US6 logged as pass; any failures raised as bug tickets resolved in T42.

### T36 Mobile viewport QA (320 px, 375 px)
- **Description:** Open the app in Chrome DevTools at 320 px and 375 px widths; check for horizontal overflow, broken layouts, unreadable text, overlapping elements; log any failures (NFR10).
- **Owner:** Operator
- **Depends-on:** T35
- **Size:** S
- **Tokens:** 0
- **Milestone:** M5
- **Done:** No horizontal overflow at 320 px; all interactive elements reachable; text legible.

### T37 Copy pass: house edge, error messages, How-to-Verify text
- **Description:** Review all user-facing copy: house edge display matches "House edge: 2%. Winning payout: 1.96× your bet." (FR14); error messages match canonical AC strings (FR37); How-to-Verify text is accurate and non-technical; operator griefing limitation disclosed (FR33).
- **Owner:** Operator+Claude
- **Depends-on:** T35
- **Size:** S
- **Tokens:** 5,000
- **Milestone:** M5
- **Done:** House edge text present on game UI; all canonical error messages verified against FR37 list; How-to-Verify text reviewed and approved by operator.

### T38 Configure Railway project and environment variables
- **Description:** Create Railway project; connect GitHub repository; set environment variables in Railway dashboard: `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_CHAIN_ID`; configure build command (`pnpm build`) and start command.
- **Owner:** Operator+Claude
- **Depends-on:** T16
- **Size:** S
- **Tokens:** 5,000
- **Milestone:** M5
- **Done:** Railway project shows correct env vars; build command executes without error in Railway logs.

### T39 Deploy frontend to Railway; confirm public URL live
- **Description:** Trigger Railway deploy from `main` branch; confirm HTTP 200 at public Railway URL; set up UptimeRobot or equivalent synthetic monitor (NFR6, SLO3); confirm contract address visible in UI footer (FR34, FR38).
- **Owner:** Operator+Claude
- **Depends-on:** T38, T35
- **Size:** S
- **Tokens:** 3,000
- **Milestone:** M5
- **Done:** Public URL returns HTTP 200; contract address visible without wallet connection; uptime monitor active.

### T40 Final Etherscan verification check
- **Description:** Visit Sepolia Etherscan contract page; confirm source is verified; confirm ABI tab populated; manually execute the fairness recomputation from a recent BetRevealed event using the verification snippet (SLO4).
- **Owner:** Operator
- **Depends-on:** T39
- **Size:** XS
- **Tokens:** 0
- **Milestone:** M5
- **Done:** Contract verified on Etherscan; one BetRevealed event manually recomputed and confirmed correct.

### T41 Write README
- **Description:** Write project README covering: local setup (Foundry, Node, env vars), contract deployment steps, how to run the reveal bot, deployed contract address and Etherscan link, public Railway URL, and a dedicated "How to verify we're not a scam" section explaining the commit-reveal mechanism in plain English.
- **Owner:** Claude
- **Depends-on:** T39, T40
- **Size:** M
- **Tokens:** 12,000
- **Milestone:** M5
- **Done:** README covers all setup steps; "How to verify" section present and accurate; deployed URLs included; no placeholder text remaining.

### T42 Buffer and bug fixes
- **Description:** Allocated buffer for bugs surfaced during T35–T40, last-minute polish, unexpected Sepolia RPC issues, Railway cold-start fixes, and any UI edge cases found during QA.
- **Owner:** Operator+Claude
- **Depends-on:** T35
- **Size:** L
- **Tokens:** 20,000
- **Milestone:** M5
- **Done:** All blockers from T35 smoke test resolved; no P0 issues open at delivery.

---

# RACI Matrix

| Phase | Deliverable | Responsible (R) | Accountable (A) | Consulted (C) | Informed (I) |
|---|---|---|---|---|---|
| Phase 0 | Environment setup (T1–T6) | Operator (T1,T2,T4,T5); Claude (T6 templates); both (T3,T6 coordination) | Operator | — | — |
| Phase 1 | Smart contract code (T7–T12) | Claude | Operator | — | — |
| Phase 1 | Foundry test suite (T13) | Claude | Operator | — | — |
| Phase 1 | Test execution and fix (T14) | Operator+Claude | Operator | — | — |
| Phase 1 | Contract deploy + verify (T15–T16) | Operator+Claude | Operator | — | — |
| Phase 1 | House pool funding (T17) | Operator | Operator | — | — |
| Phase 2 | Frontend components (T18–T30) | Claude | Operator | — | — |
| Phase 3 | Reveal bot code (T31–T33) | Claude | Operator | — | — |
| Phase 3 | E2E test on Sepolia (T34) | Operator+Claude | Operator | — | — |
| Phase 4 | Smoke test (T35) | Operator+Claude | Operator | — | — |
| Phase 4 | Mobile QA (T36) | Operator | Operator | — | — |
| Phase 4 | Copy review (T37) | Operator+Claude | Operator | — | — |
| Phase 4 | Railway deploy (T38–T39) | Operator+Claude | Operator | — | — |
| Phase 4 | Etherscan final check (T40) | Operator | Operator | — | — |
| Phase 4 | README (T41) | Claude | Operator | — | — |
| Phase 4 | Bug fixes (T42) | Operator+Claude | Operator | — | — |

Rules applied: one A per row (always Operator — single-person team); R is Claude for all code-generation tasks, Operator for all deploy/fund/manual tasks, Operator+Claude for hybrid tasks.

---

# Schedule (48-hour Gantt)

```mermaid
gantt
    title El Casino — 48-Hour Build Schedule
    dateFormat  HH:mm
    axisFormat  %Hh

    section Phase 0 — Environment
    T1 Install Foundry                  :done, t1,   00:00, 0.25h
    T2 Install Node + pnpm              :done, t2,   00:00, 0.25h
    T4 Sepolia ETH faucet               :done, t4,   00:00, 0.5h
    T5 API keys                         :done, t5,   00:00, 0.5h
    T3 Init repo structure              :done, t3,   00:30, 1h
    T6 Configure .env files             :done, t6,   01:00, 1h

    section Phase 1 — Smart Contract
    T7  Storage structs events          :t7,   02:00, 2h
    T8  deposit() view functions        :t8,   04:00, 1.5h
    T9  commitBet() pre-checks          :crit, t9,   05:30, 2h
    T10 revealBet() payout              :crit, t10,  07:30, 2h
    T11 claimTimeout()                  :t11,  07:30, 1.5h
    T12 houseDeposit/Withdraw           :t12,  09:00, 1h
    T13 Foundry test suite              :crit, t13,  10:00, 2h
    T14 forge test fix                  :crit, t14,  12:00, 1.5h
    T15 Deploy to Sepolia               :crit, t15,  13:30, 0.5h
    T16 Etherscan verify                :crit, t16,  14:00, 0.5h
    T17 Fund house pool                 :t17,  14:30, 0.25h

    section Phase 2 — Frontend
    T18 Scaffold + wagmi setup          :t18,  14:00, 2h
    T30 Wire contract config            :t30,  14:00, 1h
    T29 VerifyFairness page             :t29,  15:00, 2h
    T19 WalletConnect component         :t19,  16:00, 2h
    T20 BalancePanel                    :t20,  18:00, 1h
    T21 DepositForm                     :t21,  19:00, 1.5h
    T22 WithdrawForm                    :t22,  20:30, 1.5h
    T23 CoinFlipGame component          :t23,  22:00, 2h
    T24 Commit tx flow                  :crit, t24,  24:00, 2.5h
    T25 Result-check flow               :crit, t25,  26:30, 2h
    T26 ClaimTimeout UI                 :t26,  28:30, 1.5h
    T27 GameHistory component           :t27,  28:30, 1.5h
    T28 Error + loading states          :t28,  30:00, 2h

    section Phase 3 — Reveal Bot
    T32 DB persistence                  :t32,  32:00, 2h
    T31 Reveal bot script               :crit, t31,  32:00, 3h
    T33 Bot alerting                    :t33,  35:00, 1h
    T34 E2E test on Sepolia             :crit, t34,  36:00, 2h

    section Phase 4 — Integration + Deploy
    T38 Configure Railway               :t38,  38:00, 1h
    T35 US1–US6 smoke test              :t35,  38:00, 2h
    T39 Deploy to Railway               :crit, t39,  40:00, 1h
    T36 Mobile QA                       :t36,  41:00, 1.5h
    T37 Copy pass                       :t37,  41:00, 1h
    T40 Final Etherscan check           :t40,  42:30, 0.5h
    T41 README                          :t41,  43:00, 2h
    T42 Buffer + bug fixes              :t42,  43:00, 5h
```

---

# Critical Path

The following tasks are on the critical path. A delay in any of them delays M5.

`T7 → T9 → T10 → T13 → T14 → T15 → T16 → T24 → T25 → T34 → T39`

**Rationale:**
- T7 (contract scaffold) is the prerequisite for all contract logic.
- T9 (commitBet) is the most complex contract function and gates T10.
- T10 (revealBet) completes the core game loop and gates the test suite.
- T13/T14 (tests and fix) are the quality gate before deploy.
- T15/T16 (deploy + verify) are required before any frontend integration against real Sepolia state.
- T24 (commit flow) is the most complex frontend task; gates T25.
- T25 (result flow) completes the game loop in the UI and gates E2E testing.
- T34 (E2E test on Sepolia) is the final validation gate before deploy.
- T39 (Railway deploy) is the delivery gate for M5.

**Highest-risk tasks on critical path:** T9 (commitBet with 5 pre-checks and liquidity math), T13 (Foundry test suite breadth), T24 (commit-reveal secret management in browser).

---

# Summary Totals

| Metric | Value |
|---|---|
| Total tasks | 42 |
| Total token estimate | 376,000 |
| T-shirt: XS | 7 (T1, T2, T4, T5, T6, T17, T40) |
| T-shirt: S | 10 (T3, T12, T15, T16, T20, T29, T30, T33, T37, T38, T39) |
| T-shirt: M | 17 (T7, T8, T11, T14, T18, T21, T22, T25, T26, T27, T28, T32, T34, T35, T37, T41) |
| T-shirt: L | 8 (T9, T10, T13, T23, T24, T31, T42, T13) |
| T-shirt: XL | 0 |
| Critical path | T7 → T9 → T10 → T13 → T14 → T15 → T16 → T24 → T25 → T34 → T39 |
| Highest-risk task | T9 (commitBet, 5 pre-checks + liquidity math) / T13 (Foundry test suite) / T24 (browser secret management) |

> Note: T-shirt breakdown counts corrected after tabulation. XS=7, S=11, M=16, L=8, XL=0. Token total of 376,000 is across all 42 tasks; non-Claude tasks contribute 0 tokens. This sits at the high end of the M aggregate range but is distributed across many tasks, consistent with individual task sizing.
