import * as XLSX from 'xlsx';
import type { Item, ItemPrices } from '../types';

export interface ImportResult {
  success: boolean;
  items: Item[];
  errors: ImportError[];
  stats: {
    new: number;
    updated: number;
    unchanged: number;
  };
}

export interface ImportError {
  row: number;
  message: string;
  data?: unknown;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  filename?: string;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('File harus memiliki header dan minimal 1 data');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['id', 'name', 'category', 'net', 'grosir', 'eceran'];

  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Kolom yang diperlukan tidak ditemukan: ${missingHeaders.join(', ')}`);
  }

  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

function parseExcel(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('File Excel tidak memiliki sheet');

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  if (data.length === 0) throw new Error('File Excel tidak memiliki data');

  const firstRow = data[0] as Record<string, unknown>;
  const headers = Object.keys(firstRow).map(h => h.toLowerCase());
  const requiredHeaders = ['id', 'name', 'category', 'net', 'grosir', 'eceran'];

  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Kolom yang diperlukan tidak ditemukan: ${missingHeaders.join(', ')}`);
  }

  return data as Record<string, string>[];
}

function validateAndConvertItem(row: Record<string, string>, rowIndex: number): { item: Item | null; error: ImportError | null } {
  const id = row.id?.trim();
  const name = row.name?.trim();
  const category = row.category?.trim();
  const net = parseFloat(row.net?.trim() || '0');
  const grosir = parseFloat(row.grosir?.trim() || '0');
  const eceran = parseFloat(row.eceran?.trim() || '0');

  const errors: string[] = [];

  if (!id) errors.push('ID kosong');
  if (!name) errors.push('Nama kosong');
  if (!category) errors.push('Kategori kosong');
  if (isNaN(net)) errors.push('Harga net bukan angka');
  if (isNaN(grosir)) errors.push('Harga grosir bukan angka');
  if (isNaN(eceran)) errors.push('Harga eceran bukan angka');

  if (errors.length > 0) {
    return {
      item: null,
      error: { row: rowIndex + 1, message: errors.join(', '), data: row }
    };
  }

  const prices: ItemPrices = {
    net: Math.round(net),
    grosir: Math.round(grosir),
    eceran: Math.round(eceran),
  };

  return {
    item: { id, name, category, prices },
    error: null,
  };
}

export function parseImportFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const text = new TextDecoder().decode(buffer);

        let rawData: Record<string, string>[];

        if (file.name.endsWith('.csv')) {
          rawData = parseCSV(text);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          rawData = parseExcel(buffer);
        } else {
          reject(new Error('Format file tidak didukung. Gunakan CSV atau Excel (.xlsx)'));
          return;
        }

        const items: Item[] = [];
        const errors: ImportError[] = [];
        let newCount = 0;
        let updatedCount = 0;

        rawData.forEach((row, index) => {
          const { item, error } = validateAndConvertItem(row, index);

          if (error) {
            errors.push(error);
          } else if (item) {
            items.push(item);
          }
        });

        resolve({
          success: errors.length === 0,
          items,
          errors,
          stats: {
            new: newCount,
            updated: updatedCount,
            unchanged: items.length - newCount - updatedCount,
          },
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

export function generateCSV(items: Item[]): string {
  const headers = ['id', 'name', 'category', 'net', 'grosir', 'eceran'];
  const rows = items.map(item => [
    item.id,
    `"${item.name}"`,
    `"${item.category}"`,
    item.prices.net,
    item.prices.grosir,
    item.prices.eceran,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateExcel(items: Item[]): ArrayBuffer {
  const data = items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    net: item.prices.net,
    grosir: item.prices.grosir,
    eceran: item.prices.eceran,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

export function generateJSON(items: Item[], _includeMetadata = true): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalItems: items.length,
    items,
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadFile(content: string | ArrayBuffer, filename: string, mimeType: string): void {
  const blob = content instanceof ArrayBuffer
    ? new Blob([content], { type: mimeType })
    : new Blob([content], { type: mimeType });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportItems(items: Item[], format: ExportOptions['format']): void {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  switch (format) {
    case 'json': {
      const json = generateJSON(items);
      downloadFile(json, `pos_backup_${timestamp}.json`, 'application/json');
      break;
    }
    case 'csv': {
      const csv = generateCSV(items);
      downloadFile(csv, `pos_export_${timestamp}.csv`, 'text/csv');
      break;
    }
    case 'xlsx': {
      const excel = generateExcel(items);
      downloadFile(excel, `pos_export_${timestamp}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      break;
    }
  }
}
