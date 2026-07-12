import type { CartItem } from "../types";

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// Initialize printer
export const INIT = new Uint8Array([ESC, 0x40]);

// Text alignment
export const ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]);
export const ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]);
export const ALIGN_RIGHT = new Uint8Array([ESC, 0x61, 0x02]);

// Text formatting
export const BOLD_ON = new Uint8Array([ESC, 0x45, 0x01]);
export const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]);
export const DOUBLE_HEIGHT_ON = new Uint8Array([GS, 0x21, 0x01]);
export const DOUBLE_WIDTH_ON = new Uint8Array([GS, 0x21, 0x10]);
export const DOUBLE_SIZE_ON = new Uint8Array([GS, 0x21, 0x11]);
export const NORMAL_SIZE = new Uint8Array([GS, 0x21, 0x00]);

// Line feed and cut
export const FEED_LINE = new Uint8Array([LF]);
export const FEED_LINES = (n: number) => new Uint8Array([ESC, 0x64, n]);
export const CUT_PAPER = new Uint8Array([GS, 0x56, 0x00]);
export const PARTIAL_CUT = new Uint8Array([GS, 0x56, 0x01]);

// Separator line (32 chars for 58mm, 48 chars for 80mm)
const LINE_WIDTH = 32;

function textToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

function padRight(str: string, length: number): string {
  return str.length >= length
    ? str.substring(0, length)
    : str + " ".repeat(length - str.length);
}

// @ts-ignore: Utility function kept for potential future use
function padLeft(str: string, length: number): string {
  return str.length >= length
    ? str.substring(0, length)
    : " ".repeat(length - str.length) + str;
}

function createLine(char: string = "-"): string {
  return char.repeat(LINE_WIDTH) + "\n";
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID").format(price);
}

// Format quantity for receipt display: use comma as decimal separator (Indonesian convention)
// Trim trailing zeros: 0.5 → "0,5", 1.25 → "1,25", 2 → "2"
function formatQty(qty: number): string {
  const rounded = Math.round(qty * 100) / 100;
  return rounded.toString().replace('.', ',');
}

function formatItemLines(name: string, qty: number, unitPrice: number): string {
  const totalPrice = formatPrice(unitPrice * qty);
  const qtyStr = formatQty(qty);
  // Layout: [name] [qty] [totalPrice]  — all fitting in LINE_WIDTH
  // Reserve space: 1 space before qty, qty width, 1 space after qty, totalPrice width
  const totalPriceWidth = totalPrice.length;
  const qtyWidth = Math.max(qtyStr.length, 2); // at least 2 chars for qty column
  const nameMaxLen = LINE_WIDTH - totalPriceWidth - qtyWidth - 2; // 2 spaces as gaps
  const truncatedName =
    name.length > nameMaxLen ? name.substring(0, nameMaxLen) : name;

  // Line 1: Item name (left) + qty (fixed column) + total price (right, no Rp)
  const line1 = padRight(truncatedName, nameMaxLen) + " " + padLeft(qtyStr, qtyWidth) + " " + padLeft(totalPrice, totalPriceWidth) + "\n";

  // Line 2: @ unit_price (indented, smaller)
  const calcStr = `  @ ${formatPrice(unitPrice)}`;
  const line2 = calcStr + "\n";

  return line1 + line2 + "\n";
}

function formatTotalLine(label: string, value: string): string {
  const labelPadded = padRight(label, LINE_WIDTH - value.length);
  return labelPadded + value + "\n";
}

function centerText(text: string): string {
  if (text.length >= LINE_WIDTH) return text.substring(0, LINE_WIDTH) + "\n";
  const padding = Math.floor((LINE_WIDTH - text.length) / 2);
  return " ".repeat(padding) + text + "\n";
}

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  items: CartItem[];
  total: number;
  uangDibayar?: number;
  kembalian?: number;
  hutang?: number;
}

