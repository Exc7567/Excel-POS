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

function formatItemLine(name: string, qty: number, price: string): string {
  const qtyStr = `x${qty}`;
  const nameMaxLen = LINE_WIDTH - qtyStr.length - price.length - 2;
  const truncatedName =
    name.length > nameMaxLen ? name.substring(0, nameMaxLen) : name;

  const leftPart = padRight(truncatedName, nameMaxLen);
  const rightPart = padLeft(qtyStr + " " + price, LINE_WIDTH - nameMaxLen);

  return leftPart + rightPart + "\n";
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
  items: CartItem[];
  total: number;
}

export function generateReceipt(data: ReceiptData): Uint8Array {
  const { storeName, items, total } = data;
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
    textToBytes(createLine("=")),
    BOLD_OFF,
    ALIGN_LEFT,
    textToBytes(`Tanggal: ${dateStr}  Jam: ${timeStr}\n`),
    FEED_LINE,
    textToBytes(createLine("-")),
  ];

  // Add items
  for (const item of items) {
    const price = item.prices[item.priceType];
    parts.push(
      textToBytes(
        formatItemLine(
          item.name,
          item.quantity,
          formatPrice(price * item.quantity),
        ),
      ),
    );
  }

  parts.push(
    textToBytes(createLine("-")),
    BOLD_ON,
    textToBytes(createLine("=")),
    DOUBLE_HEIGHT_ON,
    textToBytes(formatTotalLine("TOTAL:", formatPrice(total))),
    NORMAL_SIZE,
    BOLD_OFF,
    textToBytes(createLine("=")),
    FEED_LINE,
    ALIGN_CENTER,
    textToBytes(centerText("Terima kasih!")),
    textToBytes(centerText("Semoga hari Anda menyenangkan")),
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
  const { storeName, items, total } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID");
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let text = "";
  text += createLine("=");
  text += centerText(storeName);
  text += createLine("=");
  text += `Tanggal: ${dateStr}  Jam: ${timeStr}\n`;
  text += "\n";
  text += createLine("-");

  for (const item of items) {
    const price = item.prices[item.priceType];
    text += formatItemLine(
      item.name,
      item.quantity,
      formatPrice(price * item.quantity),
    );
  }

  text += createLine("-");
  text += createLine("=");
  text += formatTotalLine("TOTAL:", formatPrice(total));
  text += createLine("=");
  text += "\n";
  text += centerText("Terima kasih!");
  text += centerText("Semoga hari Anda menyenangkan");

  return text;
}
