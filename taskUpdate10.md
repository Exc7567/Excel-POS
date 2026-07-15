# Sumber Kasih POS System — Task Update 10

> **Context for the agent:** This is a React + Vite POS system. This is a large architectural update — read this entire file before writing any code. Currently, all transaction data (used by both the **Riwayat** and **Laporan** pages) is stored in the browser's `localStorage`. This means data does not sync across devices or browsers. This task replaces that local storage layer with a Supabase table called `transactions`, which already exists in the project's Supabase instance (created manually by the user — do not attempt to create it yourself).
>
> **Do NOT attempt to migrate historical/old transaction data.** The user already has their old data exported to JSON and will import it into Supabase manually. Your job is only to wire up the **live application code** — new transactions, Riwayat display, Laporan display, Cetak Ulang updates, and deletion — to read from and write to Supabase instead of localStorage.

**The `transactions` table structure (already created):**
```
id            text (primary key)
tanggal_waktu timestamptz
tipe_harga    text
items         jsonb   -- array of {nama_item, kategori, qty, harga_satuan, subtotal}
subtotal      numeric
total         numeric
bayar         numeric
kembalian     numeric
hutang        numeric
status        text    -- "Lunas" or "Belum Lunas"
created_at    timestamptz (auto-set on insert)
```

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before touching any code, do a full pass across the codebase and identify **every** place that currently reads from or writes to `localStorage` for transaction data. This almost certainly includes:
- The checkout/save-transaction logic in the Kasir page (from taskUpdate4.md and taskUpdate5.md — Payment Modal save flow)
- The Cetak Ulang reprint flow that updates an existing transaction (from taskUpdate3.md, taskUpdate4.md, taskUpdate5.md — the `reprintTransactionId` update logic)
- The Riwayat page's transaction list, search, filter, and Detail Transaksi modal
- The Laporan page's summary cards, Tren Pendapatan chart, Item Terlaris, and Performa Kategori — all of which currently derive from the same localStorage data
- The existing "Export JSON" and "Hapus Semua Data" functions

**List out every file and function you find touching this data before making changes, and confirm your understanding matches this task's scope before proceeding.** If you find any additional localStorage usage not covered by the tasks below, flag it to me rather than silently changing or ignoring it.

If at any point a change risks breaking the checkout flow (the single most critical operational function of this app), **stop and warn me before proceeding.**

---

## Task 1: Wire Up Transaction Saving to Supabase (Checkout Flow)

**Goal:** Replace the transaction save logic (used when a cashier completes a sale via the Payment Modal) so it writes to the Supabase `transactions` table instead of localStorage — while remaining fully operational even without internet.

### Steps:

1. Locate the function that currently saves a completed transaction to `localStorage` after the Payment Modal confirms payment (from taskUpdate4.md/taskUpdate5.md).

2. Replace it with a Supabase `insert` call into the `transactions` table, mapping all fields exactly as defined in the schema above (`id`, `tanggal_waktu`, `tipe_harga`, `items`, `subtotal`, `total`, `bayar`, `kembalian`, `hutang`, `status`).

3. **Offline-safe fallback (critical — this must not block a sale):**
   - Attempt the Supabase insert immediately when checkout completes.
   - **If it succeeds:** done — proceed as normal (print receipt, clear cart, etc.)
   - **If it fails** (network error, timeout, Supabase unreachable): do NOT block the sale or show a blocking error to the cashier. Instead:
     - Save the full transaction object into a local "pending sync" queue in `localStorage` (a separate key from the old data storage, e.g. `pending_transactions`)
     - Allow the receipt to print and the cart to clear normally — the cashier's workflow is uninterrupted
     - Show a small, non-blocking visual indicator (e.g. a subtle badge or toast) noting the transaction was saved locally and will sync automatically
   - **Background retry mechanism:** Implement a retry function that runs periodically (e.g. every 30–60 seconds, or on `window.online` event) that attempts to push any transactions sitting in the `pending_transactions` queue to Supabase. On successful sync, remove that transaction from the local queue.