export function generateReceipt(data: ReceiptData): Uint8Array {
  const { storeName, storeAddress, storePhone, items, total } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID");
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts: Uint8Array[] = [
    INIT,
    ALIGN_CENTER,
    BOLD_ON,
    textToBytes(createLine("=")),
    DOUBLE_SIZE_ON,
    textToBytes(centerText(storeName)),
    NORMAL_SIZE,
  ];

  if (storeAddress) {
    parts.push(textToBytes(centerText(storeAddress)));
  }
  if (storePhone) {
    parts.push(textToBytes(centerText(`Phone: ${storePhone}`)));
  }

  parts.push(
    textToBytes(createLine("=")),
    BOLD_OFF,
    ALIGN_LEFT,
    textToBytes(`Tanggal: ${dateStr}  Jam: ${timeStr}\n`),
    FEED_LINE,
    textToBytes(createLine("-")),
  );

  // Add items
  for (const item of items) {
    const unitPrice = item.prices[item.priceType];
    const totalPrice = formatPrice(unitPrice * item.quantity);
    const qtyStr = formatQty(item.quantity);
    // Layout: [name] [qty] [totalPrice] — fitting in LINE_WIDTH
    const qtyWidth = Math.max(qtyStr.length, 2);
    const totalPriceWidth = totalPrice.length;
    const nameMaxLen = LINE_WIDTH - totalPriceWidth - qtyWidth - 2; // 2 spaces as gaps
    const truncatedName =
      item.name.length > nameMaxLen ? item.name.substring(0, nameMaxLen) : item.name;
    const line1 = padRight(truncatedName, nameMaxLen) + " " + padLeft(qtyStr, qtyWidth) + " " + padLeft(totalPrice, totalPriceWidth) + "\n";
    parts.push(textToBytes(line1));

    // Line 2: @ unit_price (same font size as Row 1)
    const calcStr = `  @ ${formatPrice(unitPrice)}\n`;
    parts.push(textToBytes(calcStr));
    parts.push(FEED_LINE); // Gap between items
  }

  parts.push(
    textToBytes(createLine("-")),
    BOLD_ON,
    textToBytes(createLine("=")),
    DOUBLE_HEIGHT_ON,
    textToBytes(formatTotalLine("TOTAL:", formatPrice(total))),
    NORMAL_SIZE,
  );

  // Payment info (BAYAR / KEMBALIAN or HUTANG)
  if (data.uangDibayar !== undefined) {
    const isHutang = (data.hutang ?? 0) > 0;
    parts.push(
      BOLD_ON,
      textToBytes(formatTotalLine("BAYAR:", formatPrice(data.uangDibayar))),
      textToBytes(formatTotalLine(
        isHutang ? "HUTANG:" : "KEMBALIAN:",
        formatPrice(isHutang ? (data.hutang ?? 0) : (data.kembalian ?? 0))
      )),
      BOLD_OFF,
    );
  }

  parts.push(
    textToBytes(createLine("=")),
    BOLD_OFF,
    FEED_LINE,
    ALIGN_CENTER,
    textToBytes(centerText("Terima kasih!")),
    FEED_LINES(4),
    PARTIAL_CUT,
  );

  // Calculate total length
  const totalLength = parts.reduce((acc, part) => acc + part.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

// Plain text receipt for preview
export function generateReceiptText(data: ReceiptData): string {
  const { storeName, storeAddress, storePhone, items, total } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID");
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let text = "";
  text += createLine("=");
  text += centerText(storeName);
  if (storeAddress) {
    text += centerText(storeAddress);
  }
  if (storePhone) {
    text += centerText(`Phone: ${storePhone}`);
  }
  text += createLine("=");
  text += `Tanggal: ${dateStr}  Jam: ${timeStr}\n`;
  text += "\n";
  text += createLine("-");

  for (const item of items) {
    const unitPrice = item.prices[item.priceType];
    text += formatItemLines(item.name, item.quantity, unitPrice);
  }

  text += createLine("-");
  text += createLine("=");
  text += formatTotalLine("TOTAL:", formatPrice(total));

  // Payment info (BAYAR / KEMBALIAN or HUTANG)
  if (data.uangDibayar !== undefined) {
    const isHutang = (data.hutang ?? 0) > 0;
    text += formatTotalLine("BAYAR:", formatPrice(data.uangDibayar));
    text += formatTotalLine(
      isHutang ? "HUTANG:" : "KEMBALIAN:",
      formatPrice(isHutang ? (data.hutang ?? 0) : (data.kembalian ?? 0))
    );
  }

  text += createLine("=");
  text += "\n";
  text += centerText("Terima kasih!");

  return text;
}

// HTML receipt for print preview (works with proportional fonts)
export function generateReceiptHTML(data: ReceiptData): string {
  const { storeName, storeAddress, storePhone, items, total } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID");
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sep = (char: string) =>
    `<div class="separator">${char.repeat(200)}</div>`;

  let html = "";

  // Header
  html += sep("=");
  html += `<div class="center bold store-name">${storeName}</div>`;
  if (storeAddress) {
    html += `<div class="center store-info">${storeAddress}</div>`;
  }
  if (storePhone) {
    html += `<div class="center store-info">Phone: ${storePhone}</div>`;
  }
  html += sep("=");

  // Date/time
  html += `<div class="date-line">Tanggal: ${dateStr} &nbsp; Jam: ${timeStr}</div>`;
  html += sep("-");

  // Items
  for (const item of items) {
    const unitPrice = item.prices[item.priceType];
    const totalPrice = formatPrice(unitPrice * item.quantity);
    const unitPriceFormatted = formatPrice(unitPrice);
    html += `<div class="item-block">`;
    html += `<div class="item-row">`;
    html += `<span class="item-name">${item.name}</span>`;
    html += `<span class="item-qty">${formatQty(item.quantity)}</span>`;
    html += `<span class="item-price">${totalPrice}</span>`;
    html += `</div>`;
    html += `<div class="item-calc">@ ${unitPriceFormatted}</div>`;
    html += `</div>`;
  }

  // Total — wrapped in bottom-section for tighter spacing
  html += `<div class="bottom-section">`;
  html += sep("-");
  html += sep("=");
  html += `<div class="total-row">`;
  html += `<span class="total-label">TOTAL:</span>`;
  html += `<span class="total-value">${formatPrice(total)}</span>`;
  html += `</div>`;

  // Payment info (BAYAR / KEMBALIAN or HUTANG)
  if (data.uangDibayar !== undefined) {
    const isHutang = (data.hutang ?? 0) > 0;
    html += `<div class="payment-row">`;
    html += `<span class="payment-label">BAYAR:</span>`;
    html += `<span class="payment-value">${formatPrice(data.uangDibayar)}</span>`;
    html += `</div>`;
    html += `<div class="payment-row">`;
    html += `<span class="payment-label">${isHutang ? 'HUTANG:' : 'KEMBALIAN:'}</span>`;
    html += `<span class="payment-value">${formatPrice(isHutang ? (data.hutang ?? 0) : (data.kembalian ?? 0))}</span>`;
    html += `</div>`;
  }

  html += sep("=");
  html += `</div>`;

  // Footer
  html += `<div class="center footer">Terima kasih!</div>`;

  return html;
}
