# Sumber Kasih POS System — Task Update 8

> **Context for the agent:** This is a React + Vite POS system. This task covers two separate updates: (1) reformatting the item rows in the printed receipt, and (2) fixing how Total Pendapatan is calculated in the Laporan and Riwayat pages so that "Belum Lunas" transactions only contribute their actual paid amount (bayar), not their full total. Scan the receipt component, the Laporan component, and the Riwayat summary card logic before making any changes.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before editing anything, analyze:
- The receipt component where item rows are currently rendered (from taskUpdate6.md — two-line format: name + total on line 1, calculation on line 2)
- How the receipt layout handles fixed column positioning — whether it uses a monospace/pre block, flexbox, CSS grid, or a table. This matters because fixed-column alignment behaves differently in each approach
- The Laporan and Riwayat summary card components — specifically where `Total Pendapatan` is calculated and what data it currently reads from (localStorage or state)
- Whether `bayar` is stored per transaction in the existing data structure (confirm this before Task 2)

If fixed-column alignment is not achievable with the current receipt layout approach without a significant restructure, **stop and warn me** before proceeding — do not silently approximate it.

If `bayar` is missing or `0` for older transactions, **flag those records** to me rather than silently using `0` in the Total Pendapatan calculation.

---

## Task 1: Reformat Receipt Item Rows

### Current format (from taskUpdate6.md):
```
GULA PUTIH SAK                         Rp 1.600.000
  2 x Rp 800.000

SEDAP MIE KARI SPESIAL 75GR (40)       Rp 232.000
  2 x Rp 116.000
```
- Row 1: item name (left) + total price with "Rp" prefix (right)
- Row 2: indented, `qty x Rp unit_price`

### New format:
```
GULA PUTIH SAK                    2      1.600.000
  @ 800.000

SEDAP MIE KARI SPESIAL 75GR (40) 2        232.000
  @ 116.000

MIWON 1/2 ONS                     2        108.000
  @ 54.000
```

### Specific changes:

**Row 1 — three columns: item name | qty | total price**

1. **Item name** stays left-aligned as before.

2. **Quantity** moves from Row 2 to Row 1. It must sit in a **fixed column position** — meaning all quantity values align vertically regardless of how long the item name is. Use whatever layout method is already in use (e.g. if monospace/pre, pad with spaces to a fixed character position; if flexbox/table, use a fixed-width column). The quantity column should sit between the item name and the total price, clearly separated from both.

3. **Total price** stays right-aligned as before, but **remove the "Rp" prefix** — display the number only (e.g. `1.600.000` not `Rp 1.600.000`). Keep the existing thousand-separator format (dots, e.g. `1.600.000`).

**Row 2 — unit price only with "@" symbol**

1. **Remove** `qty x Rp` from Row 2 — quantity is now on Row 1, and "Rp" is being removed.
2. Replace with `@ unit_price` — for example: `@ 800.000`
3. The `@` symbol replaces the `Rp` prefix as the indicator that this is a per-unit price.
4. Keep the same indentation and smaller font size from taskUpdate6.md — Row 2 should remain visually subordinate to Row 1.
5. Number format stays the same (dots as thousand separator, e.g. `800.000`).

**Do not change:**
- Font type or size of Row 1 (only Row 2 stays smaller as established in taskUpdate6.md)
- The spacing/gap between items
- Any other part of the receipt (header, separators, TOTAL, BAYAR, KEMBALIAN/HUTANG, footer)
- The "Rp" prefix on BAYAR, KEMBALIAN, and HUTANG lines — only remove "Rp" from the item list rows

---

## Task 2: Fix Total Pendapatan to Exclude Unpaid Hutang

### Current behavior (bug):
Total Pendapatan in both the Laporan page and the Riwayat summary cards currently counts the full `total` of every transaction — including "Belum Lunas" transactions where the customer has not fully paid. This overstates actual revenue.

### Desired behavior:
Total Pendapatan must reflect only **actual money received**, calculated as follows:

- **For "Lunas" transactions:** count the full `total` value (or `bayar` — they should be equivalent for fully paid transactions)
- **For "Belum Lunas" transactions:** count only the `bayar` value (the amount the customer actually paid), NOT the full `total`. The unpaid remainder (`hutang`) must not be included.

**Formula:**
```
Total Pendapatan = 
  SUM(total for all Lunas transactions) 
  + SUM(bayar for all Belum Lunas transactions)
```

### Steps:

1. Locate the Total Pendapatan calculation logic in:
   - The **Laporan** page (summary card at the top showing "Total Pendapatan")
   - The **Riwayat** page (summary card at the top showing "Total Pendapatan")
   Both likely share the same calculation function or derive from the same data — update both.

2. Update the calculation to use the formula above instead of simply summing `total` across all transactions.

3. **Do NOT change** the calculation for the other summary stats:
   - Total Transaksi (transaction count) — still counts ALL transactions including Belum Lunas
   - Rata-rata Transaksi — still calculated across all transactions
   - Item Terjual — still counts items from all transactions

4. **Edge cases to handle:**
   - If a "Belum Lunas" transaction has `bayar = 0` (customer paid nothing), it contributes `0` to Total Pendapatan — correct behavior, do not treat `0` as missing data
   - If a transaction is missing the `bayar` field entirely (older records before taskUpdate4.md was implemented), treat it as `bayar = total` for "Lunas" transactions, and flag it to me for "Belum Lunas" transactions — do not silently assume a value for unpaid records
   - If a "Belum Lunas" transaction's `bayar` somehow exceeds `total` (data error), cap it at `total` and flag the anomaly

5. **Laporan charts and graphs** — if the Tren Pendapatan chart or any other graph in Laporan is also based on `total` per transaction, apply the same fix there: use `bayar` for Belum Lunas transactions and `total` for Lunas transactions so the chart reflects actual cash received over time.

---

## General Notes for the Agent
- Task 1 and Task 2 are fully independent — they can be implemented in either order.
- Do not modify the receipt component for Task 2, and do not touch Laporan/Riwayat logic for Task 1.
- After completing each task, verify the app builds without errors before moving to the next.
- For Task 1: the only way to fully confirm correct output is by printing a test receipt — flag this to the user after completing the receipt changes.
- For Task 2: after the fix, manually verify with a known "Belum Lunas" transaction — the Total Pendapatan should decrease compared to before (since it no longer counts the unpaid hutang portion), which is the expected and correct result.
