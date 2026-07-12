import { useMemo, useState } from 'react';
import type { Transaction } from '../types/transaction';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { getActualRevenue } from '../utils/revenueHelper';

export interface DailyData {
  date: string;
  displayDate: string;
  revenue: number;
  transactions: number;
  itemsSold: number;
}

export interface TopItem {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

export interface TopCategory {
  category: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export interface ReportData {
  period: string;
  dateRange: { start: string; end: string };
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  totalItemsSold: number;
  dailyData: DailyData[];
  topItems: TopItem[];
  topCategories: TopCategory[];
  previousPeriodRevenue?: number;
  revenueChangePercent?: number;
}

export type ReportPeriod = 'today' | '7days' | '30days' | 'custom';

function getDateRangeValues(
  period: ReportPeriod,
  customStart: string,
  customEnd: string
): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (period) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case '7days':
      start = startOfDay(subDays(now, 7));
      end = endOfDay(now);
      break;
    case '30days':
      start = startOfDay(subDays(now, 30));
      end = endOfDay(now);
      break;
    case 'custom':
      start = customStart ? startOfDay(new Date(customStart)) : startOfDay(subDays(now, 30));
      end = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now);
      break;
    default:
      start = startOfDay(now);
      end = endOfDay(now);
  }

  return { start, end };
}

function getPeriodLabel(period: ReportPeriod): string {
  switch (period) {
    case 'today':
      return 'Hari Ini';
    case '7days':
      return '7 Hari Terakhir';
    case '30days':
      return '30 Hari Terakhir';
    case 'custom':
      return 'Custom Range';
    default:
      return 'Laporan';
  }
}

export function useReports(transactions: Transaction[]) {
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { start, end } = getDateRangeValues(period, customStart, customEnd);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const timestamp = new Date(t.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }, [transactions, start, end]);

  const previousPeriodRevenue = useMemo(() => {
    const periodLength = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodLength);
    const previousEnd = new Date(start.getTime() - 1);

    return transactions
      .filter((t) => {
        const timestamp = new Date(t.timestamp);
        return timestamp >= previousStart && timestamp <= previousEnd;
      })
      .reduce((sum, t) => sum + getActualRevenue(t), 0);
  }, [transactions, start, end]);

  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + getActualRevenue(t), 0);
  }, [filteredTransactions]);

  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const totalItemsSold = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
  }, [filteredTransactions]);

  const dailyData = useMemo(() => {
    const dailyDataMap = new Map<string, DailyData>();

    eachDayOfInterval({ start, end }).forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      dailyDataMap.set(dateKey, {
        date: dateKey,
        displayDate: format(day, 'dd MMM', { locale: id }),
        revenue: 0,
        transactions: 0,
        itemsSold: 0,
      });
    });

    filteredTransactions.forEach((t) => {
      const dateKey = format(new Date(t.timestamp), 'yyyy-MM-dd');
      const daily = dailyDataMap.get(dateKey);
      if (daily) {
        daily.revenue += getActualRevenue(t);
        daily.transactions += 1;
        daily.itemsSold += t.items.reduce((sum, i) => sum + i.quantity, 0);
      }
    });

    return Array.from(dailyDataMap.values());
  }, [filteredTransactions, start, end]);

  const topItems = useMemo(() => {
    const itemMap = new Map<string, TopItem>();
    filteredTransactions.forEach((t) => {
      t.items.forEach((item) => {
        const key = item.id;
        const existing = itemMap.get(key);
        const quantity = item.quantity;
        const price = item.prices[t.priceType];
        const revenue = price * quantity;

        if (existing) {
          existing.quantity += quantity;
          existing.revenue += revenue;
        } else {
          itemMap.set(key, {
            name: item.name,
            category: item.category || '',
            quantity,
            revenue,
          });
        }
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredTransactions]);

  const topCategories = useMemo(() => {
    const categoryMap = new Map<string, TopCategory>();
    filteredTransactions.forEach((t) => {
      t.items.forEach((item) => {
        const category = item.category || 'Lainnya';
        const quantity = item.quantity;
        const price = item.prices[t.priceType];
        const revenue = price * quantity;

        const existing = categoryMap.get(category);
        if (existing) {
          existing.quantity += quantity;
          existing.revenue += revenue;
        } else {
          categoryMap.set(category, {
            category,
            quantity,
            revenue,
            percentage: 0,
          });
        }
      });
    });

    const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.revenue, 0);
    return Array.from(categoryMap.values())
      .map((c) => ({
        ...c,
        percentage: totalCategoryRevenue > 0 ? (c.revenue / totalCategoryRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredTransactions]);

  const revenueChangePercent = useMemo(() => {
    return previousPeriodRevenue > 0
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : totalRevenue > 0 ? 100 : 0;
  }, [totalRevenue, previousPeriodRevenue]);

  const report: ReportData = {
    period: getPeriodLabel(period),
    dateRange: {
      start: format(start, 'dd MMM yyyy', { locale: id }),
      end: format(end, 'dd MMM yyyy', { locale: id }),
    },
    totalRevenue,
    totalTransactions,
    averageTransaction,
    totalItemsSold,
    dailyData,
    topItems,
    topCategories,
    previousPeriodRevenue,
    revenueChangePercent,
  };

  return {
    report,
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
  };
}
