# Sumber Kasih POS System — Task Update 9

> **Context for the agent:** This is a React + Vite POS system. This task contains three visual refinements to the printed receipt and one functional update to the cart quantity input. Tasks 1–3 are scoped to the receipt component only. Task 4 involves the cart item component and its quantity input logic. These are follow-up adjustments to changes introduced in taskUpdate3.md, taskUpdate6.md, and taskUpdate8.md. Locate the relevant components before starting.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before editing, locate:
- The receipt component where item rows are rendered (two-line format per item — name/qty/total on Row 1, `@ unit_price` on Row 2)
- The CSS/style rules controlling the font size of Row 1 and Row 2 per item (Row 2 was set to a smaller font size in taskUpdate6.md)
- The CSS/style rules controlling the column positions of the quantity and total price in Row 1 (flexbox, grid, table, or monospace padding)
- The CSS/style rules controlling spacing around and between the TOTAL, BAYAR, and HUTANG/KEMBALIAN lines, and the separator lines (`===`) surrounding them

If any of the three changes below risks breaking the existing column alignment or receipt layout, **stop and warn me** before proceeding.

---

## Task 1: Equalize Font Size Between Row 1 and Row 2

**Current behavior:** Row 2 (the `@ unit_price` line) has a smaller font size than Row 1 (item name, quantity, total price) — this was set intentionally in taskUpdate6.md.

**Change:** Remove the smaller font size from Row 2. Set it to the **exact same font size as Row 1**. Both lines of each item should now render at the same size.

- Do not change the font family or weight
- Do not change the indentation of Row 2 — only the font size changes
- Do not change font sizes anywhere else in the receipt

---

## Task 2: Move Quantity Column Further Right

**Current behavior:** The quantity column in Row 1 sits roughly in the middle of the receipt, leaving limited space for the item name before it wraps to the next line.

**Change:** Shift the quantity column position further to the right — close to the total price — so the item name has significantly more horizontal room before it needs to wrap.

**How to implement depending on the current layout:**

- **If using flexbox or CSS grid:** Increase the `flex-grow` or column width of the item name column, and reduce the gap between the quantity and total price columns so they cluster on the right side together.
- **If using a monospace/pre block with space-padding:** Increase the number of characters allocated to the item name before the quantity starts, so the quantity and total sit together near the right edge.
- **If using a table layout:** Widen the first column (item name) and narrow the quantity column so it sits tight against the total column on the right.

**Target feel:** Item name takes up the majority of the row width. Quantity and total price sit together as a compact group on the right side of the row, like this:

```
GULA PUTIH SAK                             2   1.600.000
  @ 800.000

POWDET BOOM CINTA ROSE BAG 225GR (36)      4     400.000
  @ 100.000
```

- The quantity and total price should remain clearly separated from each other (not merged together) — there should be a visible gap between the two values
- Total price stays right-aligned to the receipt edge as before
- Row 2 (`@ unit_price`) indentation stays the same — do not change it

---

## Task 3: Tighten Bottom Section Spacing (TOTAL / BAYAR / HUTANG)

**Current behavior:** The TOTAL, BAYAR, and HUTANG/KEMBALIAN lines at the bottom of the receipt have too much vertical spacing — both between the lines themselves and between the separator lines (`===`) and the content block.

**Change:** Reduce the vertical spacing throughout the entire bottom section so the values feel compact and close together.

Apply tightening in two places:

**A — Between the separator lines and the content:**
- Reduce the gap/margin/padding between the `===` separator line above TOTAL and the TOTAL line itself
- Reduce the gap/margin/padding between the HUTANG/KEMBALIAN line and the `===` separator line below it
- Both gaps should be reduced equally so the block looks symmetrical

**B — Between TOTAL, BAYAR, and HUTANG/KEMBALIAN lines:**
- Reduce the line-height or margin-bottom between each of these three lines so they sit closer together as a tight group

**Target feel:**
```
=====================================
TOTAL:                       2.000.000
BAYAR:                               0
HUTANG:                      2.000.000
=====================================
```
The `===` separators should feel close to the content — not floating far above or below. The three value lines should read as a tight block, not spaced out.

