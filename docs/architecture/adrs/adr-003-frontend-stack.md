---
doc: ADR
id: ADR-003
project: el-casino
version: 0.1
status: accepted
owner: architect
refs:
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, adr]
---

# ADR-003: Frontend Stack — Next.js + wagmi/viem

## Status

Accepted

## Context

The frontend must connect MetaMask, read contract state reactively, submit transactions, display loading and error states for every async operation, and show game history derived from on-chain events (FR1–FR37). The BRD requires production-quality UX (G3) in a 48-hour build window (C7). The operator is a Python developer with no Solidity experience; the frontend stack should be familiar enough to avoid blocking on JavaScript ecosystem issues.

## Options Considered

- **Option A: Next.js 14 + wagmi v2 + viem** — React framework with file-based routing; wagmi provides typed React hooks for contract reads (`useReadContract`), writes (`useWriteContract`), MetaMask connection (`useConnect`), and transaction confirmation (`useWaitForTransactionReceipt`); viem is the low-level Ethereum client underlying wagmi.
- **Option B: React (Vite/CRA) + ethers.js directly** — Plain React SPA with ethers.js for all Ethereum interactions. Manual state management for loading/error states.
- **Option C: Vanilla JS + ethers.js** — No framework. Maximum control; minimum dependencies.

## Decision

Option A: Next.js + wagmi/viem.

wagmi's hook-based API maps directly to the FR requirements: `useReadContract` covers FR10 (balance display), `useWriteContract` + `useWaitForTransactionReceipt` covers FR36 (loading states), `useWatchContractEvent` covers FR25 (game history from events) and FR19 (watching for `BetRevealed`). The typed contract bindings generated from the ABI catch signature mismatches at compile time, reducing the chance of undetected integration bugs — important given the operator cannot debug Solidity.

Next.js adds SSR/SSG capability and a natural routing structure for the "How to Verify" page (FR32). Railway deploys Next.js natively.

Option B (ethers.js directly) would require hand-rolling all the loading/error state management that wagmi provides out of the box. Given FR36 and FR37 require specific loading and error states for every async operation, this would consume a disproportionate fraction of the 48-hour build window. Option C is eliminated for the same reason, compounded by having no component model for UI state.

## Consequences

**Positive:**
- wagmi hooks handle MetaMask connection, chain detection, transaction lifecycle, and event subscriptions natively — all of FR1–FR5 and FR36–FR37 have first-class hook support.
- Typed ABI bindings via viem prevent silent argument ordering mistakes in contract calls.
- Next.js file router makes the "How to Verify" page (FR32) a simple additional route with no routing library needed.
- Railway's Next.js support means `git push` to deploy with no custom build configuration.
- Large ecosystem: error messages, wagmi error types, and MetaMask rejection codes (e.g., 4001) are well-documented.

**Negative / Trade-offs:**
- Slightly larger bundle than a vanilla JS approach; acceptable for a web app targeting desktop and mobile browsers.
- wagmi v2 / viem API differs significantly from wagmi v1 and ethers.js v5 — documentation searching must use version-specific sources.
- Next.js server components and wagmi's client-side hooks require explicit `'use client'` boundaries; this is a minor gotcha for an operator unfamiliar with React.

**NFRs addressed:** NFR1 (reactive reads, no polling), NFR2 (tx confirmation via `useWaitForTransactionReceipt`), NFR3 (no private keys in Next.js code), NFR10 (Tailwind CSS responsive layout)
