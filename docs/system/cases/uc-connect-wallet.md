---
doc: UC
id: UC1
project: el-casino
version: 0.1
status: draft
owner: system-analyst
activities: [wallet]
refs:
  - {doc: brd, version: 0.1}
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, use-case]
---

# UC1: Connect Wallet

**Actor:** Player
**Preconditions:**
- Player has a desktop browser with the MetaMask extension installed.
- Player navigates to the El Casino public URL.
- No wallet is currently connected in the app session.

**Postconditions (success):**
- App displays the player's Sepolia address (truncated) in the header.
- App has confirmed chain ID = `0xaa36a7` (Sepolia).
- Deposit and gameplay actions become enabled.

**Postconditions (failure/rejection):**
- App remains in disconnected state; no wallet state stored.

---

## Main Flow

1. Player opens the El Casino app; the landing page shows a "Connect Wallet" button.
2. Player clicks "Connect Wallet".
3. Frontend calls `window.ethereum.request({ method: 'eth_requestAccounts' })`.
4. MetaMask extension displays its account-selection prompt.
5. Player selects an account and approves.
6. Frontend receives the account address array; stores `accounts[0]`.
7. Frontend calls `eth_chainId`; receives chain ID.
8. Chain ID equals `0xaa36a7`; no network switch needed.
9. Frontend displays truncated address (e.g., `0xABCD…1234`) and enables wallet-dependent UI.
10. Frontend subscribes to MetaMask `accountsChanged` and `chainChanged` events for subsequent updates.

---

## Alternative Flows

**A1 — Wrong network detected (step 8 fails)**
1. Chain ID is not `0xaa36a7`.
2. Frontend displays "Wrong network. Please switch to Sepolia testnet." prompt.
3. Player clicks "Switch to Sepolia".
4. Frontend calls `wallet_switchEthereumChain` with `chainId: '0xaa36a7'`.
5. MetaMask confirms the switch.
6. `chainChanged` event fires; frontend re-reads chain ID.
7. Resume main flow from step 8.

**A2 — Player rejects connection prompt (step 5)**
1. Player clicks "Reject" in MetaMask prompt.
2. MetaMask returns EIP-1193 error code 4001.
3. Frontend catches the error and returns to disconnected state.
4. No error crash; no persisted state change.

**A3 — Account change while connected**
1. Player switches account inside MetaMask.
2. `accountsChanged` event fires with new account array.
3. Frontend updates stored address to `accounts[0]` (or to disconnected state if array is empty).
4. Casino balance is re-read for the new address.

---

## Error Flows

**E1 — MetaMask not installed**
1. Player clicks "Connect Wallet".
2. `window.ethereum` is undefined.
3. Frontend displays: "MetaMask not found. Please install MetaMask to play." with a link to `https://metamask.io`.
4. No further action taken.

**E2 — Network switch rejected**
1. Player is on wrong network; clicks "Switch to Sepolia".
2. MetaMask returns an error (user rejected or network not found).
3. Frontend remains on the wrong-network prompt; displays "Network switch failed. Please switch manually in MetaMask."

---

## Traces

FR1, FR2, FR3, FR4, FR5 <- R1, R2, R11, R12, US1
