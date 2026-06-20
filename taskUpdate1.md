# Sumber Kasih POS System — Update Tasks

> **Context for the agent:** This is a React + Vite POS (Point of Sale) system. Before making changes, scan the codebase to locate the relevant files: the receipt component/template (likely renders on print/checkout), the global stylesheet or theme/font config, and the item price-edit flow (navigation involving home → edit → category → price change → save). Confirm file locations match the descriptions below before editing; if the actual structure differs, adapt accordingly while preserving the intent of each task.

---

## Task 1: Update Receipt Header & Footer Text

**File(s) to find:** the receipt template/component (likely named something like `Receipt.jsx`, `ReceiptPrint.jsx`, `PrintReceipt.jsx`, or similar — may use a thermal printer formatting library, plain HTML/CSS, or a `<pre>`-style monospace render).

**Changes:**

1. **Header title:** Change the text `Sumber Kasih POS System` to `SUMBER KASIH`.
2. **Add address line:** Directly below the new `SUMBER KASIH` title, add a new line:
   ```
   JL. Trunojoyo 33 - Madiun
   ```
3. **Add phone line:** Directly below the address line, add:
   ```
   Phone: 08123447633
   ```
4. **Remove footer text:** Find and remove the line `Semoga hari Anda menyenangkan` (the closing line below "Terima kasih!"). Keep `Terima kasih!` — only remove the "Semoga hari Anda menyenangkan" line.

**Resulting header/footer should look like:**
```
=================================
         SUMBER KASIH
   JL. Trunojoyo 33 - Madiun
     Phone: 08123447633
=================================
...
=================================
        Terima kasih!
```

**Note:** If these values (store name, address, phone) are currently hardcoded as plain strings in the component, it's fine to keep them hardcoded for now — no need to build a settings/config screen unless one already exists and is the established pattern for similar text elsewhere in the app. Use your judgment based on existing code conventions.

---

## Task 2: Receipt Font Update

**Goal:** Replace the current receipt font with a clean, basic sans-serif font, and increase the base font size from `12` to `14` (assume px unless the existing code uses a different unit — match whatever unit is already used).

**Steps:**
1. Locate the CSS/style rules controlling the receipt's font (this may be in a dedicated print stylesheet, a CSS module, inline styles, or a styled-components/Tailwind class scoped to the receipt).
2. Replace the current font-family with a clean, widely-supported sans-serif stack, for example:
   ```css
   font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
   ```
3. Update the font-size value from `12` to `14` (keep existing unit, e.g. `px`, `pt`).
4. Make sure this change applies specifically to the **receipt/print view**, not the entire app UI, unless the receipt currently inherits font styling from a shared/global stylesheet — in that case, scope the override to the receipt component only so the rest of the app's UI is unaffected.

---

## Task 3: Fix Navigation After Saving Item Price Edit

**Current behavior (bug):** When editing an item's price via the flow `Home → Edit → Category → Change Price → Save`, saving redirects the user all the way back to **Home**. This forces the user to re-navigate (Home → Edit → Category → find item again) every time they want to edit another item's price — painful when editing multiple items in a row.

**Desired behavior:** After saving a price edit, the user should **remain on the same item edit screen** (the screen where they just changed the price), not be redirected to Home or even back to the category/item list. This lets them immediately make further edits to the same item, or manually navigate back to the category list themselves if they want to edit a different item — without being forcibly bounced to Home.

**Steps:**
1. Locate the save handler for the price-edit screen (likely a function like `handleSave`, `onSubmit`, `saveItemPrice`, etc., inside the item-edit component).
2. Find where it currently triggers navigation back to Home after a successful save — this is likely a `navigate('/')`, `history.push('/')`, `router.push('/')`, or similar call, possibly inside a `.then()` after an API call or state update, or a `useEffect` watching a "saved" flag.
3. Remove or guard that navigation call so it no longer redirects to Home.
4. Instead, after a successful save:
   - Keep the user on the current item edit screen.
   - Trigger a success indicator (e.g. a toast/snackbar saying "Saved" or a brief inline confirmation) so the user gets feedback that the save worked, since there's no longer a page transition to imply success.
   - Ensure the form/inputs reflect the newly saved value (e.g. if there's local state vs. saved state, sync them) so the screen doesn't look stale or revert on next interaction.
5. Confirm that any "back" or "cancel" button on this screen still correctly navigates back to the category list (this part of the flow should remain unchanged) — only the *post-save* auto-redirect to Home should be removed.

---

## General Notes for the Agent
- Preserve existing code style, naming conventions, and component structure as much as possible.
- If any of the described files/flows can't be found exactly as described, search for the closest equivalent based on behavior (e.g. search for the string `Sumber Kasih POS System` or `Semoga hari Anda menyenangkan` to locate the receipt component; search for navigation calls near price-save logic to find Task 3's target).
- After making changes, do a quick sanity check that the app still builds/runs without errors.
