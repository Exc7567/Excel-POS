# Sumber Kasih POS System — Task Update 11

> **Context for the agent:** This is a React + Vite POS system, now backed by Supabase (from taskUpdate10.md). This task adds a **customer name** feature specifically for unpaid ("Belum Lunas") transactions, so employees can more easily find and track who still owes money. A new nullable column `nama_pelanggan` (text) has already been added to the `transactions` table by the user — do not attempt to alter the database schema. This task only wires up the application code: the Payment Modal, the receipt, and the Riwayat page.
>
> **Important:** This feature only applies going forward. Do not attempt to backfill or modify any of the 343 previously migrated transactions — they will simply show no customer name (`nama_pelanggan` is `NULL`), which is expected and correct.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before editing anything, locate:
- The Payment Modal component (from taskUpdate4.md/taskUpdate5.md) where Bayar is entered and Hutang is calculated
- The receipt component's header/detail section (to know where to add the customer name line)
- The Riwayat page's transaction list, filter controls, and search logic (from taskUpdate10.md, now backed by Supabase)
- Confirm the `nama_pelanggan` column exists on the `transactions` table and is nullable before proceeding

If any of these components can't be found as expected, or if the Supabase insert/update logic from taskUpdate10.md doesn't already have a clear place to add one more field, **stop and warn me** before proceeding.

---

## Task 1: Add Customer Name Input to Payment Modal (Belum Lunas Only)

**Goal:** When a transaction is underpaid (Hutang > 0), give the employee an optional field to enter the customer's name, with a clear skip option.

### Steps:

1. In the Payment Modal, the customer name input should only appear/activate when the entered `Uang Dibayar` results in `Hutang > 0` (i.e. the same condition that currently triggers the Hutang warning label and confirmation dialog from taskUpdate5.md).

2. When a Lunas transaction is being processed (Bayar >= Total), do **not** show the customer name input at all — this field is exclusively for Belum Lunas transactions.

3. **UI for the customer name field:**
   - A text input labeled **"Nama Pelanggan (opsional)"**
   - Placeholder text like `"Masukkan nama pelanggan..."`
   - A **"Lewati"** (Skip) button/option next to or below the input, allowing the employee to proceed without entering a name

4. **Behavior:**
   - If the employee types a name and proceeds to print: save that name into the `nama_pelanggan` field of the transaction record
   - If the employee clicks "Lewati" (Skip) or simply leaves the field empty and proceeds: save `nama_pelanggan` as `NULL` (or empty string treated as null) — do not save an empty string that would later display awkwardly
   - This field should NOT block printing — it is purely optional, consistent with the existing confirmation flow from taskUpdate5.md (the "Pelanggan berhutang Rp X, lanjutkan cetak?" confirmation still applies as before; the name field is an additional optional step in the same modal, not a new blocking gate)

5. When saving the transaction to Supabase (from taskUpdate10.md's Task 1 insert logic), include `nama_pelanggan` in the insert payload — either the entered name, or `null` if skipped.

---

## Task 2: Show Customer Name on the Receipt (Belum Lunas Only)

**Goal:** If a customer name was entered, display it on the printed receipt so it's clear whose debt this is.

### Steps:

1. If `nama_pelanggan` has a value (not null/empty) for the transaction being printed, add a line to the receipt showing the customer's name.
   - **Placement:** directly below the `Tanggal` / `Jam` line, above the item list separator — NOT near TOTAL/BAYAR/HUTANG at the bottom.
   - **Label format:** `Pelanggan: [nama]` — for example: `Pelanggan: Budi`
   - Example receipt layout:
     ```
     Tanggal: 12/7/2026   Jam: 22.43
     Pelanggan: Budi
     -------------------------------------
     GULA PUTIH SAK                2      1.600.000
       @ 800.000
     ```
   - Match the existing font, size, and alignment style of the `Tanggal`/`Jam` line — no new styling needed, this line should look like a natural continuation of the date/time block above it.
2. If `nama_pelanggan` is null/empty (employee skipped it), **do not print any name line at all** — the receipt should look exactly as it does now with no gap or placeholder text.
3. This addition only applies when the transaction is Belum Lunas. Lunas transactions never show a name line, regardless of what's in the database (since Lunas transactions won't have a name saved anyway per Task 1).
4. Do not change any other part of the receipt layout, spacing, or formatting established in taskUpdate6.md/taskUpdate8.md/taskUpdate9.md — including the TOTAL/BAYAR/HUTANG block at the bottom, which remains completely untouched by this task.

---

## Task 3: Riwayat Page — Customer Name Column, Belum Lunas Toggle, and Search

**Goal:** Make it fast for the employee to find which customers still owe money.

### Steps:

**A — Add a "Nama Pelanggan" column to the Riwayat transaction list:**
1. Add a new column to the transaction list table, positioned naturally within the existing columns (e.g. between ITEM and TOTAL, or after STATUS — use your judgment based on what fits the existing table layout best).
2. Display logic per row:
   - If the transaction is **Belum Lunas** and has a `nama_pelanggan` value: show the name
   - If the transaction is **Belum Lunas** but `nama_pelanggan` is null (employee skipped it): show `-`
   - If the transaction is **Lunas**: always show `-` regardless of what's in the database

**B — Add a toggle/filter button to show only Belum Lunas transactions:**
1. Add a toggle or button near the existing period filter and search bar (e.g. "Tampilkan Belum Lunas" or a simple toggle switch) that, when activated, filters the visible list to only transactions with `status = 'Belum Lunas'`.
2. When toggled off, the list returns to showing all transactions (respecting the existing period filter as before).
3. This filter should work in combination with the existing period filter (e.g. "30 Hari Terakhir" + "Belum Lunas only" can both be active at once).

