# Sumber Kasih POS System — Task Update 5

> **Context for the agent:** This is a React + Vite POS system. This task modifies the Payment Modal introduced in `taskUpdate4.md`. Previously, the system blocked printing if the amount paid was less than the total transaction. That restriction is being removed and replaced with a debt (Hutang) flow — the customer is allowed to pay less than the total, the difference is recorded as Hutang, the receipt reflects this, and the transaction in Riwayat is marked "Belum Lunas". Scan the Payment Modal component, receipt component, and Riwayat/transaction save logic before making changes.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before editing anything, analyze:
- The Payment Modal from `taskUpdate4.md` — specifically the validation logic that currently blocks printing when `uangDibayar < total`
- The receipt component — where `KEMBALIAN` is currently rendered
- The transaction save/update logic — where transaction records are written to Riwayat, to understand what fields already exist and where to safely add a `status` or `hutang` field

If any of the changes below risk breaking the existing payment flow, receipt output, or Riwayat data structure for already-saved transactions (e.g. old records that don't have a `status` field yet), **stop and warn me before proceeding.** Suggest a safe migration approach if needed.

---

## Task 1: Allow Underpayment — Hutang Flow in Payment Modal

**Goal:** Remove the hard block on underpayment. Instead, when the cashier enters an amount less than the total (including Rp 0 or an empty field), the system should calculate the debt, show a warning, and require confirmation before printing.

### Changes to the Payment Modal:

1. **Remove the current error/block behavior** for `uangDibayar < total` — specifically:
   - Remove the inline error message that currently says something like `"Uang dibayar kurang dari total transaksi"`
   - Remove the logic that disables the "Cetak" button when the amount is underpaid

2. **Handle the Rp 0 / empty field case:**
   - If the cashier leaves the Uang Dibayar field empty or enters `0`, treat `uangDibayar` as `0`
   - Calculate `hutang = total − 0 = total` (the full amount is owed)
   - Do **not** block printing — proceed with the Hutang warning flow below

3. **Real-time Kembalian / Hutang display in the modal:**
   - The modal currently shows a `Kembalian` calculated field
   - Change this display to be conditional:
     - If `uangDibayar >= total`: show **"Kembalian: Rp X"** (change owed to customer) — behavior unchanged from `taskUpdate4.md`
     - If `uangDibayar < total` (including 0/empty): show **"Hutang: Rp X"** in place of Kembalian, where `X = total − uangDibayar`
     - Style the Hutang display differently from Kembalian to make it visually distinct — e.g. use a warning color (orange or red) so the cashier immediately notices it's a debt situation

4. **Confirmation step before printing when Hutang > 0:**
   - When the cashier clicks "Cetak" and `uangDibayar < total`, do **not** print immediately
   - Instead, show a confirmation dialog/prompt:
     > **"Pelanggan berhutang Rp [X]. Lanjutkan cetak?"**
     > *(Customer owes Rp [X]. Continue printing?)*
   - Two buttons: **"Ya, Cetak"** and **"Batal"**
   - If "Batal": close the confirmation dialog, return to the Payment Modal (keep all entered values intact)
   - If "Ya, Cetak": proceed to print and save the transaction

5. **When `uangDibayar >= total`:** no confirmation dialog — print immediately as before (behavior unchanged from `taskUpdate4.md`)

---

## Task 2: Update Receipt Output for Hutang

**Goal:** When a transaction has Hutang (underpayment), replace `KEMBALIAN` with `HUTANG` on the printed receipt. When the transaction is fully paid, nothing changes.

### Changes to the receipt component:

1. Locate where `KEMBALIAN` is rendered in the receipt (added in `taskUpdate4.md`)
2. Make the label conditional based on the transaction's payment status:
   - If `uangDibayar >= total` → print as before:
     ```
     BAYAR:              Rp 350.000
     KEMBALIAN:           Rp  8.000
     ```
   - If `uangDibayar < total` → replace `KEMBALIAN` with `HUTANG`:
     ```
     BAYAR:              Rp  50.000
     HUTANG:             Rp  31.000
     ```
3. The value next to `HUTANG` is `total − uangDibayar` (the remaining amount owed)
4. Formatting and alignment of the `HUTANG` line must match the existing receipt style — same column width, same number formatting as `KEMBALIAN`
5. If `uangDibayar = 0` (cashier left it empty), the receipt should show:
   ```
   BAYAR:               Rp   0
   HUTANG:             Rp [full total]
   ```

---

## Task 3: Mark Hutang Transactions as "Belum Lunas" in Riwayat

**Goal:** When a transaction is saved with Hutang > 0, the Riwayat record for that transaction must be marked with a `status` of `"Belum Lunas"`. Fully paid transactions should be marked `"Lunas"`.

### Changes to the transaction save logic:

1. Locate where transaction records are saved/updated in Riwayat (the same logic touched in `taskUpdate3.md` and `taskUpdate4.md`)
2. Add a `status` field to the transaction record:
   - If `uangDibayar >= total` → `status: "Lunas"`
   - If `uangDibayar < total` → `status: "Belum Lunas"`
3. Also save the `hutang` amount (i.e. `total − uangDibayar`) as a separate field in the transaction record (e.g. `hutang: X`) so it can be referenced later if needed
4. **Display the status in the Riwayat list/detail view:**
   - In the transaction list in Riwayat, show a visible status badge or label next to each transaction:
     - `"Lunas"` — shown in green or a neutral color
     - `"Belum Lunas"` — shown in orange or red to make it easy to spot at a glance
   - In the Detail Transaksi modal (the one shown in `cetakUlang.png`), also display the status and the Hutang amount clearly

5. **Backward compatibility:** Old transaction records that were saved before this update won't have a `status` field. When rendering these in Riwayat, treat a missing `status` field as `"Lunas"` so old records don't show as Belum Lunas incorrectly.

6. **Cetak Ulang integration:** If a "Belum Lunas" transaction is reprinted via Cetak Ulang (from `taskUpdate3.md`), the cashier goes through the Payment Modal again and enters a new `uangDibayar`. When saved, the transaction's `status` and `hutang` fields in Riwayat must be recalculated and updated — it's possible the customer is now paying in full, so the status could change from `"Belum Lunas"` to `"Lunas"`.

---

## General Notes for the Agent
- Task 1 must be completed before Task 2 and Task 3, since they all depend on the `hutang` value being calculated in the Payment Modal first.
- Tasks 2 and 3 can be done in parallel after Task 1.
- Do not change any other part of the receipt format beyond the `KEMBALIAN`/`HUTANG` line.
- Preserve all existing behavior for fully-paid transactions — this update should feel invisible when `uangDibayar >= total`.
- After completing all tasks, verify the app builds and runs without errors, and test both the fully-paid and underpaid flows to confirm the correct receipt output and Riwayat status in each case.