4. **Riwayat must show a combined view** while any transactions are pending: fetch confirmed transactions from Supabase, and also read any items still in the local `pending_transactions` queue, merging them into the displayed list with a small "Belum Tersinkron" (not yet synced) badge so the store owner is never confused about a missing sale.

---

## Task 2: Wire Up Cetak Ulang to Update Supabase

**Goal:** The Cetak Ulang flow (from taskUpdate3.md/4.md/5.md) currently updates a transaction in localStorage using `reprintTransactionId` to avoid creating a duplicate. This must now update the matching row in the Supabase `transactions` table instead.

### Steps:

1. Locate the checkout/save logic's check for `reprintTransactionId` (introduced in taskUpdate3.md, extended in taskUpdate4.md/5.md).
2. When `reprintTransactionId` is set, instead of updating a localStorage record, perform a Supabase `update` call on the `transactions` table where `id` matches `reprintTransactionId`, updating all relevant fields (items, subtotal, total, bayar, kembalian, hutang, status).
3. Apply the same offline-safe fallback logic as Task 1 — if the update fails due to no connection, queue it locally and retry in the background, using the same pending-sync mechanism.
4. After a successful update, clear `reprintTransactionId` from state as before.

---

## Task 3: Migrate Riwayat Page to Supabase

**Goal:** Replace all localStorage reads in the Riwayat page with Supabase queries, so the same transaction history appears regardless of device or browser.

### Steps:

1. Replace the transaction list fetch logic with a Supabase `select` query against the `transactions` table.
2. **Period filter** (e.g. "Hari Ini", "30 Hari Terakhir"): apply this as a `tanggal_waktu` range filter in the Supabase query rather than filtering an already-loaded local array — this keeps performance reasonable as transaction count grows.
3. **Search** ("Cari transaksi..."): keep search working the same way — search by transaction ID or item name, either via a Supabase text filter or by filtering the already-fetched result set for the current period (whichever fits the existing code pattern better — use your judgment, but confirm search still works identically to before).
4. **Detail Transaksi modal:** continue to show full transaction detail — now sourced from the Supabase row instead of a local object. All fields (items, subtotal, bayar, kembalian/hutang, status) must display exactly as before.
5. **Summary cards** (Total Pendapatan, Total Transaksi, Rata-rata, Item Terjual) at the top of Riwayat: recalculate these from the Supabase-fetched data for the current filter period, preserving the existing Belum Lunas / bayar-only logic from taskUpdate8.md for Total Pendapatan.
6. Merge in any `pending_transactions` (from Task 1) into this same view, as described above.

---

## Task 4: Add Per-Transaction Delete Button

**Goal:** Currently there is no way to delete a single transaction — only "Hapus Semua Data" (delete everything) exists. Add a dedicated delete button for individual transactions.

### Steps:

1. Add a delete button (e.g. a trash icon) either in the Detail Transaksi modal (next to "Cetak Ulang" and "Tutup") or as an additional action in the transaction list row — choose whichever fits the existing UI most naturally, but the Detail Transaksi modal is the more natural location given the current layout.
2. **Confirmation before deleting:** clicking delete opens a simple confirmation popup:
   > "Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan."
   > (Delete this transaction? This action cannot be undone.)
   - Two buttons: **"Hapus"** (confirm) and **"Batal"** (cancel)
   - No text-typing requirement here — just a straightforward confirm button (unlike Task 5 below)
3. On confirm, perform a **hard delete** — a Supabase `delete` call removing that row permanently from the `transactions` table, matched by `id`.
4. After successful deletion:
   - Remove the transaction from the Riwayat list immediately
   - Close the Detail Transaksi modal (if deleted from there)
   - Recalculate the Riwayat summary cards (Total Pendapatan, Total Transaksi, Rata-rata, Item Terjual) to reflect the deletion
5. If the delete call fails (e.g. no connection), show an error message and do not remove the item from the visible list — the deletion did not actually happen, so the UI must not pretend it did.

---

## Task 5: Add Safety Confirmation to "Hapus Semua Data"

**Goal:** The existing "Hapus Semua Data" button currently deletes everything with no safeguard. Add a strict confirmation step requiring the user to type an exact phrase before the action is allowed.

### Steps:

