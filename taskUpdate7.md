# Sumber Kasih POS System — Task Update 7

> **Context for the agent:** This is a React + Vite POS system. This task replaces the existing "Export CSV" feature in the Riwayat Transaksi page with a new "Export JSON" feature. The primary goal of this export is not just reporting — it is a **full data migration backup**. The exported JSON must be complete, accurate, and structured so it can be directly used to seed or migrate data into a new database (e.g. Supabase) in the future. Every available field from every transaction — both the list-level data and the full detail-level data — must be captured. Scan the Riwayat component, the transaction detail modal, and the current CSV export logic before making any changes.

---

## ⚠️ Before Making Any Changes — Mandatory Analysis Step

Before editing anything, analyze:
- The current CSV export function — what data it currently reads, how it collects transactions, and how it triggers the file download
- The transaction data structure in state/localStorage — specifically confirm that **detail-level data** (individual item names, quantities, unit prices, subtotals, tipe harga, bayar, kembalian/hutang) is stored per transaction and accessible at export time, not just the list-level summary fields (ID, waktu, total, status)
- Whether the active period filter is applied before the export, or if the export reads all data directly

**If detail-level data is not stored per transaction (only summary fields are saved), stop and warn me before proceeding** — the JSON export must include full detail data, and the data structure may need to be updated first.

If the change risks breaking the existing filter, search, or Riwayat display logic, **stop and warn me** before proceeding.

---

## Task: Replace CSV Export with Full JSON Export

### Step 1 — Update the Export Button UI

1. Locate the "Export CSV" button in the Riwayat Transaksi page header (visible in the top-right corner in the UI screenshots).
2. Change the button label from **"Export CSV"** to **"Export JSON"**.
3. Keep the button's position, styling, and icon exactly the same — only the label text changes.
4. Wire the button to the new JSON export function (Step 2) instead of the old CSV export function.
5. The old CSV export function can be removed entirely once the JSON export is working.

---

### Step 2 — Build the JSON Export Function

**Export scope:** Export only the transactions currently shown by the active period filter (e.g. if the filter is set to "30 Hari Terakhir", only those transactions are exported). This matches what the user sees on screen.

**File naming:** Name the downloaded file with the current filter period and export timestamp so it is easy to identify later. Format:
```
sumber-kasih-riwayat-[filter-label]-[YYYY-MM-DD].json
```
Example: `sumber-kasih-riwayat-30hari-2026-07-08.json`

**JSON structure:** A single flat array of transaction objects. Each object represents one complete transaction with all of its detail data nested inside. This structure is chosen specifically because it is the most compatible format for direct database insertion (e.g. Supabase `insert` calls) — no transformation needed.

**Each transaction object must include ALL of the following fields:**

```json
[
  {
    "id": "TXN_20260625_011501_5Y9M",
    "tanggal_waktu": "2026-06-25T01:15:01",
    "tipe_harga": "Grosir",
    "items": [
      {
        "nama_item": "TAWON BOTOL PLASTIK",
        "kategori": "KECAP",
        "qty": 2,
        "harga_satuan": 17000,
        "subtotal": 34000
      }
    ],
    "subtotal": 34000,
    "total": 34000,
    "bayar": 35000,
    "kembalian": 1000,
    "hutang": 0,
    "status": "Lunas"
  }
]
```

**Field definitions — do not skip any:**
- `id` — the full transaction ID string (e.g. `TXN_20260625_011501_5Y9M`)
- `tanggal_waktu` — full ISO 8601 timestamp of the transaction (`YYYY-MM-DDTHH:mm:ss`)
- `tipe_harga` — pricing type used (e.g. `"Grosir"`, `"Eceran"`, or whatever values exist in the system)
- `items` — array of all items in the transaction, each containing:
  - `nama_item` — full item name, not truncated
  - `kategori` — item category (e.g. `"ROKOK"`, `"MIE"`, `"SUSU & MINUMAN"`)
  - `qty` — quantity purchased (integer)
  - `harga_satuan` — unit price per single item (numeric, no currency symbol)
  - `subtotal` — qty x harga_satuan for that line item (numeric)
- `subtotal` — sum of all item subtotals before any adjustments (numeric)
- `total` — final transaction total (numeric)
- `bayar` — amount paid by the customer (numeric). If not stored for older transactions, use `0` as default and note this in the export
- `kembalian` — change returned to customer (numeric). `0` if none or if hutang applies
- `hutang` — amount owed by customer (numeric). `0` if fully paid. For "Belum Lunas" transactions this will be `total - bayar`
- `status` — `"Lunas"` or `"Belum Lunas"`. For old transactions without a stored status, default to `"Lunas"` (consistent with how Riwayat renders them)

**Numeric values:** Store all currency amounts as plain numbers (integers or floats), not formatted strings. So `34000` not `"Rp 34.000"`. This ensures the JSON is directly usable for database insertion without string parsing.

**Encoding:** Export as UTF-8 to ensure Indonesian characters (if any) are preserved correctly.

---

### Step 3 — Trigger the File Download

Use the standard browser download pattern — create a Blob from the JSON string and trigger a download via a temporary anchor element. Do not open the JSON in a new tab — it must download directly as a `.json` file.

```javascript
const json = JSON.stringify(exportData, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
URL.revokeObjectURL(url);
```

Use `JSON.stringify` with `null, 2` so the output is pretty-printed and human-readable — important since this file will also be reviewed manually during data migration.

---

## General Notes for the Agent
- The old CSV export function should be fully removed once JSON export is working — do not leave dead code behind.
- Do not change anything else in the Riwayat page — filter, search, transaction list display, detail modal, and all other UI elements remain unchanged.
- After completing the task, verify the app builds without errors.
- Test the export by clicking the button with a few different filter settings and confirming the downloaded `.json` file contains the correct transactions with all detail fields populated.
- Flag to the user if any transactions are found to be missing detail-level data (e.g. older transactions saved before item detail was stored per transaction) — note which fields are missing so the user can decide how to handle those records in the migration.
