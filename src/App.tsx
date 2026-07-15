import { useState, useCallback } from "react";
import { PaymentModal } from "./components/PaymentModal";
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
import { generateReceiptHTML } from "./utils/escpos";
import { generateTransactionId } from "./types/transaction";
import type { Item, PriceType } from "./types";
import type { Transaction } from "./types/transaction";

const STORE_NAME = "SUMBER KASIH";
const STORE_ADDRESS = "JL. Trunojoyo 33 - Madiun";
const CART_WIDTH = 384;

function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(window.innerWidth >= 1024);
  const [priceType, setPriceType] = useState<PriceType>("grosir");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const cart = useCart();
  const { items, updateItem, deleteItem, addItem, loading: itemsLoading, error: itemsError } = useItems();
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAll,
    loading: transactionsLoading,
  } = useTransactions();

  // Toast state for sync / error feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string, durationMs = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), durationMs);
  }, []);

  // Legacy edit states removed

  const handleAddItem = (item: Item) => {
    cart.addItem(item, priceType);
  };



  // Import: Add or update all imported items in Supabase
  const handleImport = async (importedItems: Item[]) => {
    for (const item of importedItems) {
      const exists = items.some(existing => String(existing.id) === String(item.id));
      if (exists) {
        await updateItem(item.id, item);
      } else {
        await addItem(item);
      }
    }
  };

  const handlePrint = () => {
    if (cart.items.length === 0) return;
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (uangDibayar: number, kembalian: number, hutang: number) => {
    setShowPaymentModal(false);

    const isReprint = !!cart.reprintTransactionId;
    const status: 'Lunas' | 'Belum Lunas' = hutang > 0 ? 'Belum Lunas' : 'Lunas';

    const transaction: Transaction = {
      id: isReprint ? cart.reprintTransactionId! : generateTransactionId(),
      items: [...cart.items],
      subtotal: cart.subtotal,
      total: cart.total,
      priceType,
      timestamp: new Date(),
      uangDibayar,
      kembalian,
      status,
      hutang,
    };

    // Fire-and-forget: Supabase insert/update with offline fallback.
    // Receipt printing + cart clearing happen regardless of sync success.
    if (isReprint) {
      updateTransaction(transaction).then((res) => {
        if (!res.success) {
          showToast('⚠️ Transaksi disimpan lokal, akan disinkron otomatis');
        }
      });
      cart.clearReprintId();
    } else {
      addTransaction(transaction).then((res) => {
        if (!res.success) {
          showToast('⚠️ Transaksi disimpan lokal, akan disinkron otomatis');
        }
      });
    }

    const receiptData = {
      storeName: STORE_NAME,
      storeAddress: STORE_ADDRESS,
      items: cart.items,
      total: cart.total,
      uangDibayar,
      kembalian,
      hutang,
    };

    const receiptHTML = generateReceiptHTML(receiptData);

    const printWindow = window.open("", "_blank", "width=1000,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
                font-size: 11px;
                padding: 2px 20px 20px 20px;
                line-height: 1.5;
                max-width: 320px;
                margin: 0 auto;
              }
              .separator {
                overflow: hidden;
                white-space: nowrap;
                font-size: 11px;
                line-height: 1.3;
                color: #333;
                letter-spacing: -0.5px;
              }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .store-name {
                font-size: 18px;
                padding: 4px 0;
                letter-spacing: 1px;
              }
              .store-info {
                font-size: 13px;
                color: #444;
                padding: 1px 0;
              }
              .date-line {
                padding: 6px 0;
                font-size: 13px;
              }
              .item-block {
                margin-bottom: 6px;
              }
              .item-row {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                padding: 2px 0 0 0;
                gap: 4px;
              }
              .item-name {
                flex: 1;
                word-break: break-word;
              }
              .item-price {
                flex-shrink: 0;
                text-align: right;
                min-width: 70px;
                font-variant-numeric: tabular-nums;
              }
              .item-qty {
                flex-shrink: 0;
                text-align: center;
                min-width: 16px;
                padding: 0 2px;
                font-variant-numeric: tabular-nums;
              }
              .item-calc {
                color: #444;
                padding-left: 8px;
                padding-top: 1px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                padding: 2px 0;
                font-weight: bold;
                font-size: 14px;
              }
              .total-label { }
              .total-value {
                text-align: right;
                font-variant-numeric: tabular-nums;
              }
              .payment-row {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                padding: 1px 0;
                font-size: 12px;
              }
              .payment-label { }
              .payment-value {
                text-align: right;
                font-variant-numeric: tabular-nums;
              }
              .footer {
                padding: 8px 0 4px;
                font-size: 11px;
              }
              .bottom-section {
                line-height: 1.25;
              }
              .bottom-section .separator {
                line-height: 0.8;
                margin: 0;
                padding: 0;
              }
              @page { margin: 0; }
              @media print {
                body { padding: 0 1mm 1mm 1mm; margin: 0; max-width: none; width: 100%; }
              }
            </style>
          </head>
          <body>${receiptHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      cart.clearCart();
    }
  };

  const handleCetakUlang = (transaction: Transaction) => {
    if (cart.items.length > 0) {
      const confirmed = window.confirm(
        'Keranjang Anda saat ini berisi item. Ganti dengan item dari transaksi ini?'
      );
      if (!confirmed) return;
    }

    // Load items from the transaction into the cart
    cart.setCartItems(transaction.items, transaction.id);

    // Set the price type to match the transaction
    setPriceType(transaction.priceType);

    // Close the modal and navigate to POS
    setSelectedTransaction(null);
    setActiveTab('pos');
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
            loading={transactionsLoading}
            onExportJSON={(filteredTransactions, periodLabel) => {
              const priceTypeLabel = (pt: string) => {
                switch (pt) {
                  case 'grosir': return 'Grosir';
                  case 'eceran': return 'Eceran';
                  case 'net': return 'Net';
                  default: return pt;
                }
              };

              const exportData = filteredTransactions.map((t) => {
                const ts = new Date(t.timestamp);
                const pad = (n: number) => n.toString().padStart(2, '0');
                const isoLocal = `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}T${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`;

                return {
                  id: t.id,
                  tanggal_waktu: isoLocal,
                  tipe_harga: priceTypeLabel(t.priceType),
                  items: t.items.map((item) => {
                    const hargaSatuan = item.prices[item.priceType] ?? 0;
                    return {
                      nama_item: item.name,
                      kategori: item.category ?? '',
                      qty: item.quantity,
                      harga_satuan: hargaSatuan,
                      subtotal: hargaSatuan * item.quantity,
                    };
                  }),
                  subtotal: t.subtotal,
                  total: t.total,
                  bayar: t.uangDibayar ?? 0,
                  kembalian: t.kembalian ?? 0,
                  hutang: t.hutang ?? 0,
                  status: t.status ?? 'Lunas',
                };
              });

              const json = JSON.stringify(exportData, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sumber-kasih-riwayat-${periodLabel}-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            onDeleteAll={async () => {
              const result = await deleteAll();
              if (result.success) {
                showToast('✅ Semua data transaksi berhasil dihapus');
              } else {
                showToast('❌ Gagal menghapus: ' + (result.error || 'Unknown error'));
              }
              return result;
            }}
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
        {itemsLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Loading items...</div>
        ) : itemsError ? (
          <div className="flex-1 flex items-center justify-center text-red-500">{itemsError}</div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={cart.total}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}

      {/* Transaction Detail Modal (Still a popup) */}
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onCetakUlang={handleCetakUlang}
          onDelete={async (id: string) => {
            const result = await deleteTransaction(id);
            if (result.success) {
              setSelectedTransaction(null);
              showToast('✅ Transaksi berhasil dihapus');
            }
            return result;
          }}
        />
      )}

      {/* Sync/Error Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in max-w-md text-center">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
