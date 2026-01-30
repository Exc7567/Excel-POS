interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-gray-500">-</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        min={startDate}
        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
