# Sumber Kasih POS System — Task Update 6

> **Context for the agent:** This is a React + Vite POS system. This task updates only the **item list section** of the printed receipt — specifically how each line item is displayed. The current format shows each item on a single line. The new format splits each item into two lines: the item name + total price on the first line, and the quantity calculation on the second line below it. No other part of the receipt (header, footer, TOTAL, BAYAR, KEMBALIAN, separators) should be changed. Font type and overall font size must also remain unchanged — only the item rows are being restructured.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before editing anything, locate and analyze:
- The receipt component where item rows are rendered (the section that loops through cart items and outputs each row)
- How the current layout is structured — whether it's CSS flexbox/grid, a monospace `<pre>` block, or a table-based layout
- What data fields are available per item (name, quantity, unit price, subtotal/total price)

If the unit price per item is not currently stored or passed to the receipt component (only the subtotal is available), **stop and warn me** — the calculation line `qty x Rp unit_price` requires the individual item unit price. Do not proceed until confirmed.

If the change risks breaking the overall receipt layout or the TOTAL/BAYAR/KEMBALIAN section, **stop and warn me** before proceeding.

---

## Task: Reformat Item Rows in Receipt — Two-Line Layout

### Current format (one line per item):
```
GALANG BARU 16              x5        105.000
COUNTRY 20                  x6        162.000
DUNHIL FILTER 16 HITAM      x2         61.000
```
- Item name on the left
- Quantity (e.g. `x5`) in the middle
- Total price (no "Rp" prefix) on the right
- All on a single line

### New format (two lines per item):
```
GALANG BARU 16                        Rp 105.000
  5 x Rp 21.000

COUNTRY 20                            Rp 162.000
  6 x Rp 27.000

DUNHIL FILTER 16 HITAM                Rp  61.000
  2 x Rp 30.500
```

**Line 1:** Item name (left) + total price with `Rp` prefix (right)
- Font size: keep exactly as the current item name font size — do not change it
- Font type: do not change

**Line 2:** Quantity calculation — `qty x Rp unit_price`
- Slightly indented from the left (relative to the item name above it) to visually separate rows from each other
- Font size: **smaller than line 1** — set to approximately 8pt or 9pt (check the current item line font size and go 1–2pt smaller; if the current size is already defined in `pt`, use 8pt; if in `px`, use the equivalent smaller size)
- Font type: do not change — must match the rest of the receipt
- Format exactly: `[qty] x Rp [unit_price]` — for example: `2 x Rp 36.000`

---

## Specific Changes:

1. **Remove the standalone quantity column** — the `x5`, `x6`, `x2` quantity display that currently sits between the item name and price on the same line should be removed from line 1. Quantity is now only shown in line 2 as part of the calculation.

2. **Add `Rp` prefix to the total price on line 1** — change from `105.000` to `Rp 105.000`. Apply this only to the item list rows. Do NOT add or change the `Rp` prefix on TOTAL, BAYAR, or KEMBALIAN lines — leave those exactly as they are.

3. **Add the calculation line (line 2)** below each item row, showing: `[qty] x Rp [unit_price]`
   - `unit_price` = the price per single unit of that item
   - `qty` = number of units purchased
   - `Rp` prefix included in both parts of the calculation line
   - Number formatting must match the rest of the receipt (same thousand-separator style, e.g. `36.000` not `36000`)

4. **Add a small gap between items** — since each item is now two lines, make sure there is a visible vertical gap or spacing between one item's calculation line and the next item's name line, so items are easy to distinguish at a glance. A small margin-bottom on each item block is sufficient.

5. **Scope:** Apply all of the above changes **only** to the item list section of the receipt. Everything else — header (SUMBER KASIH, address, phone), date/time line, separator lines (=== and ---), TOTAL, BAYAR, KEMBALIAN, and footer (Terima kasih!) — must remain completely untouched.

---

## General Notes for the Agent
- Do not change any font family anywhere in the receipt.
- Do not change the font size of any part of the receipt except the new calculation line (line 2), which should be 1–2pt/px smaller than the item name line.
- Do not modify the print layout, page width, or margins.
- After making the change, verify the app builds without errors.
- The only way to fully confirm the output is correct is by printing a test receipt — flag this to the user after completing the task.
