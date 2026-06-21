# Sumber Kasih POS System — Receipt Width Fix

> **Context for the agent:** This is a React + Vite POS system. The header/footer text changes and font update from `POS_UPDATE_TASKS.md` have already been applied and printed successfully (see attached photo reference). The printed receipt currently has visible empty margin space on the left and right sides of the paper — the content area is narrower than the actual paper width. The goal of this task is to widen the printable content so it stretches closer to the left and right edges of the receipt paper, removing that wasted whitespace.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before touching any code, **analyze the existing structure** of the receipt component, its print stylesheet, and any printer configuration (e.g. paper width settings, `@media print` rules, ESC/POS width/column settings, or a print library's page-size config).

If you find that:
- The current narrow width is intentionally set to match a specific printer's safe print area (common with thermal printers, which often have a non-printable margin baked into the hardware), or
- Widening the content risks text being cut off, mirrored, or misaligned on the actual printer output, or
- The width value is shared/reused by other components or print templates, and changing it could break those, or
- There's any other reason this change could cause the receipt to print incorrectly, fail to print, garble characters, or otherwise affect the rest of the app

**→ STOP and warn me with a clear explanation before making the change.** Do not proceed with the edit silently. Explain what you found and what the risk is, and wait for my confirmation.

If the analysis shows the change is safe (e.g. the width is just a CSS value with margin/padding that can be safely increased, with no hardware-specific constraints), proceed with the fix below.

---

## Task: Widen Receipt Print Content

**Goal:** Reduce/remove the left and right margin so the printed receipt content fills more of the paper's horizontal space, closer to both edges.

**Steps:**
1. Locate the CSS/print styles controlling the receipt's container width — likely in the same stylesheet or component touched for the font change in `POS_UPDATE_TASKS.md` (e.g. a print-specific CSS file, `@media print` block, or inline/styled-component styles on the receipt container).
2. Identify what's currently constraining the width — this could be:
   - A fixed `width` or `max-width` value smaller than the paper width
   - Horizontal `padding` or `margin` on the receipt container
   - A printer/page-size config value (e.g. in an ESC/POS or print library config) that doesn't match the actual paper width
3. Adjust the relevant value(s) so the content stretches wider, leaving only a small, even margin on each side (just enough to avoid text touching the very edge — a few millimeters is typical for thermal receipt printers).
4. Make sure the change is **symmetrical** — left and right spacing should remain equal after the fix, not skewed to one side.
5. Scope this change to the **receipt/print view only** — do not affect the width/layout of other parts of the app's UI.

**Note on testing:** Since this involves physical print output, the visual effect can only be fully confirmed by printing a test receipt. After making the code change, let me know so I can print a test receipt and confirm whether the spacing looks correct, in case further fine-tuning is needed.

---

## General Notes for the Agent
- Preserve existing code style, naming conventions, and component structure as much as possible.
- Do not modify unrelated parts of the receipt template (text content, font, etc.) — this task is scoped only to width/margin.
- If the width is controlled by a printer driver setting outside the codebase (e.g. OS print dialog or printer driver config) rather than in the app's code, tell me — that would need to be adjusted outside the IDE rather than in the codebase.
