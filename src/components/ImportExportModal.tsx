import React, { useState, useRef, useCallback } from 'react';
import type { Item } from '../types';
import { parseImportFile, exportItems, type ImportResult } from '../utils/importExport';

interface ImportExportModalProps {
  currentItems: Item[];
  onImport: (items: Item[]) => void;
}

type TabType = 'import' | 'export';

export function ImportExportModal({
  currentItems,
  onImport,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('import');
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await parseImportFile(file);
      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (importResult) {
      onImport(importResult.items);
      setImportResult(null);
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'xlsx') => {
    exportItems(currentItems, format);
  };

  const resetImport = () => {
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-5 flex justify-between items-center flex-shrink-0">
        <div className="min-w-0 pl-12 lg:pl-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight truncate">Data Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">Kelola data barang anda dengan mudah</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Navigation Pills */}
          <div className="flex justify-center">
            <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm inline-flex">
              <button
                onClick={() => { setActiveTab('import'); resetImport(); }}
                className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'import'
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                📥 Import Excel/CSV
              </button>
              <button
                onClick={() => { setActiveTab('export'); setError(null); setImportResult(null); }}
                className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'export'
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                📤 Export Data
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-8 flex-1 flex flex-col">
              {activeTab === 'import' ? (
                <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
                  {!importResult && !error && (
                    <div className="flex-1 flex flex-col justify-center">
                      <div
                        className={`group relative flex-1 min-h-[300px] border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center p-8 cursor-pointer ${dragActive
                          ? 'border-primary-500 bg-primary-50 scale-[1.02]'
                          : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                          }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${dragActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500'}`}>
                          <span className="text-4xl">📁</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Upload Data Barang
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                          Drag & drop file Excel/CSV anda disini, atau klik untuk memilih file
                        </p>

                        <div className="flex gap-2 text-xs text-gray-400 font-mono bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                          <span>.XLSX</span>
                          <span className="w-px h-3 bg-gray-200 self-center"></span>
                          <span>.CSV</span>
                          <span className="w-px h-3 bg-gray-200 self-center"></span>
                          <span>.XLS</span>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>

                      <div className="mt-8 flex gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl items-start">
                        <div className="text-blue-500 text-xl">ℹ️</div>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900 mb-1">Format Kolom Wajib</h4>
                          <p className="text-sm text-blue-700 mb-2">Pastikan file anda memiliki header kolom berikut (urutan tidak masalah):</p>
                          <div className="flex flex-wrap gap-2">
                            {['id', 'name', 'category', 'net', 'grosir', 'eceran'].map(col => (
                              <code key={col} className="px-2 py-1 bg-white bg-opacity-60 rounded border border-blue-200 text-blue-800 text-xs font-mono font-semibold">
                                {col}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                      </div>
                      <h3 className="mt-6 text-lg font-medium text-gray-900">Memproses Data...</h3>
                      <p className="text-gray-500">Mohon tunggu sebentar</p>
                    </div>
                  )}

                  {error && (
                    <div className="flex-1 flex flex-col items-center justify-center py-8">
                      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 text-4xl">
                        ⚠️
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h3>
                      <p className="text-red-600 text-center max-w-md bg-red-50 px-4 py-3 rounded-lg border border-red-100 mb-8">
                        {error}
                      </p>
                      <button
                        onClick={resetImport}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-lg shadow-gray-200"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}

                  {importResult && (
                    <div className="flex flex-col h-full">
                      <div className="mb-6 flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl">✓</div>
                          <div>
                            <h4 className="font-semibold text-green-900">File Berhasil Dibaca</h4>
                            <p className="text-sm text-green-700">Total <strong>{importResult.items.length}</strong> item siap diimport</p>
                          </div>
                        </div>
                      </div>

                      {importResult.errors.length > 0 && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                            <span>⚠️</span> {importResult.errors.length} Baris Bermasalah
                          </h4>
                          <div className="max-h-32 overflow-auto bg-white bg-opacity-50 rounded-lg p-3 border border-yellow-100">
                            {importResult.errors.map((err, idx) => (
                              <div key={idx} className="text-sm text-yellow-800 mb-1 font-mono">
                                Baris {err.row}: {err.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex-1 border rounded-xl overflow-hidden shadow-sm flex flex-col mb-6 bg-white">
                        <div className="overflow-auto flex-1">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                              <tr>
                                {['ID', 'Nama', 'Kategori', 'Net', 'Grosir', 'Eceran'].map(h => (
                                  <th key={h} className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {importResult.items.slice(0, 50).map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-3 font-mono text-gray-500">{item.id}</td>
                                  <td className="p-3 font-medium text-gray-900">{item.name}</td>
                                  <td className="p-3 text-blue-600">{item.category}</td>
                                  <td className="p-3 text-right">{item.prices.net?.toLocaleString()}</td>
                                  <td className="p-3 text-right font-medium">{item.prices.grosir?.toLocaleString()}</td>
                                  <td className="p-3 text-right">{item.prices.eceran?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {importResult.items.length > 50 && (
                          <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                            ... dan {importResult.items.length - 50} item lainnya
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button
                          onClick={resetImport}
                          className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleConfirmImport}
                          className="flex-1 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-200 transition-all hover:-translate-y-0.5"
                        >
                          Simpan {importResult.items.length} Data Barang
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-4xl mx-auto w-full py-12">
                  <div className="text-center mb-12">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Backup & Export</h3>
                    <p className="text-gray-500">Pilih format file untuk mengunduh {currentItems.length} data barang saat ini.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: 'xlsx', label: 'Excel Worksheet', icon: '📗', desc: 'Format standar .xlsx' },
                      { id: 'csv', label: 'CSV File', icon: '📊', desc: 'Universal, ringan' },
                      { id: 'json', label: 'JSON Data', icon: '📋', desc: 'Backup database lengkap' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleExport(opt.id as any)}
                        className="group flex flex-col p-8 bg-white border border-gray-200 rounded-2xl hover:border-primary-500 hover:shadow-xl hover:shadow-primary-50 transition-all duration-300 text-left relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-125 duration-300">
                          <span className="text-9xl">{opt.icon}</span>
                        </div>

                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-primary-50 group-hover:scale-110 transition-transform duration-300">
                          {opt.icon}
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{opt.label}</h4>
                        <p className="text-gray-500 text-sm mb-6">{opt.desc}</p>

                        <div className="mt-auto flex items-center text-primary-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                          Download <span className="ml-2">→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

