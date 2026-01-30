import { useReports, type ReportPeriod } from '../hooks/useReports';
import { type Transaction } from '../types/transaction';
import { DateRangePicker } from './DateRangePicker';

interface ReportsModalProps {
  transactions: Transaction[];
}

export function ReportsModal({ transactions }: ReportsModalProps) {
  const {
    report,
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
  } = useReports(transactions);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMaxRevenue = () => {
    return Math.max(...report.dailyData.map((d) => d.revenue), 1);
  };



  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 pl-12 lg:pl-0">Laporan Penjualan</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Periode: {report.dateRange.start} - {report.dateRange.end}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto flex flex-col gap-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-4">
          <label className="font-medium text-gray-700">Filter Periode:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="custom">Custom Range</option>
          </select>

          {period === 'custom' && (
            <DateRangePicker
              startDate={customStart}
              endDate={customEnd}
              onChange={(start, end) => {
                setCustomStart(start);
                setCustomEnd(end);
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 font-medium mb-1">Total Pendapatan</div>
            <div className="text-2xl font-bold text-primary-700">
              {formatCurrency(report.totalRevenue)}
            </div>
            {report.revenueChangePercent !== undefined && (
              <div className={`text-xs mt-2 font-medium ${report.revenueChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {report.revenueChangePercent >= 0 ? '↑' : '↓'} {Math.abs(report.revenueChangePercent).toFixed(1)}% vs periode lalu
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-green-600 font-medium mb-1">Transaksi Berhasil</div>
            <div className="text-2xl font-bold text-green-700">
              {report.totalTransactions}
            </div>
            <div className="text-xs text-gray-400 mt-2">transaksi</div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-purple-600 font-medium mb-1">Rata-rata Transaksi</div>
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(report.averageTransaction)}
            </div>
            <div className="text-xs text-gray-400 mt-2">per struk</div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-orange-600 font-medium mb-1">Total Item Terjual</div>
            <div className="text-2xl font-bold text-orange-700">
              {report.totalItemsSold}
            </div>
            <div className="text-xs text-gray-400 mt-2">item</div>
          </div>
        </div>

        {report.dailyData.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Tren Pendapatan</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-end gap-2 h-48">
                {report.dailyData.map((day, idx) => {
                  const height = (day.revenue / getMaxRevenue()) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs p-1 rounded pointer-events-none whitespace-nowrap z-10">
                        {formatCurrency(day.revenue)}
                      </div>
                      <div
                        className="w-full bg-primary-500 rounded-t-sm transition-all duration-300 group-hover:bg-primary-600"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <div className="text-[10px] text-gray-500 mt-2 truncate w-full text-center">
                        {day.displayDate}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Item Terlaris</h3>
            </div>
            <div className="overflow-x-auto">
              {report.topItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Tidak ada data penjualan
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-3 text-left font-medium text-gray-500 w-12">#</th>
                      <th className="p-3 text-left font-medium text-gray-500">Item</th>
                      <th className="p-3 text-center font-medium text-gray-500">Qty</th>
                      <th className="p-3 text-right font-medium text-gray-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.topItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-500 pl-4">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </td>
                        <td className="p-3 text-center font-medium bg-gray-50 rounded">{item.quantity}</td>
                        <td className="p-3 text-right font-medium text-primary-700 pr-4">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Performa Kategori</h3>
            </div>
            <div className="p-4 space-y-4">
              {report.topCategories.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  Tidak ada data
                </div>
              ) : (
                report.topCategories.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{cat.category}</span>
                      <span className="text-gray-500 font-mono">
                        {formatCurrency(cat.revenue)} <span className="text-gray-300">|</span> {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