**C — Extend the existing search bar to also search by customer name:**
1. Locate the current search logic ("Cari transaksi...") which likely searches by transaction ID and/or item name.
2. Extend it so that typing a customer's name also matches and filters the list to transactions where `nama_pelanggan` contains the searched text (case-insensitive partial match, consistent with however the existing search matching works for IDs/items).
3. This should work alongside the Belum Lunas toggle — e.g. an employee can toggle "Belum Lunas only" AND search "Budi" to find that specific customer's unpaid transaction quickly.

**D — Detail Transaksi modal:**
1. If `nama_pelanggan` has a value, display it in the Detail Transaksi modal as well (e.g. under "Tipe Harga" or near the Status field) — labeled "Nama Pelanggan".
2. If null, either omit the field entirely from the modal or show `-` — pick whichever is visually cleaner given the existing modal layout (this is a minor detail, use your judgment).

---

## Task 4: Update POS Display Font (App UI Only — Not the Receipt)

**Goal:** Give the entire on-screen app (Kasir, Riwayat, Laporan, Edit Items, modals, buttons, etc.) a cleaner, more professional look by switching to two new fonts: **Segoe UI** and **Instrument Sans**. This does NOT apply to the printed receipt — the receipt's font stays exactly as established in taskUpdate1.md and untouched since.

### Steps:

1. **Import/load both fonts:**
   - `Segoe UI` is a system font on Windows and doesn't need a web import — set it in the font stack with fallbacks (e.g. `'Segoe UI', -apple-system, sans-serif`).
   - `Instrument Sans` is a Google Font — it needs to be loaded, e.g. via a `<link>` in `index.html` or an `@import` in the global stylesheet:
     ```html
     <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
     ```
     (Adjust the weight range if the design calls for specific weights — see pairing guide below.)

2. **Suggested pairing strategy (use your judgment to refine, but follow this general split for a clean, professional feel):**
   - **Instrument Sans** — use for headings, titles, and branding-type text: page titles ("Riwayat Transaksi", "Laporan Penjualan"), the "Sumber Kasih POS" sidebar title, summary card labels/values (e.g. "Total Pendapatan", "Rp 2.645.000"), and section headers ("Item Terlaris", "Performa Kategori"). Instrument Sans has more character and works well for things that should stand out. Use **bold weight** for numbers/values in summary cards to give them visual weight, and regular weight for labels.
   - **Segoe UI** — use for everything else: body text, table rows/cells (transaction lists, item lists), form inputs, buttons, navigation sidebar links, search bars, and dropdowns. Segoe UI is highly readable at small sizes and works well for dense data like the Riwayat transaction table.
   - **Italic** can optionally be used sparingly for secondary/muted text — e.g. category subtext under item names (like "SUSU & MINUMAN" under "OMELA BESAR (48)"), or helper text/placeholders — to add subtle visual distinction without cluttering the design. Do not overuse italics; apply only where it genuinely improves readability/hierarchy.

3. **Apply the font changes via global CSS** — define CSS custom properties or utility classes for both fonts (e.g. `--font-display: 'Instrument Sans', sans-serif;` and `--font-body: 'Segoe UI', -apple-system, sans-serif;`), then apply them across components rather than hardcoding font-family in many places. This makes future adjustments easier.

4. **Scope check:** Confirm the receipt component (which likely has its own isolated print stylesheet from taskUpdate1.md/taskUpdate6.md) is NOT affected by this global font change — the receipt must continue using its existing sans-serif print font untouched. If the app's global font styles risk leaking into the receipt's print view (e.g. shared CSS classes), isolate the receipt's font rules explicitly so they're unaffected.

5. **Visual consistency check:** After applying, do a pass across Kasir, Riwayat, Laporan, and Edit Items pages to confirm:
   - No layout breakage from font metrics differing (e.g. text overflow, misaligned columns) — adjust padding/line-height if needed
   - Consistent use of the two fonts across similar UI elements (e.g. all page titles use the same font/weight, all table data uses the same font/weight)
   - Buttons, badges (like "Lunas"/"Belum Lunas" status pills), and form inputs all read cleanly with the new fonts

---

## General Notes for the Agent
- This feature does not apply to the 343 previously migrated transactions — they will correctly show `-` everywhere since `nama_pelanggan` is `NULL` for all of them. Do not write any backfill or migration logic.
- Tasks 1, 2, and 3 depend on each other in sequence (name is entered in Task 1 → shown on receipt in Task 2 → shown/searchable in Riwayat in Task 3), so implement in that order.
- Task 4 (font update) is independent of Tasks 1–3 and can be done in any order relative to them.
- Do not make the customer name field required or block printing under any circumstance — it must always remain skippable.
- Task 4 must NOT touch the receipt/print stylesheet under any circumstance — the receipt font is a separate, established design decision from earlier tasks.
- After completing all tasks, verify the app builds without errors.
- Test the full flow: process a Belum Lunas sale with a name entered, one where the name is skipped, and confirm both the receipt output and Riwayat display (list column, filter toggle, search, and Detail Transaksi modal) behave correctly in each case.
- For Task 4, visually review each main page (Kasir, Riwayat, Laporan, Edit Items) after the font change to confirm nothing looks broken or misaligned, and print a test receipt to confirm the receipt font is unchanged.
