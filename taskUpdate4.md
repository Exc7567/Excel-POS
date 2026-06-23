# Sumber Kasih POS System — Task Update 4

> **Context for the agent:** This is a React + Vite POS system. This file covers three updates: (1) a payment & change calculator popup that appears when clicking Print, (2) ensuring that feature integrates correctly with the existing "Cetak Ulang" reprint flow from `taskUpdate3.md`, and (3) fixing long item names in the cart being truncated with `...`. Scan the full codebase before starting — locate the Print button handler, the receipt component, the cart component, the Riwayat/history section, and the transaction save/update logic. Understand the full data flow before making any changes.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before editing any file, analyze the components and state involved in all three tasks. If you find anything that could:
- Break the existing print or receipt flow
- Corrupt or duplicate transaction records in Riwayat
- Cause crashes from invalid payment input (e.g. empty, non-numeric, negative)
- Affect other parts of the app that share the same state or print logic
- Conflict with changes from `taskUpdate3.md` (cart state, Cetak Ulang flow, Riwayat update logic)

**→ STOP and warn me with a clear explanation before proceeding.** Do not make the change silently. Wait for my confirmation.

---

## Task 1: Payment & Change Calculator Popup on Print

**Goal:** When the user clicks the Print button in the cart, instead of immediately printing, a popup/modal appears where the user can enter the amount of money paid by the customer. The system then calculates the change, and both the amount paid and the change are included in the printed receipt.

### Steps:

**Step A — Intercept the Print button:**
1. Locate the Print button handler in the cart component/view.
2. Instead of triggering the print directly, open a new modal/popup (let's call it the "Payment Modal").

**Step B — Payment Modal UI:**
The modal should contain:
- The transaction **Total** displayed clearly at the top (read-only, pulled from cart state)
- A numeric input field labeled **"Uang Dibayar"** (Money Paid) for the cashier to enter the customer's payment amount
- A calculated display field labeled **"Kembalian"** (Change) — shows `Uang Dibayar − Total` in real time as the user types
- A **"Cetak"** (Print) confirm button to proceed
- A **"Batal"** (Cancel) button to close the modal and return to the cart without printing

**Step C — Input Validation:**
- The "Uang Dibayar" field must only accept positive numeric values (integers or decimals — match whatever currency format the app uses for Rp amounts).
- **If the user enters an amount lower than the total transaction:** show an inline error message (e.g. `"Uang dibayar kurang dari total transaksi"`) and disable/block the "Cetak" button. Do not allow printing to proceed.
- **If the amount equals or exceeds the total:** show the calculated Kembalian and enable the "Cetak" button.
- If the field is empty or zero, the "Cetak" button should remain disabled.

**Step D — Receipt Update:**
After the user confirms and clicks "Cetak", the receipt must include two new lines below the TOTAL section:

```
=================================
TOTAL:                   342.000
BAYAR:                   350.000
KEMBALIAN:                 8.000
=================================
```

- These lines should follow the same formatting/alignment style as the existing TOTAL line in the receipt.
- If Kembalian is `0` (exact payment), still print `KEMBALIAN: 0` — do not skip the line.
- After printing, save `uangDibayar` and `kembalian` values to the transaction record in Riwayat alongside the other transaction data.

**Step E — Proceed to print:**
- After saving, trigger the existing receipt print flow as normal.
- Close the Payment Modal after printing is initiated.

---

## Task 2: Cetak Ulang — Ensure Payment Popup Also Applies on Reprint

**Context:** From `taskUpdate3.md`, the "Cetak Ulang" flow now loads items from a past transaction back into the cart. The user then handles the transaction from the cart. This task ensures the new Payment Modal from Task 1 is also part of that reprinted transaction's flow, and that Riwayat is updated (not duplicated).

### Steps:

1. **Payment Modal must trigger on reprint too** — since Cetak Ulang now loads items into the cart and the user presses Print from the cart, the Payment Modal from Task 1 will naturally appear (because Print now always triggers the modal first). No special-casing should be needed here — confirm this is the case after Task 1 is implemented.

2. **Riwayat update on reprint checkout:**
   - From `taskUpdate3.md`, the cart is tagged with `reprintTransactionId` when a Cetak Ulang is initiated.
   - When the user confirms payment in the Payment Modal and clicks "Cetak":
     - Detect that `reprintTransactionId` is set in cart/global state.
     - **Update the existing transaction record** in Riwayat that matches `reprintTransactionId` — include the new `uangDibayar` and `kembalian` values in the update.
     - Do **NOT** create a new transaction entry.
     - After a successful update, clear `reprintTransactionId` from state so subsequent normal transactions behave as usual.

3. **Do not modify the receipt print format** beyond the TOTAL/BAYAR/KEMBALIAN lines added in Task 1 — all other receipt content remains as-is.

---

## Task 3: Fix Truncated Item Names in Cart

**Reference:** `CART.png` — item names like `BENDERA SAS...`, `DORANG II KU...`, `BENDERA KAL...`, `MIE PALEM K...` are being cut off with `...` because the name container has a fixed width or `text-overflow: ellipsis` applied.

**Goal:** When an item name is too long to fit on one line in the cart row, it should wrap to the next line(s) and display in full — no truncation, no `...`.

### Steps:

1. Locate the cart item component — specifically the element wrapping the item name (likely a `<p>`, `<span>`, or `<div>` with CSS like `overflow: hidden`, `white-space: nowrap`, and/or `text-overflow: ellipsis`).

2. Remove or override the truncation CSS:
   - Remove `white-space: nowrap` (or change to `white-space: normal`)
   - Remove `text-overflow: ellipsis`
   - Remove `overflow: hidden` on the name element (be careful — only remove it from the name element, not the row container, to avoid breaking the overall cart row layout)

3. Allow the name to wrap naturally with `word-break: break-word` or `overflow-wrap: break-word` to handle very long single words (e.g. all-caps product codes with no spaces).

4. **This should only visually affect names that are too long** — short names that already fit on one line will naturally remain on one line. No change to their appearance.

5. Make sure the cart row layout (quantity controls, price, × button on the right) remains aligned and does not break when a name wraps to multiple lines. The name column should grow vertically while the other columns stay in place.

6. Scope this change to the cart item component only — do not affect item name display in other parts of the app (e.g. product selection grid, Riwayat detail modal).

---

## General Notes for the Agent
- All three tasks are independent in scope but Task 2 depends on Task 1 existing — implement Task 1 first, then Task 2, then Task 3 can be done in any order.
- Preserve existing code style, naming conventions, and component structure throughout.
- After completing each task, verify the app still builds and runs without errors before moving to the next task.
- Pay special attention to the interaction between Task 2 and the `reprintTransactionId` logic introduced in `taskUpdate3.md` — do not accidentally override or clear that flag before the Riwayat update has been saved.
