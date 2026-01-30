import { useState, useMemo } from 'react';
import type { Item } from '../types';

interface EditItemsModalProps {
  items: Item[];
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onDeleteItem: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export function EditItemsModal({
  items,
  onUpdateItem,
  onDeleteItem,
}: EditItemsModalProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    net: 0,
    grosir: 0,
    eceran: 0,
  });

  const categories = useMemo(() => {
    const cats = items.map((item) => item.category).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      category: item.category || '',
      net: item.prices.net,
      grosir: item.prices.grosir,
      eceran: item.prices.eceran,
    });
  };

  const saveEdit = (id: string) => {
    onUpdateItem(id, {
      name: editForm.name,
      category: editForm.category,
      prices: {
        net: editForm.net,
        grosir: editForm.grosir,
        eceran: editForm.eceran,
      },
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };



  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 pl-12 lg:pl-0">Edit Items</h2>
        <div className="flex gap-2">
          {/* Actions can go here */}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Cari items..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-[200px] p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500 self-center">
                {filteredItems.length} items
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 text-left w-12">#</th>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">Kategori</th>
                  <th className="p-3 text-right">Net</th>
                  <th className="p-3 text-right">Grosir</th>
                  <th className="p-3 text-right">Eceran</th>
                  <th className="p-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, index) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-gray-500">{globalIndex}</td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full p-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <span className="font-medium">{item.name}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full p-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <span className="text-gray-600">{item.category}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.net}
                            onChange={(e) => setEditForm({ ...editForm, net: Number(e.target.value) })}
                            className="w-24 p-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <span>{item.prices.net > 0 ? item.prices.net.toLocaleString('id-ID') : '-'}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.grosir}
                            onChange={(e) => setEditForm({ ...editForm, grosir: Number(e.target.value) })}
                            className="w-24 p-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <span>{item.prices.grosir > 0 ? item.prices.grosir.toLocaleString('id-ID') : '-'}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.eceran}
                            onChange={(e) => setEditForm({ ...editForm, eceran: Number(e.target.value) })}
                            className="w-24 p-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <span>{item.prices.eceran > 0 ? item.prices.eceran.toLocaleString('id-ID') : '-'}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(item.id)}
                                className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                                title="Simpan"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                                title="Batal"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1 bg-primary-500 text-white rounded hover:bg-primary-600"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Yakin ingin menghapus item ini?')) {
                                    onDeleteItem(item.id);
                                  }
                                }}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                title="Hapus"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Tidak ada item ditemukan
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="px-4 py-1 text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
