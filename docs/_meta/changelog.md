# Changelog

## 2026-05-31T00:00Z | orchestrator | _meta/state.yaml, _meta/changelog.md
Workflow initialized. doc-from-idea, full run, stages: [ba, sa, arch]. PM excluded.

## 2026-05-31T00:10Z | business-analyst | el-casino.md, brd.md, us-connect-wallet.md, us-deposit.md, us-place-bet.md, us-view-result.md, us-withdraw.md, us-verify-fairness.md
v0.1. Created project overview, BRD with goals/stakeholders/requirements, 6 user stories.

## 2026-05-31T00:20Z | business-analyst-reviewer | reviews/brd-v0.1-20260531T0020Z.md, _meta/state.yaml, _meta/changelog.md
Review of brd v0.1. Score: 7.9. Verdict: needs-revision. 2 major findings (F6 missing player-reclaim-timeout AC; F7 R17 contradicts resolved scope), 7 minor findings including stale open questions (F3–F5, F8), broken block anchors (F1), stale overview questions (F2), AC wording gaps (F9–F11). Stage set to ba-revise.

## 2026-05-31T00:30Z | business-analyst | brd.md, us-place-bet.md, us-deposit.md, us-withdraw.md, us-verify-fairness.md, us-connect-wallet.md, us-view-result.md, el-casino.md, _meta/state.yaml
Revision addressing F1–F11 from review brd-v0.1-20260531T0020Z. Incorporated operator manual edits: R19 capped at 2 (not 20), R21 added (portfolio liquidity check), C1/C2 text updates. Annotated R17 as deferred-post-MVP. Fixed: F1 (block-anchor → plain wiki-links all 6 story files); F2 (el-casino.md open questions replaced with resolved notice); F3 (us-deposit Q_US2_1/Q_US2_2 closed, AC2.11 added); F4 (us-withdraw Q_US5_1 closed, AC5.10 added); F5 (us-verify-fairness Q_US6_1 closed, AC6.3/AC6.4 confirmed); F6 (us-place-bet AC3.16 pending-reveal UI state, AC3.17 player reclaim on liveness failure, Q_US3_2 closed); F7 (R17 annotated deferred-post-MVP per Q3); F8 (U2/U5 uncertainty register updated to resolved); F9 (AC5.8 contact-support → Etherscan link); F10 (AC3.7 made testable); F11 (AC3.2 includes resolved bet limits). R21 AC3.15 added. US3 index line updated R19/R20/R21.

## 2026-05-31T00:35Z | business-analyst-reviewer | reviews/brd-v0.1-20260531T0030Z.md, _meta/state.yaml, _meta/changelog.md
Re-review of brd v0.1 (Revision 1). Score: 8.8. Verdict: approved. All F1–F11 from previous review resolved. 4 new findings: F15 minor (YAML frontmatter malformation in us-connect-wallet.md), F16 nit (inline [must] tag in AC3.17), F17 nit (safety-factor arithmetic undefined at business level), F18 nit (Q_US6_2 missing recommended default). No blockers. Stage advanced to sa. versions.brd: 0.1 confirmed.

## 2026-05-31T01:00Z | system-analyst | system/srs.md, system/cases/uc-connect-wallet.md, system/cases/uc-deposit.md, system/cases/uc-commit-bet.md, system/cases/uc-reveal-bet.md, system/cases/uc-claim-timeout.md, system/cases/uc-withdraw.md, system/cases/uc-view-history.md, system/cases/uc-verify-fairness.md, system/use-case-diagram.puml, _meta/state.yaml, _meta/changelog.md
v0.1. Created SRS with 38 FRs, 11 NFRs, 9 BRs, 3 DMs, full API contracts section, 8 UC files, PlantUML use-case diagram. State machines for Bet lifecycle, Player balance lifecycle, Contract liquidity lifecycle. 7 open questions raised (Q1–Q7). Stage set to sa-review. SA readiness: Partially Ready.

## 2026-05-31T01:10Z | system-analyst | srs.md, uc-commit-bet.md, uc-reveal-bet.md, uc-deposit.md, use-case-diagram.puml
Revision addressing F1–F9 from srs-v0.1-20260531T0040Z. Fixed commitBet non-payable (F1), portfolio liquidity formula (F2), Q3/Q4/Q6 resolved (F3), commitHash preimage simplified (F4), minor F5–F9.

## 2026-05-31T01:15Z | system-analyst-reviewer | system/reviews/srs-v0.1-20260531T0110Z.md, _meta/state.yaml, _meta/changelog.md
Re-review of srs v0.1 (Revision 1). Score: 8.0. Verdict: approved. F1–F9 all resolved (F10 partially-fixed: blockhash zero-hash decision documented but not numbered). 2 new findings: F15 minor (houseWithdraw pre-check subtraction form; recommend rewrite as addition), F16 nit (UC7 postcondition mixes display/load limits). No blockers. Stage advanced to arch. versions.srs: 0.1 confirmed. Q8 added to open questions (UC4 blockhash zero-hash handling, architect to decide).

## 2026-05-31T02:00Z | architect | overview.md, adr-001 through adr-005, c4-context.mmd, commit-reveal-sequence.mmd
v0.1. Created architecture overview with C4 diagrams, NFR mapping, security posture, observability. 5 ADRs. Resolved SA open questions Q1/Q2/Q5/Q8/F15.

## 2026-05-31T02:20Z | architect-reviewer | architecture/reviews/arch-v0.1-20260531T0200Z.md, _meta/state.yaml, _meta/changelog.md
Review of architecture v0.1. Score: 8.3. Verdict: approved. 2 major findings (F1: reveal bot section documented rejected approach; F2: Q7 not closed). Fixed by orchestrator: reveal bot section updated to DB persistence (F1), Q7/ARCH-Q1 resolved in Open Questions table (F2). Stage: done. versions.arch: 0.1 confirmed.

## 2026-05-31T03:00Z | project-manager | project/plan.md, project/risks.md
v0.1. Created WBS with 42 tasks across 5 milestones and 5 phases. Dual sizing (T-shirt + tokens). RACI, Gantt, critical path. Risk register with 15 risks across 5 categories. Heat map included.
