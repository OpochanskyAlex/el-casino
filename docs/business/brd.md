---
doc: BRD
project: el-casino
version: 0.1
status: draft
owner: business-analyst
reviewed_by: null
score: null
activities: [wallet, deposit, gameplay, withdraw, fairness-audit, General]
refs: []
updated: 2026-05-31
tags: [project-docs, brd]
---

# Context

El Casino is a browser-based casino MVP on the Ethereum Sepolia testnet. It exists to demonstrate a fully playable, provably-fair casino dApp built in approximately 48 hours. Players use MetaMask to connect, deposit testnet ETH, play a house-edged game, and withdraw. The defining constraint is that any skeptical player must be able to use a public block explorer to confirm the game outcome was not manipulated.

# Goals

- G1 Deliver an end-to-end playable casino flow (connect → deposit → play → withdraw) on Sepolia testnet, reachable at a public URL, within the 48-hour build window.
- G2 [assumption] Demonstrate verifiable on-chain fairness such that a technically-minded player can confirm game outcomes were not manipulated without trusting the operator. <- CLAUDE.md task statement
- G3 [assumption] Present production-quality UX — clear error states, loading states, and no dead ends — so the product reads as "release-ready" rather than a prototype. <- CLAUDE.md task statement
- G4 The house retains a real, stated edge in every game round. <- CLAUDE.md constraint "the casino has an edge"

# Stakeholders

- SH1 Player — can connect MetaMask wallet on Sepolia, deposit testnet ETH, play a game, and withdraw balance; primary concern is trust (not losing funds to manipulation) and UX clarity.
- SH2 Operator / House — the deploying account that receives the house edge and can manage contract liquidity; primary concern is correct edge calculation and contract security.
- SH3 On-chain Verifier / Skeptic — any third party who inspects the deployed contract and transaction history on Sepolia Etherscan; primary concern is that the randomness and payout logic are transparent and match the stated rules.
- SH4 Evaluator — the person assessing the assignment submission; primary concern is completeness, polish, and on-chain verifiability per the task brief.

# Constraints

- C1 Sepolia testnet only. No real ETH may be used for tasting. Before deploying to the main network, product will be modified.
- C2 Must be deployed to a public URL (Railways or equivalent) and functional end-to-end by delivery.
- C3 Smart contracts must be verified on Sepolia Etherscan (source code published, ABI readable).
- C4 The house edge must be a real, non-zero value and stated plainly in the UI.
- C5 The randomness mechanism must be either verifiably fair (e.g., Chainlink VRF) or honestly disclosed as a fallback with the limitation explained to the player in the UI.
- C6 Operator has near-zero Solidity/EVM experience; implementation must use well-audited patterns (OpenZeppelin where applicable) and require no manual contract debugging.
- C7 MVP timeline is approximately 48 hours; scope must remain achievable within that window.

# Business Requirements

- R1 [must] @wallet A player must be able to connect their MetaMask wallet to the app; the app detects the active account address and Sepolia network. <- G1, G3
- R2 [must] @wallet The app must detect when the player is on the wrong network and prompt them to switch to Sepolia. <- G1, G3
- R3 [must] @deposit A player must be able to deposit a chosen amount of testnet ETH from their wallet into the casino contract; the deposit is reflected in their on-casino balance within 1 block confirmation. <- G1
- R4 [must] @deposit The player's current casino balance (deposited ETH held by the contract) must be visible at all times while connected. <- G1, G3
- R5 [must] @gameplay A player must be able to place a bet in testnet ETH against the house and receive a win or loss outcome on-chain. <- G1, G4
- R6 [must] @gameplay The game outcome must be determined by a mechanism that does not allow the operator or the player to predict or manipulate the result before commitment. <- G2, G4
- R7 [must] @gameplay The house edge must be applied to every game round at a fixed, stated percentage; the player's payout on win must be strictly less than 2× the bet to reflect the edge. <- G4
- R8 [must] @gameplay The UI must display the house edge percentage plainly before the player places a bet. <- G3, G4
- R9 [must] @withdraw A player must be able to withdraw any portion of their casino balance back to their wallet; funds arrive in the wallet within 1 block confirmation. <- G1
- R10 [must] @fairness-audit Each game round must emit an on-chain event (or store verifiable state) containing all inputs needed for an independent third party to recompute the outcome from public blockchain data alone. <- G2
- R11 [must] @General The app must display a clear error state for every failure mode: wallet not installed, wrong network, insufficient balance, transaction rejected, transaction reverted. <- G3
- R12 [must] @General The app must display a loading/pending state for every async operation (wallet connect, deposit, play, withdraw) that lasts until the transaction is confirmed or fails. <- G3
- R13 [should] @deposit The UI must surface a link to a Sepolia ETH faucet so players with zero testnet ETH can self-serve. <- G3
- R14 [should] @gameplay The player must be able to view a history of their recent game rounds (at minimum the last 5) including bet size, outcome, and payout. <- G3
- R15 [should] @fairness-audit The app must include a dedicated "How to verify" section or page that explains, in plain language, how to confirm fairness using Sepolia Etherscan and the contract ABI. <- G2, G3
- R16 [should] @General The deployed contract address and a direct Sepolia Etherscan link must be visible in the app UI. <- G2, G3
- R17 [could][deferred-post-MVP per Q3] @gameplay Multiple game types (e.g., dice) may be offered after MVP; coin flip is the only game in this release. <- G3
- R18 [could] @General The app is responsive and usable on a mobile browser. <- G3
- R19 [must] @gameplay A player may have at most 2 unresolved bets (committed but not yet revealed) at any time; the contract and UI must reject new bets that would exceed this limit. <- G4, G3
- R20 [must] @gameplay Before accepting a bet, the contract must verify that house liquidity is sufficient to cover the maximum potential payout (1.96 × bet amount) from this bet; bets that exceed available liquidity are rejected. <- G4, G3
- R21 [must] @gameplay Before accepting a bet, the contract must verify that house liquidity is sufficient to cover potential payout from unresolved bets, assuming winrate with safety factor 10%; bets that exceed available liquidity are rejected. <- G4, G3

