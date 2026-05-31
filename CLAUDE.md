# CLAUDE.md

This file tells Claude Code how to build and reason about this project. Read it fully before writing code.

---

## 1. What we are building

A **provably-fair casino web app on the Ethereum Sepolia testnet**. It is an MVP, scoped for ~48 hours of work, built with heavy LLM assistance.

The initial task is below. If in any ambiguity, refer to this text as a source of truth.
I pre-selected Ethereum with Sepolia testnet as a network for this assigment.

**Task**

Build a casino on **Solana or Ethereum — your choice; both options are equally valid**. The user must be able to:

1. Connect a wallet (Phantom, MetaMask — whatever fits the chosen network)
2. Deposit test tokens into the casino
3. Play a game and win or lose tokens
4. Withdraw the balance back to their wallet

The casino logic must be **verifiable on-chain** — a paranoid player using a block explorer should be able to confirm it’s not a scam. *How* you achieve this is up to you.

**Constraints**

- **Testnet only** — Solana devnet or an Ethereum testnet (Sepolia / Holesky, etc.). No real money.
- Deployed to a public URL (Vercel / Cloudflare / Netlify / anything)
- The casino has an edge — this is a casino, not a charity
- Any frontend stack you like
- **We want the product to be as polished as you can make it in 48 hours** — UX, visuals, copy, error states, everything. Build it like you’re releasing tomorrow.



---

## 2. Who the operator is (important — read this)

The human running you (the operator) is:

- A **product manager / business analyst** with strong product instincts, moderate system-design and CI/CD knowledge.
- A **Python** developer by background.
- **Near-zero experience with smart contracts, Solidity, or the EVM.**

**Therefore, when you work:**

- **Explain every smart-contract decision in plain language.** Assume the operator has never seen Solidity. When you write a contract, add comments and follow up with a short "what this does and why" summary.
- **Prefer boring, well-trodden patterns** over clever ones. Use battle-tested libraries (OpenZeppelin) instead of hand-rolling token logic.
- **Never assume the operator can spot a Solidity bug.** Tests and on-chain verification are how we build trust, not code review.
- When you hit a fork in the road, **state the options, recommend one, and explain the tradeoff in one or two sentences** — then proceed unless it's high-stakes (money math, randomness, access control), in which case pause and confirm.
- Translate to concepts the operator knows: "deposit/withdraw is just a `mapping(address => uint)` ledger — think of it like a Python dict the contract keeps." "An event is basically a structured log line, like `logger.info(...)`, that the explorer and frontend can read."

---


## 3. Repository structure

```
/contracts/                     # Foundry project (Solidity smart contracts)
  /src/                         # Contract source files (to be created)
/web/                           # Next.js frontend (to be created)
/docs/
  el-casino.md                  # Project overview (Obsidian hub)
  _meta/
    changelog.md                # Doc changelog
    state.yaml                  # Doc pipeline state
  business/
    brd.md                      # Business Requirements Document
    stories/
      us-connect-wallet.md
      us-deposit.md
      us-place-bet.md
      us-verify-fairness.md
      us-view-result.md
      us-withdraw.md
    reviews/                    # BA review artefacts
  system/
    srs.md                      # System Requirements Specification
    use-case-diagram.puml       # PlantUML use-case diagram
    cases/
      uc-claim-timeout.md
      uc-commit-bet.md
      uc-connect-wallet.md
      uc-deposit.md
      uc-reveal-bet.md
      uc-verify-fairness.md
      uc-view-history.md
      uc-withdraw.md
    reviews/                    # SA review artefacts
  architecture/
    overview.md                 # Architecture overview
    adrs/
      adr-001-single-contract.md
      adr-002-commit-reveal.md  # Commit-reveal randomness scheme
      adr-003-frontend-stack.md
      adr-004-payout-math.md
      adr-005-deployment.md
    diagrams/
      c4-context.mmd            # C4 context diagram (Mermaid)
      commit-reveal-sequence.mmd
    reviews/                    # Arch review artefacts
  project/
    plan.md                     # WBS + milestones
    risks.md                    # Risk register
    reviews/                    # PM review artefacts
/CLAUDE.md
/README.md                      # Human-facing setup + on-chain verification guide
```

### Key design decisions (from ADRs)

- **Randomness**: Commit-reveal scheme (ADR-002). Player commits a hashed secret, reveals after the block is mined; outcome = `hash(playerSecret, blockHash)`. No VRF dependency, no oracle cost. Documented honestly in the UI.
- **Contract**: Single `CasinoGame.sol` (ADR-001). Holds ETH balances, runs coin-flip logic with a 2 % house edge (ADR-004).
- **Frontend**: Next.js 14 + wagmi/viem + Tailwind (ADR-003).
- **Deployment**: Vercel (frontend) + Foundry deploy script to Sepolia (ADR-005).


## 4. Definition of done

- Public Vercel URL works end-to-end: connect → faucet → deposit → play (win and lose both observed) → withdraw, back in the wallet.
- All contracts verified on Sepolia Etherscan and linked from the app.
- Randomness is provably fair (VRF) or honestly disclosed (fallback).
- Code and contract covered with tests as possible for MVP.
- House edge is real, correct, and stated plainly in the UI.
- Clear error and loading states everywhere; no dead-ends or silent failures.
- README explains setup and, for a skeptic, exactly how to verify the casino on-chain.
