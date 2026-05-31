---
doc: ADR
id: ADR-005
project: el-casino
version: 0.1
status: accepted
owner: architect
refs:
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, adr]
---

# ADR-005: Deployment Pipeline — Foundry + Railway + Etherscan Verify

## Status

Accepted

## Context

The system requires deploying a Solidity contract to Sepolia with verified source code on Etherscan (BRD C3, NFR9) and a public frontend URL (BRD C2, NFR6). The operator is a Python developer with near-zero Solidity and JavaScript ecosystem experience (BRD C6). The pipeline must be simple enough to run successfully in the 48-hour window without deep familiarity with EVM tooling. It must also avoid committing private keys (NFR3).

## Options Considered

- **Option A: Foundry (`forge`) for contract + Railway for frontend + Etherscan auto-verify** — Foundry is a Rust-based Solidity toolchain with a simple CLI. `forge script` handles deploy and Etherscan verification in a single command. Railway deploys Next.js via GitHub integration (`git push` to deploy). Etherscan verification uses `forge verify-contract` or the `--verify` flag on the deploy script.
- **Option B: Hardhat for contract + Vercel for frontend** — Hardhat is a JavaScript-based Solidity toolchain. Familiar to JS developers; requires Node.js and npm setup. Vercel is a popular Next.js host with excellent Next.js support.
- **Option C: Manual deploy (Remix IDE + Vercel/Netlify drag-and-drop)** — Use the Remix browser IDE for contract deploy. Upload built frontend manually.

## Decision

Option A: Foundry + Railway + Etherscan auto-verify.

**Foundry over Hardhat:** The operator's primary language is Python. Hardhat's configuration and scripting are JavaScript/TypeScript; debugging Hardhat issues requires comfort with the npm ecosystem. Foundry's CLI (`forge build`, `forge test`, `forge script`) is more analogous to a Python CLI tool (`pytest`, `pip`). The deploy command (`forge script ... --broadcast --verify`) is a single line that handles compile, deploy, and verify in sequence. For an operator who has never written JavaScript build tooling, Foundry's simplicity is the decisive factor.

Foundry also includes a fast Solidity test runner with native assertions (`assertEq`, `assertRevert`), which matters for NFR11 (80% contract test coverage). Hardhat requires Chai + Mocha or vitest for equivalent test ergonomics.

**Railway over Vercel:** Railway supports Next.js natively and deploys via GitHub push, same as Vercel. The BRD references Railway (C2: "Railways or equivalent") as the expected host. Both are equivalent for this use case; Railway is chosen to match the BRD's stated preference and to avoid any Vercel account setup that may not already exist.

**Etherscan verification via `--verify` flag:** Foundry's deploy script accepts `--verify` and calls the Etherscan API automatically post-deploy. This satisfies NFR9 with no manual copy-paste of contract source. Requires `ETHERSCAN_API_KEY` in the deploy environment (not committed; passed as an env var to the deploy command).

Option C is eliminated: Remix cannot be easily scripted for repeatable deploys, and manual frontend uploads are incompatible with a CI/CD mindset even for MVP.

## Consequences

**Positive:**
- Single `forge script` command deploys and verifies the contract; no multi-step manual process.
- `forge test` runs the full Foundry test suite locally with no additional tooling; equivalent to `python -m pytest`.
- Railway GitHub integration means frontend deploys on every push to `main`; no manual intervention after initial setup.
- No private keys committed: `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, and `ETHERSCAN_API_KEY` are environment variables for the deploy command only.
- Foundry's gas reports (`forge test --gas-report`) surface gas estimates for all contract functions before deploy.

**Negative / Trade-offs:**
- Operator must install Foundry CLI (`curl -L https://foundry.paradigm.xyz | bash`) — a one-time setup step. Documented in README.
- Foundry test files are written in Solidity (`.t.sol`), not Python or JavaScript. Operator cannot write tests without learning Solidity test syntax. Mitigation: tests are pre-written as part of the build; operator runs them but does not need to author them.
- If the Etherscan API is temporarily down at deploy time, `--verify` may fail. Mitigation: `forge verify-contract` can be rerun independently with the deployed address.
- Railway free tier has sleep-on-inactivity behavior; ensure the plan level avoids this during the 48-hour evaluation window (NFR6 requires >= 99% uptime).

**NFRs addressed:** NFR3 (no private keys in frontend or committed config), NFR6 (Railway managed hosting), NFR9 (Etherscan auto-verify via `forge`), NFR11 (Foundry test runner for 80% contract coverage)
