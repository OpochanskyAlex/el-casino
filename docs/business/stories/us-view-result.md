---
doc: US
id: US4
project: el-casino
version: 0.1
status: draft
owner: business-analyst
reviewed_by: null
score: null
activities: [gameplay]
refs:
  - {doc: brd, version: 0.1}
updated: 2026-05-31
tags: [project-docs, user-story]
---

# US4: View Game Result

Traces to [[brd|R10]], [[brd|R14]] and [[brd|G2]], [[brd|G3]].

Activity tags: `@gameplay`

## Story

As a **player who has completed a game round**, I want **to see the result of the round and a history of my recent rounds**, so that **I know what happened and can confirm the outcome was fair**.

## Acceptance Criteria

- AC4.1 Immediately after a round resolves on-chain, the UI displays the outcome prominently: win or loss, the bet amount, and the amount won or lost.
- AC4.2 The result display includes the on-chain transaction hash for the outcome transaction, rendered as a clickable link to Sepolia Etherscan.
- AC4.3 The player's casino balance in the UI updates to reflect the new balance within 2 seconds of the transaction being confirmed.
- AC4.4 A game history panel displays at least the last 5 completed rounds for the connected address, showing: round number or timestamp, bet amount, player choice, outcome (win/loss), and payout amount.
- AC4.5 The game history is derived from on-chain events (not off-chain storage); it is populated by reading contract events for the player's address.
- AC4.6 The history panel is visible on the main game page without requiring navigation to a separate page.
- AC4.7 If no rounds have been played, the history panel displays: "No rounds played yet."

## Notes

The game history (AC4.4, AC4.5) is a `[should]` priority requirement (R14). It is listed here as acceptance criteria because it is closely tied to the result display in the same UI area. If deprioritized for MVP, AC4.4–AC4.6 can be deferred.

The on-chain event (R10) must emit at minimum: player address, round ID, player choice, outcome, bet amount, payout amount, and the randomness input(s). The exact event schema is an SRS/architecture concern.

## Open Questions

- Q_US4_1 How many historical rounds should be loaded on page open? Loading all events from genesis is slow; a limit of the last 20 events is suggested. Raise to SA for a concrete filter strategy.
