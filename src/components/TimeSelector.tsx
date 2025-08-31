import React from 'react';
import { Button } from './ui/button';

export type TimePeriod = 'day' | 'week' | 'month';

interface TimeSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  className?: string;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  className = ''
}) => {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' }
  ];

  return (
    <div className={`flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={selectedPeriod === period.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onPeriodChange(period.value)}
          className={`
            px-3 py-1 text-xs font-medium transition-all duration-200
            ${selectedPeriod === period.value 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }
          `}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};

export default TimeSelector;