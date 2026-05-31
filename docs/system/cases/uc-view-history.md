---
doc: UC
id: UC7
project: el-casino
version: 0.1
status: draft
owner: system-analyst
activities: [gameplay]
refs:
  - {doc: brd, version: 0.1}
  - {doc: srs, version: 0.1}
updated: 2026-05-31
tags: [project-docs, use-case]
---

# UC7: View Game History

**Actor:** Player
**Preconditions:**
- Wallet connected and on Sepolia (UC1 complete).
- At least one completed (Win or Loss) bet exists for the player.

**Postconditions:**
- Game history panel on the main page displays up to the last 5 completed rounds (or up to 20 loaded).
- Each row shows: round ID, bet amount, player choice, outcome, payout, and a link to the reveal transaction on Etherscan.

---

## Main Flow

1. Player is on the main game page with their wallet connected.
2. Frontend issues an `eth_getLogs` request filtered by:
   - Contract address
   - Event topic = `keccak256("BetRevealed(uint256,address,uint8,uint8,uint256,uint256,bytes32,bytes32)")`
   - Indexed topic = `player address`
   - Block range = `[latest - 10000, latest]`
3. Frontend receives up to 20 most recent `BetRevealed` events for the player.
4. Frontend renders a history panel with one row per event, sorted descending by block number.
5. Each row displays: Round ID (`betId`), Bet amount (ETH), Choice (Heads/Tails), Outcome (Win/Loss), Payout (ETH or "0"), Etherscan link (transaction hash).
6. History panel is visible on the main page without additional navigation.

---

## Alternative Flows

**A1 — Fewer than 5 completed rounds**
1. Fewer than 5 `BetRevealed` events found.
2. All available rounds are shown; no placeholder rows.

**A2 — Automatic update after new round resolves**
1. Frontend subscribes to `BetRevealed` events for the player.
2. When a new event arrives, prepend the new row to the history panel.
3. If the history already has 20 rows, remove the oldest row.

---

## Error Flows

**E1 — No rounds played yet**
1. `eth_getLogs` returns an empty array.
2. Frontend displays in the history panel: "No rounds played yet."

**E2 — RPC timeout / log query fails**
1. `eth_getLogs` call fails or times out.
2. Frontend shows: "Could not load game history. Check your connection." History panel shows the error inline.

---

## Edge Cases

- **EC1 — Block range limit:** Requesting events from genesis to tip on a public RPC can be slow or rejected. The 10 000-block cap limits to approximately the last 33 hours of Sepolia blocks, sufficient for a continuous evaluation session.
- **EC2 — BetRefunded events:** Refunded bets (UC5) are not included in the history panel because no `BetRevealed` event was emitted. If desired, `BetRefunded` events could be shown in a separate "Refunds" section; this is deferred to post-MVP.

---

## Traces

FR25, FR26, FR27 <- R10, R14, US4