1. Locate the current "Hapus Semua Data" button and its click handler.
2. Instead of deleting immediately, open a confirmation modal containing:
   - A clear warning message, e.g.: "Tindakan ini akan menghapus SEMUA data transaksi secara permanen. Ketik **CONFIRM_DELETE** untuk melanjutkan."
   - A text input field for the user to type into
   - A "Konfirmasi Hapus" button that is **disabled by default**
3. The "Konfirmasi Hapus" button becomes enabled **only** when the text input exactly matches `CONFIRM_DELETE` (case-sensitive, exact match — no partial matches, no case-insensitivity).
4. If the user types anything that doesn't exactly match, the button remains disabled. Optionally show a small hint like "Ketik CONFIRM_DELETE untuk mengaktifkan tombol."
5. On clicking the enabled "Konfirmasi Hapus" button, perform a Supabase `delete` call removing **all rows** from the `transactions` table.
6. After successful deletion, clear the Riwayat list and reset all summary cards to zero/empty state.
7. Add a "Batal" button to close the modal without deleting, at any point before confirmation.

---

## Task 6: Migrate Laporan Page to Supabase

**Goal:** Replace all localStorage-derived calculations in the Laporan page with the same Supabase `transactions` table as the single source of truth, so Riwayat and Laporan are always consistent with each other.

### Steps:

1. Replace the data source for all Laporan elements with Supabase queries against the `transactions` table, filtered by the selected "Filter Periode" date range:
   - **Total Pendapatan** — preserve the Belum Lunas / bayar-only logic from taskUpdate8.md
   - **Transaksi Berhasil** (transaction count)
   - **Rata-rata Transaksi**
   - **Total Item Terjual**
   - **Tren Pendapatan** chart — daily revenue trend over the selected period, using the same bayar-only logic for Belum Lunas transactions
   - **Item Terlaris** — top items by quantity/revenue across the filtered transactions
   - **Performa Kategori** — revenue breakdown by item category across the filtered transactions
2. Ensure the "vs periode lalu" percentage comparison (visible under Total Pendapatan) continues to work by comparing the current filter period's data against the equivalent prior period, both sourced from Supabase.
3. Confirm that when a transaction is deleted (Task 4/5) or updated via Cetak Ulang (Task 2), Laporan reflects the change the next time it's viewed or refreshed — it does not need to be real-time/live-updating while the user is actively looking at it, but must not show stale data on next load.

---

## Task 7: Final Cross-Check Between Riwayat and Laporan

**Goal:** Since both pages now depend on the exact same Supabase table, do a final pass to ensure there is no leftover inconsistency or duplicate logic.

### Steps:

1. Confirm both Riwayat and Laporan use the same underlying fetch/query approach (ideally a shared utility function for fetching transactions by date range, rather than duplicating query logic in both pages).
2. Confirm the Belum Lunas / bayar-only Total Pendapatan logic (taskUpdate8.md) is implemented identically in both places — no drift between the two.
3. Confirm that deleting a transaction (Task 4/5) or updating one via Cetak Ulang (Task 2) is reflected correctly in both pages without requiring a manual data fix.
4. Remove all now-unused localStorage read/write code related to transactions once the migration is verified working — do not leave dead code behind. (The `pending_transactions` offline-queue key from Task 1 is the one exception — that stays, as it's part of the new architecture, not leftover old code.)

---

## General Notes for the Agent
- Do not attempt to migrate old historical transaction data — this is being done manually by the user.
- The most critical requirement across this entire task is that **checkout must never fail or block a sale**, even with no internet connection — the offline queue and retry mechanism in Task 1 must work reliably.
- Work through the tasks in order (1 → 7), since later tasks depend on the Supabase writing/reading logic established in Task 1.
- After completing all tasks, verify the app builds without errors.
- Test thoroughly: complete a normal sale (Lunas), a Hutang sale (Belum Lunas), a Cetak Ulang reprint, a single transaction delete, and the full "Hapus Semua Data" flow with the CONFIRM_DELETE safeguard — confirm each works correctly and that Riwayat and Laporan both reflect the results consistently.
- If the Supabase table name or column names differ from what's documented at the top of this file, stop and confirm with me before proceeding, rather than guessing.
