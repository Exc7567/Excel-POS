# Sumber Kasih POS System — Task Update 3

> **Context for the agent:** This is a React + Vite POS system. This file covers two separate feature updates: (1) making the cart item quantity directly editable by typing, and (2) fixing the "Cetak Ulang" (reprint) feature in the Riwayat (transaction history) section. Scan the full codebase before starting — locate the cart component, the Riwayat/history component, the transaction detail modal (shown in `cetakUlang.png`), and the cart state management (likely a context, Redux store, Zustand, or similar). Understand the data flow before making changes.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before editing any file, analyze the relevant components and state management for both tasks below. If you identify anything that could:
- Break the cart's quantity/total calculation logic
- Corrupt a transaction record in the Riwayat/history
- Create duplicate transaction entries
- Cause crashes when a user types unexpected values (e.g. letters, decimals, negative numbers, or zero)
- Affect other parts of the app that depend on the same state or data

**→ STOP and warn me with a clear explanation before proceeding.** Do not make the change silently. Wait for my confirmation.

---

## Task 1: Make Cart Item Quantity Directly Editable

**Reference:** `CART.png` — the cart UI currently shows a quantity number between `−` and `+` buttons. That number is static/display-only.

**Goal:** Replace the static quantity display with an editable input field so the user can directly type a quantity instead of clicking `+` repeatedly (e.g. for a quantity of 100, the user should be able to just type `100`).

### Steps:

1. Locate the cart item component — the one that renders each row with item name, quantity, price, and the `−` / `+` buttons.
2. Replace the static quantity display (likely a `<span>` or `<p>`) with an `<input type="number">` or a controlled text input styled to look consistent with the existing quantity display.
3. **Behavior:** Apply the new quantity **instantly as the user types** — update the cart item quantity in state on every keystroke (i.e. `onChange` handler, not `onBlur` or `onKeyDown Enter`).
4. **Input validation (apply silently, no need for a visible error message):**
   - Only allow positive whole numbers (integers ≥ 1)
   - If the user clears the field entirely (empty string), treat the quantity as `0` or hold the last valid value — **do not crash or NaN the subtotal**
   - If the user types `0` or a negative number, clamp it to `1` or ignore the input
   - Do not allow decimals or non-numeric characters
5. **Totals must update in real time** — as the user types a new quantity, the item's subtotal and the cart's grand total should recalculate immediately to reflect the new value.
6. **Style the input to match the existing UI** — it should look like the current quantity number (centered, same size/font), not like a typical browser form input with a visible border box. Hide browser default number input arrows/spinners (use CSS `appearance: none` / `-webkit-inner-spin-button`).
7. The `−` and `+` buttons should still work as before — they should decrement/increment the value in the input field, and the input should reflect the updated number.
8. Scope this change to the cart item component only — do not affect other parts of the UI.

---

## Task 2: Fix "Cetak Ulang" — Load Transaction Items Back Into Cart

**Reference:** `cetakUlang.png` — the "Detail Transaksi" modal showing a past transaction with a "Cetak Ulang" button at the bottom.

**Current bug:** Clicking "Cetak Ulang" currently triggers a print of the modal/detail view itself (i.e. the on-screen transaction detail UI gets printed), instead of reprinting the actual receipt format. This is a wiring error where the print trigger is pointed at the wrong target.

**Desired behavior:** Clicking "Cetak Ulang" should **load the items from that transaction back into the cart** and **close the modal**, so the user can handle printing from the cart — not print the modal view.

> **Important additional rule:** When the cart is eventually processed/checked out after loading a reprinted transaction, the Riwayat (history) must **update the original transaction record** with the new transaction data — it must **NOT create a new/duplicate transaction entry**. The transaction ID from the original Riwayat entry should be reused/overwritten, not a new ID generated.

### Steps:

1. **Locate the "Cetak Ulang" button handler** in the transaction detail modal component. Currently it likely calls something like `window.print()`, `printReceipt()`, or a print utility — pointed at the modal view. This is the bug.

2. **Replace the print trigger with a "load to cart" flow:**

   **Step A — Check if the cart is empty or not:**
   - If the cart is **empty:** proceed directly to loading the items (skip to Step C).
   - If the cart **has items in it:** show a confirmation dialog/prompt asking the user:
     > "Keranjang Anda saat ini berisi item. Ganti dengan item dari transaksi ini?"
     > (Your cart currently has items. Replace with items from this transaction?)
     - With two options: **"Ya, Ganti"** (Yes, Replace) and **"Batal"** (Cancel)
   - If the user cancels: close the dialog, do nothing, keep the modal open.
   - If the user confirms: proceed to Step B.

   **Step B — Clear the current cart:**
   - Clear all existing items from the cart state.

   **Step C — Load items from the selected transaction into the cart:**
   - Read the item list from the transaction detail data already loaded in the modal (item name, quantity, price, price type/Tipe Harga, category, etc.)
   - Populate the cart state with these items, preserving all relevant fields (especially price type — e.g. "Grosir" as shown in the screenshot — so the cart reflects the same pricing as the original transaction).
   - **Tag the cart state with the original transaction's ID** (e.g. a `reprintTransactionId` or `editingTransactionId` field in the cart/global state). This is critical for Step D.

   **Step D — Preserve the original transaction ID for Riwayat update:**
   - When the user eventually checks out from the cart, the checkout/save logic must detect that `reprintTransactionId` is set.
   - If it is set: **update the existing transaction record** in Riwayat that matches that ID — do not insert a new record.
   - After a successful update, clear the `reprintTransactionId` flag from state so subsequent normal checkouts behave as usual (creating new records).
   - The updated Riwayat entry should reflect the new transaction data (items, total, timestamp of the reprint) while retaining the original transaction ID.

   **Step E — Close the modal and navigate to cart:**
   - Close the "Detail Transaksi" modal.
   - Navigate the user to the cart view (or wherever is natural in the app's flow) so they can see the loaded items and proceed.

3. **Do not modify the existing receipt print format or receipt component** — the receipt print logic that was already working from the cart flow should continue to work as-is. This task only changes what "Cetak Ulang" does.

4. If the transaction detail modal currently fetches/loads item data lazily (e.g. from an API call or local DB), make sure the items are fully loaded before attempting to populate the cart — handle any async/loading state appropriately.

---

## General Notes for the Agent
- Preserve existing code style, naming conventions, and component structure throughout.
- Both tasks are independent — they can be implemented in any order.
- After completing each task, do a quick sanity check that the app still builds/runs without errors before moving to the next task.
- If the cart state management is centralized (context/store), both tasks likely touch the same state — be careful not to introduce conflicts between the two changes.
