/**
 * Demo sample inputs and example outputs (no API required).
 * Used by "Load sample" and when Generate is run on matching input.
 */
/** Global for app.js (classic script, no bundler). */
var DEMO_SAMPLES = {
  "draft-sop": {
    input: `Process: Weekly warehouse inventory reconciliation (Site B)

Trigger: Every Monday 05:30 local, or after any emergency recount request from Finance.

Steps (rough):
- Close receiving dock scanners to "cycle count" mode
- Print bin-level count sheets from WMS (filter: high-variance SKUs last 30 days)
- Two-person count per aisle; second person verifies discrepancies > 5 units
- Enter counts in WMS tablet app; sync must complete before 08:00
- Ops lead compares WMS vs ERP (NetSuite); variances > 2% of line value → open INC ticket
- Email summary to warehouse@company.com and #ops-handoff Slack

Roles: Shift lead (owns start/stop), Floor associate (count), Inventory analyst (ERP reconcile).

Escalate to Regional Ops Manager if variance > $10k or same SKU misses 2 weeks in a row.`,
    output: `STANDARD OPERATING PROCEDURE (DRAFT)
Document ID: WH-INV-REC-001 · Site B
Status: DRAFT — Requires human review

────────────────────────────────────────
1. PURPOSE
   Establish a repeatable weekly process to reconcile physical warehouse
   inventory (WMS) with financial records (ERP), identify material variances,
   and escalate exceptions before the business day handoff.

2. SCOPE
   • Location: Warehouse Site B — all active pick aisles and receiving hold zone
   • Systems: WMS (count entry), ERP NetSuite (financial reconcile)
   • Frequency: Every Monday 05:30 local time, unless superseded by emergency recount

3. ROLES & RESPONSIBILITIES
   Shift Lead          — Initiate/close cycle count mode; ensure sync by 08:00
   Floor Associate     — Perform two-person counts per assigned aisle
   Verifier            — Second count on discrepancies > 5 units
   Inventory Analyst   — WMS vs ERP comparison; open INC tickets as needed
   Regional Ops Mgr    — Escalation owner for high-value or repeat variances

4. PROCEDURE
   4.1 Pre-count (05:30)
       a. Set receiving dock scanners to "cycle count" mode (no receiving).
       b. Generate bin-level count sheets from WMS (include high-variance SKUs, 30d).

   4.2 Physical count (05:45–07:15)
       a. Assign aisles; conduct two-person counts.
       b. Re-count any line with discrepancy > 5 units.

   4.3 System entry (07:15–07:45)
       a. Enter counts in WMS tablet app.
       b. Confirm sync completed before 08:00.

   4.4 Reconciliation (07:45–08:00)
       a. Analyst compares WMS totals to ERP (NetSuite).
       b. Variances > 2% of line value → open INC ticket with SKU, qty, $ impact.

   4.5 Communication (by 08:15)
       a. Email summary to warehouse@company.com.
       b. Post handoff note in #ops-handoff Slack.

5. ESCALATION
   • Variance > $10,000 → notify Regional Ops Manager same day.
   • Same SKU variance 2 consecutive weeks → RCA required within 48 hours.

6. RECORDS
   Retain count sheets and WMS export for 90 days (audit trail).`,
  },

  "summarize-notes": {
    input: `Night shift ops log — 14 May — Site B / Fulfillment

22:10 — Shift start. WMS latency elevated (p95 ~4s). Reported to platform on-call; ticket INC-88421 opened.
23:05 — Conveyor line 3 stopped; jam at merge unit. Cleared in 12 min. No damaged cartons.
00:40 — Partial power blip in aisle 7 (UPS held). 3 pick stations rebooted. Counts paused 18 min total.
01:15 — Carrier pickup delayed (weather). 214 orders moved to 06:00 wave; CS notified via template.
02:30 — Cycle count spot-check aisle 4: 2 SKU mismatches (see sheet WH-4471). Analyst tagged for Monday reconcile.
04:00 — INC-88421 update: DB connection pool patch applied; latency back to normal.
05:45 — Handoff: Line 3 belt worn — maintenance request MR-992 filed. Watch WMS during morning wave.

Open: MR-992 pending parts. Monday reconcile for WH-4471. Confirm carrier SLA for delayed orders.`,
    output: `OPS SHIFT SUMMARY — Site B Fulfillment
Date: 14 May · Shift: Night · Prepared by: Ops (auto-draft)

SUMMARY
Night shift completed with one equipment stoppage, brief power-related picking
pause, and carrier delay affecting 214 orders. WMS performance issue (INC-88421)
was mitigated by platform on-call before end of shift.

KEY EVENTS
• WMS latency spike (p95 ~4s) — INC-88421 opened 22:10; resolved ~04:00 after pool patch
• Conveyor line 3 jam — 12 min downtime, no product damage
• Aisle 7 power blip — 18 min picking pause; 3 stations rebooted
• Carrier weather delay — 214 orders deferred to 06:00 wave; CS notified
• Spot-check aisle 4 — 2 SKU mismatches documented (WH-4471)

BLOCKERS / RISKS
• Line 3 belt wear — MR-992 filed; parts pending (may affect throughput)
• Monday inventory reconcile required for WH-4471 mismatches

DECISIONS
• Defer 214 orders to 06:00 wave rather than expedite overnight
• Continue monitoring WMS during morning peak

HANDOFF TO DAY SHIFT
1. Confirm MR-992 status with maintenance before peak picking.
2. Complete Monday reconcile per WH-4471.
3. Verify carrier SLA / customer comms for delayed shipment batch.`,
  },

  "extract-actions": {
    input: `Ops weekly sync — 13 May (notes)

Attendees: Maria (Ops lead), James (Inventory), Priya (Platform), Tom (CS)

- Maria: We need the updated receiving SOP published before peak season — James to draft by 20 May, Maria reviews.
- James: NetSuite connector errors spiked Tuesday; Priya's team deployed a hotfix. Want a postmortem doc for leadership.
- Priya: Postmortem owner TBD — she will assign in Jira today. Also need approval for extra DB read replica (cost ~$400/mo).
- Tom: Customer complaints up 12% on delayed shipments; asked for daily status until backlog clears. Maria agreed to send EOD Slack update through Friday.
- James: Requesting barcode scanner firmware rollout paused until after inventory week — decision by 15 May.
- Maria: Schedule vendor SLA review with Acme Logistics — owner Maria, target 22 May.`,
    output: `ACTION ITEMS (EXTRACTED)
Source: Ops weekly sync — 13 May
Status: DRAFT — Verify owners and dates before tracking

┌────┬──────────────────────────────────────────────────┬─────────────┬────────────┐
│ #  │ Action                                           │ Owner       │ Due        │
├────┼──────────────────────────────────────────────────┼─────────────┼────────────┤
│ 1  │ Draft updated receiving SOP for peak season      │ James       │ 20 May     │
│ 2  │ Review and publish receiving SOP                 │ Maria       │ After #1   │
│ 3  │ Assign postmortem owner for NetSuite hotfix      │ Priya       │ 13 May     │
│ 4  │ Write leadership postmortem (connector errors)   │ TBD (Jira)  │ TBD        │
│ 5  │ Obtain approval for DB read replica (~$400/mo)   │ Priya       │ TBD        │
│ 6  │ Send EOD Slack shipment status (through Friday)  │ Maria       │ Daily EOD  │
│ 7  │ Decide on barcode scanner firmware rollout pause │ Maria/James │ 15 May     │
│ 8  │ Schedule vendor SLA review — Acme Logistics      │ Maria       │ 22 May     │
└────┴──────────────────────────────────────────────────┴─────────────┴────────────┘

NOTES
• Item 4 depends on Priya's Jira assignment.
• Item 6 supports CS backlog visibility (Tom's request).`,
  },

  "business-rewrite": {
    input: `Technical incident brief — INC-88421

Root cause: WMS read latency caused by connection pool exhaustion on shared Postgres
primary during nightly batch jobs (inventory_snapshots + carrier_manifest_export overlap).

Timeline:
- 22:08 UTC — p95 latency 4.2s, error rate 0.3% on pick confirm API
- 22:15 — on-call increased pool size 50→80 (temporary)
- 02:12 — platform moved inventory_snapshots job +15 min; added read replica route for WMS reads
- 04:01 — metrics normalized (p95 < 800ms)

Customer impact: ~40 min aggregate picking slowdown; 214 orders slipped to next wave (weather + system).
No data loss. No security impact.

Follow-up: capacity review for Q3 peak; cost approval pending for permanent replica.`,
    output: `BUSINESS UPDATE — Fulfillment Systems (Draft)
Audience: Cross-functional leadership · Incident INC-88421

EXECUTIVE SUMMARY
On the night of 14 May, warehouse staff experienced slower-than-normal system
response times while processing orders. The issue was resolved the same night.
Approximately 214 customer orders shipped on a later schedule due to a combination
of system slowdown and weather-related carrier delays. No customer data was
compromised.

WHAT HAPPENED
Our warehouse management system shared a database with overnight reporting jobs.
When two large jobs ran at the same time, the system could not keep up with
order-picking activity, causing delays of about 40 minutes during the worst period.

CUSTOMER & BUSINESS IMPACT
• Order processing slowed during late-night picking window
• 214 orders moved to the next morning shipment wave (also influenced by weather)
• No lost orders; no security or privacy impact

RESOLUTION
Operations and platform teams adjusted system capacity and rescheduled conflicting
jobs. Performance returned to normal levels before the morning shift peak.

NEXT STEPS
• Operations will continue daily shipment status updates through Friday
• Platform team is evaluating a modest infrastructure investment (~$400/month)
  to add capacity before peak season
• Leadership capacity review planned for Q3 volume`,
  },
};
