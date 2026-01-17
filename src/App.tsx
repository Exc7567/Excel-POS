import { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { ItemGrid } from './components/ItemGrid';
import { Cart } from './components/Cart';
import { useCart } from './hooks/useCart';
import { generateReceiptText } from './utils/escpos';
import itemsData from './data/items.json';
import type { Item, PriceType } from './types';

const STORE_NAME = 'Sembako Makmur Jaya';
const items: Item[] = itemsData.items;

const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_SIDEBAR_WIDTH = 384;

function App() {
  const [priceType, setPriceType] = useState<PriceType>('grosir');
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const cart = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddItem = (item: Item) => {
    cart.addItem(item, priceType);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;

    if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

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
    const printWindow = window.open('', '_blank', 'width=400,height=600');
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

      <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <ItemGrid
          items={items}
          priceType={priceType}
          onAddItem={handleAddItem}
        />

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden lg:block w-1 bg-gray-200 hover:bg-gray-400 cursor-col-resize transition-colors flex-shrink-0 ${
            isResizing ? 'bg-gray-400' : ''
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
    </div>
  );
}

export default App;
