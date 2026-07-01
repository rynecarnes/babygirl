"use client";

import { useState, useRef, useEffect } from "react";

interface DateTimePickerProps {
  value: string; // ISO format or similar, we'll use "YYYY-MM-DDTHH:mm" to match datetime-local
  onChange: (val: string) => void;
  required?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DateTimePicker({ value, onChange, required }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value or default to current date
  const parsedDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else {
      newDate.setHours(12);
      newDate.setMinutes(0);
    }
    
    // Format to YYYY-MM-DDTHH:mm
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    const hours = String(newDate.getHours()).padStart(2, '0');
    const mins = String(newDate.getMinutes()).padStart(2, '0');
    
    onChange(`${year}-${month}-${d}T${hours}:${mins}`);
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    if (!selectedDate) return;
    
    const newDate = new Date(selectedDate);
    if (type === 'hour') {
      newDate.setHours(parseInt(val, 10));
    } else {
      newDate.setMinutes(parseInt(val, 10));
    }

    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    const hours = String(newDate.getHours()).padStart(2, '0');
    const mins = String(newDate.getMinutes()).padStart(2, '0');
    
    onChange(`${year}-${month}-${d}T${hours}:${mins}`);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const formatDisplay = () => {
    if (!selectedDate) return "";
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    };
    return selectedDate.toLocaleString('en-US', options);
  };

  return (
    <div className="datetime-picker-container" ref={containerRef}>
      <div 
        className={`input datetime-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        {formatDisplay() || <span style={{ color: 'var(--text-dim)' }}>Select Date & Time</span>}
      </div>

      {/* Hidden input for HTML validation if needed, though we handle it in React */}
      <input type="hidden" required={required} value={value} />

      {isOpen && (
        <div className="datetime-popover">
          <div className="calendar-header">
            <button type="button" onClick={prevMonth} className="calendar-nav-btn">‹</button>
            <div className="calendar-title">
              {MONTHS[currentMonth]} {currentYear}
            </div>
            <button type="button" onClick={nextMonth} className="calendar-nav-btn">›</button>
          </div>

          <div className="calendar-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="calendar-day-name">{d}</div>
            ))}
            
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="calendar-day empty" />;
              
              const isSelected = selectedDate && 
                selectedDate.getDate() === day && 
                selectedDate.getMonth() === currentMonth && 
                selectedDate.getFullYear() === currentYear;

              return (
                <button
                  key={day}
                  type="button"
                  className={`calendar-day ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="time-picker-section">
            <div className="time-label">Time</div>
            <div className="time-controls">
              <select 
                className="time-select"
                value={selectedDate ? selectedDate.getHours() : 12}
                onChange={(e) => handleTimeChange('hour', e.target.value)}
                disabled={!selectedDate}
              >
                {Array.from({length: 24}).map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12' : i > 12 ? i - 12 : i} {i >= 12 ? 'PM' : 'AM'}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select 
                className="time-select"
                value={selectedDate ? selectedDate.getMinutes() : 0}
                onChange={(e) => handleTimeChange('minute', e.target.value)}
                disabled={!selectedDate}
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