# User Stories

List only. Full stories in `/docs/business/stories/`.

- [[us-connect-wallet|US1 Connect wallet]] <- R1, R2, R11, R12, @wallet
- [[us-deposit|US2 Deposit funds]] <- R3, R4, R11, R12, R13, @deposit
- [[us-place-bet|US3 Place a bet and play]] <- R5, R6, R7, R8, R11, R12, R19, R20, R21, @gameplay
- [[us-view-result|US4 View game result]] <- R10, R14, @gameplay
- [[us-withdraw|US5 Withdraw balance]] <- R9, R11, R12, @withdraw
- [[us-verify-fairness|US6 Verify fairness on-chain]] <- R10, R15, R16, @fairness-audit

# Glossary

- **Casino balance** — the amount of testnet ETH held on behalf of a player by the casino smart contract; distinct from the player's MetaMask wallet balance.
- **House edge** — the fixed percentage of each bet retained by the casino regardless of outcome; e.g., a 2% edge on a coin flip means a winning bet returns 1.96× the bet amount rather than 2×.
- **Provably fair** — a property of a game where the outcome determination algorithm and all its inputs are publicly recorded on-chain such that any observer can independently verify the result.
- **Commit-reveal** — a two-transaction randomness pattern where a secret is committed (hashed) before the bet and revealed after; prevents operator manipulation but requires the operator to participate in each round.
- **VRF (Verifiable Random Function)** — a cryptographic primitive (Chainlink VRF on Ethereum) that produces a random value with a cryptographic proof of correctness, verifiable on-chain without trusting the operator.
- **Sepolia** — the Ethereum proof-of-stake testnet used for this project; ETH on Sepolia has no real-world monetary value.
- **Etherscan** — the block explorer for Ethereum and its testnets; used by SH3 to read contract source, ABI, and transaction events.
- **MetaMask** — the browser wallet extension used by players to sign transactions and interact with the Sepolia network.
- **House liquidity** — testnet ETH held by the casino contract to pay out player winnings; must exceed the maximum possible payout at all times the contract accepts bets.

# Uncertainty Register

| ID | Type | Item | Impact-if-false | Validation plan |
|---|---|---|---|---|
| U1 | assumption | G2 — commit-reveal or VRF is sufficient to satisfy "verifiable on-chain" for the evaluator | Randomness mechanism may be judged inadequate; G2 not met | Confirm with operator before SA stage; consult CLAUDE.md task wording |
| U2 | hypothesis | R6 — Chainlink VRF is feasible within 48-hour build (LINK funding, contract integration) | VRF may be too complex; fallback to commit-reveal needed | Resolved: commit-reveal chosen per Q1. |
| U3 | assumption | R17 — a single game type is sufficient for MVP polish | Evaluator may expect variety; G3 partially unmet | Confirm scope with operator; default to single game if uncertain |
| U4 | assumption | G3 — "polished" means no dead ends and all error/loading states covered | App feels unfinished; G3 not met | Define concrete UX checklist in SRS; measurable at QA |
| U5 | hypothesis | R7 — house edge percentage (assumed 2%) is accepted as "real" by evaluator | Edge deemed trivial or incorrect | Resolved: 2% house edge confirmed per Q2. |

# Open Questions

- ~~Q1 Randomness mechanism~~ **RESOLVED:** Commit-reveal pattern. VRF deferred as production upgrade path.
- ~~Q2 House edge percentage~~ **RESOLVED:** 2%. May be updated before contract deployment; parameterizable in contract.
- ~~Q3 Game type~~ **RESOLVED:** Coin flip only for MVP.
- ~~Q4 Bet limits~~ **RESOLVED:** Minimum 0.001 ETH, maximum 0.1 ETH. Initial house pool 10 ETH. At these limits, 99th-percentile variance leaves pool solvent.
- ~~Q5 Faucet integration~~ **RESOLVED:** External link only (R13). Wallet connection requirement (R1) is satisfied separately.
- ~~Q6 House liquidity funding~~ **RESOLVED:** 10 ETH initial pool assumed (testnet: free from faucet; production: operator funds). Documented as deployment prerequisite.

# Out of Scope

- Real ETH or any mainnet deployment.
- User accounts, login, email, or any off-chain identity.
- Fiat on-ramp or any real payment method.
- Regulatory compliance (KYC, AML, gambling licenses).
- Multiplayer or social features.
- Token standards other than native testnet ETH (no ERC-20 tokens in MVP).
- Mobile native app (web browser only).
- Admin dashboard beyond the operator deploying and funding the contract directly.
- Profit/loss analytics beyond per-round history.