- Do not change the font size or weight of TOTAL, BAYAR, or HUTANG/KEMBALIAN
- Do not change the separator style (`===` or `---`) — only reduce the space around them
- Do not affect spacing in the item list section above — only the bottom total block

---

## Task 4: Allow Decimal Quantities in Cart

**Context:** The cart quantity input was made editable (typed input) in taskUpdate3.md. Currently it only accepts whole numbers. This task extends it to accept decimal numbers for cases like liquid items sold by the liter (e.g. 0,5 liter, 1,5 liter, 2,3 liter).

### Scope:
- Applies to ALL items in the cart — no per-item distinction needed
- The cashier simply types a decimal when needed; for whole-number items they continue typing whole numbers as before

### Input behavior:

1. **Allow decimal input in the quantity field.** The input must accept a comma (`,`) or period (`.`) as a decimal separator while typing. Internally, always store and calculate with a period as the decimal separator (standard JS float), regardless of what the user typed.

2. **Maximum 2 decimal places.** If the user types more than 2 digits after the decimal point, ignore additional digits beyond the second. For example:
   - `0,5` → valid → stored as `0.5`
   - `1,25` → valid → stored as `1.25`
   - `1,253` → clamp to `1,25` — the third digit should not be accepted

3. **Minimum value is `0,01`.** Zero and empty are handled as follows:
   - If the field is empty while typing (user cleared it mid-input), hold the display but do not crash — treat as `0` for calculation until a valid number is entered
   - Do not allow negative values — clamp to `0.01` if a negative is somehow entered

4. **Price calculation must be exact and real-time.** As with whole numbers, the subtotal for that item and the cart grand total must update instantly as the user types the decimal value. Examples:
   - qty `0,5` × unit price `Rp 10.000` = `Rp 5.000`
   - qty `2,5` × unit price `Rp 10.000` = `Rp 25.000`
   - qty `1,25` × unit price `Rp 10.000` = `Rp 12.500`
   Use standard floating-point multiplication — do not round the result unless the currency formatting already handles it (e.g. displaying to nearest whole Rp).

5. **The `−` and `+` buttons** should continue to work, but when the current quantity is a decimal (e.g. `1,5`), pressing `+` adds `1` to give `2,5`, and pressing `−` subtracts `1` to give `0,5`. Do not round to whole numbers when the buttons are used on a decimal quantity.

### Display format in cart:
- Show the quantity exactly as entered, up to 2 decimal places (e.g. `0,5` not `0,50` — trim trailing zeros unless it aids readability)
- Use comma as the display separator in the cart UI to match Indonesian number conventions (e.g. display `0,5` not `0.5`)

### Receipt output:
- Show the decimal quantity exactly as stored in the quantity column on the receipt
- Use comma as the display separator on the receipt too (e.g. `0,5` not `0.5`)
- Example receipt row with decimal:
  ```
  MINYAK GORENG CURAH            0,5     5.000
    @ 10.000
  ```
- The price calculation shown (`@ unit_price`) stays the same — it always shows the per-unit price, not affected by the decimal

### What NOT to change:
- Do not change the cart item layout, styling, or any other field (name, price display, `−`/`+` buttons, `×` remove button)
- Do not change the quantity behavior for items where the cashier types whole numbers — this change is purely additive
- Do not change anything in the receipt component beyond ensuring it correctly displays a decimal quantity value if one exists

---

## General Notes for the Agent
- Tasks 1, 2, and 3 are scoped entirely to the receipt component and its styles.
- Task 4 is scoped to the cart item component and its quantity input logic, plus a minor display update in the receipt for decimal values.
- All four tasks are independent and can be done in any order.
- After completing all tasks, verify the app builds without errors.
- Tasks 1–3 can only be fully confirmed by printing a test receipt — flag this to the user after completing the receipt changes.
- Task 4 can be tested in the browser — verify with a decimal quantity (e.g. `0,5`) that the subtotal updates correctly in real time and the receipt shows the decimal value correctly.
