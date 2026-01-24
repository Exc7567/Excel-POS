import React, { useState, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { ItemGrid } from "./components/ItemGrid";
import { Cart } from "./components/Cart";
import { useCart } from "./hooks/useCart";
import { generateReceiptText } from "./utils/escpos";
import itemsData from "./data/items.json";
import type { Item, PriceType } from "./types";

const STORE_NAME = "Sembako Makmur Jaya";
const items: Item[] = itemsData.items;

const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_SIDEBAR_WIDTH = 384;

function App() {
  const [priceType, setPriceType] = useState<PriceType>("grosir");
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editValues, setEditValues] = useState<{
    name: string;
    category: string;
    prices: { net: number; grosir: number; eceran: number };
  } | null>(null);
  const cart = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddItem = (item: Item) => {
    cart.addItem(item, priceType);
  };

  const handleEditItem = (item: Item) => {
    setEditItem(item);
    setEditValues({
      name: item.name,
      category: item.category || "",
      prices: { ...item.prices },
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editValues) return;
    const { name, value } = e.target;
    if (name === "name") {
      setEditValues({ ...editValues, name: value });
      return;
    }
    if (name === "category") {
      setEditValues({ ...editValues, category: value });
      return;
    }
    // price fields: net, grosir, eceran
    if (name === "net" || name === "grosir" || name === "eceran") {
      setEditValues({
        ...editValues,
        prices: { ...editValues.prices, [name]: Number(value) },
      });
    }
  };

  const handleEditSave = () => {
    if (!editItem || !editValues) return;
    // This only updates in-memory, not persistent storage
    editItem.name = editValues.name;
    editItem.category = editValues.category;
    editItem.prices = { ...editValues.prices };
    setEditItem(null);
    setEditValues(null);
  };

  const handleEditCancel = () => {
    setEditItem(null);
    setEditValues(null);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handlePrint = () => {
    const receiptData = {
      storeName: STORE_NAME,
      items: cart.items,
      total: cart.total,
    };

    const text = generateReceiptText(receiptData);
    console.log(text);

    // Create a printable window
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                padding: 20px;
                white-space: pre;
                line-height: 1.4;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>${text}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      cart.clearCart();
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-gray-50"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Header priceType={priceType} onPriceTypeChange={setPriceType} />

      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row overflow-hidden"
      >
        <ItemGrid
          items={items}
          priceType={priceType}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
        />

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden lg:block w-1 bg-gray-200 hover:bg-gray-400 cursor-col-resize transition-colors flex-shrink-0 ${
            isResizing ? "bg-gray-400" : ""
          }`}
        />

        <Cart
          items={cart.items}
          subtotal={cart.subtotal}
          total={cart.total}
          width={sidebarWidth}
          onUpdateQuantity={cart.updateQuantity}
          onRemove={cart.removeItem}
          onClear={cart.clearCart}
          onPrint={handlePrint}
        />
      </div>

      {/* Edit Modal */}
      {editItem && editValues && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4">Edit Item</h3>
            <div className="mb-2">
              <label className="block text-sm font-medium">Nama</label>
              <input
                name="name"
                value={editValues.name}
                onChange={handleEditChange}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Kategori</label>
              <input
                name="category"
                value={editValues.category}
                onChange={handleEditChange}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Harga Net</label>
              <input
                name="net"
                type="number"
                value={editValues.prices.net}
                onChange={handleEditChange}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Harga Grosir</label>
              <input
                name="grosir"
                type="number"
                value={editValues.prices.grosir}
                onChange={handleEditChange}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Harga Eceran</label>
              <input
                name="eceran"
                type="number"
                value={editValues.prices.eceran}
                onChange={handleEditChange}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleEditSave}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Simpan
              </button>
              <button
                onClick={handleEditCancel}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
