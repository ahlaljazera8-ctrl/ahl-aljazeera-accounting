# AJ-P0 Step B — offline prototype (example data only)
Run: `python3 -m http.server 8765 --bind 127.0.0.1` here, open http://127.0.0.1:8765/
Tests: `node --test tests/` (logic) · `node --experimental-websocket tests/browser-check.js` (headless Chrome, needs the server running; writes shots/)
Storage: localStorage (aj.*). Outbox = `aj.outbox` (ids not yet "sent"); no syncState field. "إرسال الآن" = fake sync.
Policy flags in ledger.js DEFAULT_POLICY follow data-model.md §4 (doc wins); see conflicts:
1. 'expense' (مصروف) added per Architect; data-model §2 needs updating.
2. Site creating دفعة عميل: doc §4/§6 default = no; Ameer = yes. Flag siteCanCreateClientPayment=true (Ameer overrides).
3. Reversal: doc §4 lets site reverse its own entries; brief = owner only. Flag siteCanReverseOwn=true (Ameer: site reverses own only; owner any). One reversal per original via id rev_<originalId>. Rules: firestore.rules.draft.
4. Doc §6 (site reads expense only) overridden: site also reads its OWN client payments; no received/profit totals for site.
