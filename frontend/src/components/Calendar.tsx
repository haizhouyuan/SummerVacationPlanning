import React, { useState, useEffect } from 'react';

interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD format
  maxDate?: string; // YYYY-MM-DD format
  className?: string;
  highlightedDates?: string[]; // Array of dates to highlight
  disabledDates?: string[]; // Array of dates to disable
  showToday?: boolean;
  compactMode?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateChange,
  minDate,
  maxDate,
  className = '',
  highlightedDates = [],
  disabledDates = [],
  showToday = true,
  compactMode = false
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const today = new Date().toISOString().split('T')[0];

  // Update current month when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      if (monthStart.getTime() !== currentMonth.getTime()) {
        setCurrentMonth(monthStart);
      }
    }
  }, [selectedDate, currentMonth]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isDateDisabled = (dateStr: string) => {
    if (disabledDates.includes(dateStr)) return true;
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isDateHighlighted = (dateStr: string) => {
    return highlightedDates.includes(dateStr);
  };

  const isDateSelected = (dateStr: string) => {
    return selectedDate === dateStr;
  };

  const isToday = (dateStr: string) => {
    return today === dateStr;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDateClick = (dateStr: string) => {
    if (!isDateDisabled(dateStr)) {
      onDateChange(dateStr);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8 w-8"></div>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const disabled = isDateDisabled(dateStr);
      const selected = isDateSelected(dateStr);
      const highlighted = isDateHighlighted(dateStr);
      const isTodayDate = showToday && isToday(dateStr);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(dateStr)}
          disabled={disabled}
          className={`
            h-8 w-8 text-sm font-medium rounded-cartoon transition-all duration-200 flex items-center justify-center
            ${selected 
              ? 'bg-primary-500 text-white shadow-cartoon' 
              : isTodayDate 
              ? 'bg-cartoon-orange text-white ring-2 ring-cartoon-orange/30' 
              : highlighted 
              ? 'bg-cartoon-green/20 text-cartoon-green border border-cartoon-green' 
              : disabled 
              ? 'text-cartoon-gray cursor-not-allowed opacity-50' 
              : 'text-cartoon-dark hover:bg-cartoon-light hover:text-primary-600'
            }
            ${!disabled && !selected ? 'hover:scale-105' : ''}
          `}
          title={
            isTodayDate ? '今天' :
            highlighted ? '有任务安排' :
            selected ? '已选择' : ''
          }
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-cartoon text-cartoon-gray hover:text-cartoon-dark hover:bg-cartoon-light transition-colors"
          title="上个月"
        >
          ⬅️
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-cartoon-dark font-fun">
            {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
          </h3>
          {showToday && (
            <button
              onClick={() => {
                const todayDate = new Date();
                setCurrentMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
                if (!isDateDisabled(today)) {
                  onDateChange(today);
                }
              }}
              className="text-xs text-primary-600 hover:text-primary-700 transition-colors mt-1"
            >
              回到今天
            </button>
          )}
        </div>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-cartoon text-cartoon-gray hover:text-cartoon-dark hover:bg-cartoon-light transition-colors"
          title="下个月"
        >
          ➡️
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-sm font-medium text-cartoon-gray"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {/* Quick date selection */}
      {!compactMode && (
        <div className="mt-4 pt-4 border-t border-cartoon-light">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDateClick(today)}
              disabled={isDateDisabled(today)}
              className="px-3 py-1 text-xs rounded-cartoon bg-cartoon-blue text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              今天
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                if (!isDateDisabled(tomorrowStr)) {
                  handleDateClick(tomorrowStr);
                }
              }}
              className="px-3 py-1 text-xs rounded-cartoon bg-cartoon-green text-white hover:bg-green-600 transition-colors"
            >
              明天
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                const nextWeekStr = nextWeek.toISOString().split('T')[0];
                if (!isDateDisabled(nextWeekStr)) {
                  handleDateClick(nextWeekStr);
                }
              }}
              className="px-3 py-1 text-xs rounded-cartoon bg-cartoon-orange text-white hover:bg-orange-600 transition-colors"
            >
              下周
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      {!compactMode && (highlightedDates.length > 0 || showToday) && (
        <div className="mt-4 pt-4 border-t border-cartoon-light">
          <div className="text-xs text-cartoon-gray space-y-2">
            <div className="font-medium mb-2">图例说明：</div>
            <div className="flex flex-wrap gap-4">
              {showToday && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-cartoon bg-cartoon-orange"></div>
                  <span>今天</span>
                </div>
              )}
              {highlightedDates.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-cartoon bg-cartoon-green/20 border border-cartoon-green"></div>
                  <span>有任务</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-cartoon bg-primary-500"></div>
                <span>已选择</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;