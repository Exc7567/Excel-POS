import { useState } from "react";
import { Header } from "./components/Header";
import { ItemGridWithSearch } from "./components/ItemGrid";
import { Cart } from "./components/Cart";
import { Sidebar } from "./components/Sidebar";
import { ImportExportModal } from "./components/ImportExportModal";
import { TransactionHistory } from "./components/TransactionHistory";
import { TransactionDetail } from "./components/TransactionDetail";
import { ReportsModal } from "./components/ReportsModal";
import { EditItemsModal } from "./components/EditItemsModal";
import { useCart } from "./hooks/useCart";
import { useItems } from "./hooks/useItems";
import { useTransactions } from "./hooks/useTransactions";
import { generateReceiptText } from "./utils/escpos";
import { generateTransactionId } from "./types/transaction";
import type { Item, PriceType } from "./types";
import type { Transaction } from "./types/transaction";

const STORE_NAME = "Sumber Kasih POS System";
const CART_WIDTH = 384;

function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(window.innerWidth >= 1024);
  const [priceType, setPriceType] = useState<PriceType>("grosir");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const cart = useCart();
  const { items, updateItem, setItems, deleteItem } = useItems();
  const { transactions, addTransaction, stats, exportToCSV, clearAll } = useTransactions();

  // Legacy edit states removed

  const handleAddItem = (item: Item) => {
    cart.addItem(item, priceType);
  };

  const handleImport = (importedItems: Item[]) => {
    setItems(importedItems);
  };

  const handlePrint = () => {
    // ... same printing logic ...
    if (cart.items.length === 0) return;

    const transaction: Transaction = {
      id: generateTransactionId(),
      items: [...cart.items],
      subtotal: cart.subtotal,
      total: cart.total,
      priceType,
      timestamp: new Date(),
    };

    addTransaction(transaction);

    const receiptData = {
      storeName: STORE_NAME,
      items: cart.items,
      total: cart.total,
    };

    const text = generateReceiptText(receiptData);
    // console.log(text);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'pos':
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Header
              priceType={priceType}
              onPriceTypeChange={setPriceType}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <ItemGridWithSearch
                items={items}
                priceType={priceType}
                onAddItem={handleAddItem}
                searchQuery={searchQuery}
              />
              <Cart
                items={cart.items}
                subtotal={cart.subtotal}
                total={cart.total}
                width={CART_WIDTH}
                onUpdateQuantity={cart.updateQuantity}
                onRemove={cart.removeItem}
                onClear={cart.clearCart}
                onPrint={handlePrint}
              />
            </div>
          </div>
        );
      case 'reports':
        return (
          <ReportsModal
            transactions={transactions}
          />
        );
      case 'history':
        return (
          <TransactionHistory
            transactions={transactions}
            onSelectTransaction={setSelectedTransaction}
            stats={stats}
            onExportCSV={() => {
              const csv = exportToCSV();
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
            }}
            onClearAll={clearAll}
          />
        );
      case 'data':
        return (
          <ImportExportModal
            currentItems={items}
            onImport={handleImport}
          />
        );
      case 'edit':
        return (
          <EditItemsModal
            items={items}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
          />
        );
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => {
          const newState = !sidebarOpen;
          setSidebarOpen(newState);
          setSidebarExpanded(newState);
        }}
        isExpanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
        activeTab={activeTab}
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        transactionCount={transactions.length}
      />

      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ml-0 ${sidebarExpanded ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {renderContent()}
      </div>

      {/* Transaction Detail Modal (Still a popup) */}
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}

export default App;
