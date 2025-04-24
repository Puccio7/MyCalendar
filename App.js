import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, addMonths, subMonths, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import './App.css';

// Giorni festivi italiani (esempio per il 2024/2025)
const holidays = [
  new Date(2024, 0, 1),  // Capodanno
  new Date(2024, 0, 6),  // Epifania
  new Date(2024, 3, 1),  // Pasqua (esempio)
  new Date(2024, 3, 2),  // Lunedì dell'Angelo
  new Date(2024, 3, 25), // Liberazione
  new Date(2024, 4, 1),  // Festa del Lavoro
  new Date(2024, 5, 2),  // Festa della Repubblica
  new Date(2024, 7, 15), // Ferragosto
  new Date(2024, 10, 1), // Tutti i Santi
  new Date(2024, 11, 8), // Immacolata
  new Date(2024, 11, 25), // Natale
  new Date(2024, 11, 26), // Santo Stefano
  new Date(2025, 0, 1),  // Capodanno
  new Date(2025, 0, 6),  // Epifania
];

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState(() => {
    const savedShifts = localStorage.getItem('shifts');
    return savedShifts ? JSON.parse(savedShifts) : {};
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [defaultShiftDuration, setDefaultShiftDuration] = useState(4);
  const [rates, setRates] = useState(() => {
    const savedRates = localStorage.getItem('rates');
    return savedRates ? JSON.parse(savedRates) : {
      normal: 10,
      overtime: 15,
      night: 15,
      holiday: 20,
      nightHoliday: 25
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('rates', JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const isHoliday = (date) => {
    return holidays.some(holiday => isSameDay(holiday, date));
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    const dayKey = format(day, 'yyyy-MM-dd');
    const shift = shifts[dayKey];
    
    if (shift) {
      setStartTime(shift.start);
      setEndTime(shift.end);
    } else {
      setStartTime('');
      setEndTime('');
    }
  };

  const handleSaveShift = () => {
    if (!selectedDay || !startTime || !endTime) return;

    const dayKey = format(selectedDay, 'yyyy-MM-dd');
    
    // Parse times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Calculate hours
    const startDate = new Date(selectedDay);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(selectedDay);
    endDate.setHours(endHour, endMinute, 0, 0);
    
    // If end time is before start time, it means it's the next day
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    // Calculate total hours
    const totalMs = endDate - startDate;
    const totalHours = totalMs / (1000 * 60 * 60);
    
    // Calculate day, night, holiday hours
    let dayHours = 0;
    let nightHours = 0;
    let dayHolidayHours = 0;
    let nightHolidayHours = 0;
    
    const dayStart = new Date(startDate);
    const dayEnd = new Date(endDate);
    
    // Adjust day start/end to consider only 8:00-20:00 as day hours
    if (dayStart.getHours() < 8) {
      dayStart.setHours(8, 0, 0, 0);
    }
    if (dayEnd.getHours() >= 20 || dayEnd.getHours() < 8) {
      dayEnd.setHours(20, 0, 0, 0);
    }
    
    if (dayStart < dayEnd) {
      const dayMs = dayEnd - dayStart;
      const hours = dayMs / (1000 * 60 * 60);
      
      if (isHoliday(selectedDay) || isWeekend(selectedDay)) {
        dayHolidayHours += hours;
      } else {
        dayHours += hours;
      }
    }
    
    // Calculate night hours
    const nightMs = totalMs - (dayEnd - dayStart);
    if (nightMs > 0) {
      const hours = nightMs / (1000 * 60 * 60);
      
      if (isHoliday(selectedDay) || isWeekend(selectedDay)) {
        nightHolidayHours += hours;
      } else {
        nightHours += hours;
      }
    }
    
    // Calculate regular and overtime
    const regularHours = Math.min(defaultShiftDuration, totalHours);
    const overtimeHours = Math.max(0, totalHours - regularHours);
    
    // Distribute overtime proportionally
    const regular = {
      day: 0,
      night: 0,
      dayHoliday: 0,
      nightHoliday: 0
    };
    
    const overtime = {
      day: 0,
      night: 0,
      dayHoliday: 0,
      nightHoliday: 0
    };
    
    // Calculate proportions
    if (totalHours > 0) {
      const dayProportion = dayHours / totalHours;
      const nightProportion = nightHours / totalHours;
      const dayHolidayProportion = dayHolidayHours / totalHours;
      const nightHolidayProportion = nightHolidayHours / totalHours;
      
      regular.day = dayProportion * regularHours;
      regular.night = nightProportion * regularHours;
      regular.dayHoliday = dayHolidayProportion * regularHours;
      regular.nightHoliday = nightHolidayProportion * regularHours;
      
      overtime.day = dayProportion * overtimeHours;
      overtime.night = nightProportion * overtimeHours;
      overtime.dayHoliday = dayHolidayProportion * overtimeHours;
      overtime.nightHoliday = nightHolidayProportion * overtimeHours;
    }
    
    setShifts({
      ...shifts,
      [dayKey]: {
        start: startTime,
        end: endTime,
        total: totalHours,
        regular,
        overtime,
        dayHours,
        nightHours,
        dayHolidayHours,
        nightHolidayHours
      }
    });
    
    setSelectedDay(null);
    setStartTime('');
    setEndTime('');
  };

  const removeShift = () => {
    if (!selectedDay) return;
    
    const dayKey = format(selectedDay, 'yyyy-MM-dd');
    const newShifts = { ...shifts };
    delete newShifts[dayKey];
    
    setShifts(newShifts);
    setSelectedDay(null);
    setStartTime('');
    setEndTime('');
  };

  const calculateMonthlyStats = () => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
    
    let totalRegularDay = 0;
    let totalRegularNight = 0;
    let totalRegularHoliday = 0;
    let totalRegularNightHoliday = 0;
    
    let totalOvertimeDay = 0;
    let totalOvertimeNight = 0;
    let totalOvertimeHoliday = 0;
    let totalOvertimeNightHoliday = 0;
    
    days.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const shift = shifts[dayKey];
      
      if (shift) {
        totalRegularDay += shift.regular.day || 0;
        totalRegularNight += shift.regular.night || 0;
        totalRegularHoliday += shift.regular.dayHoliday || 0;
        totalRegularNightHoliday += shift.regular.nightHoliday || 0;
        
        totalOvertimeDay += shift.overtime.day || 0;
        totalOvertimeNight += shift.overtime.night || 0;
        totalOvertimeHoliday += shift.overtime.dayHoliday || 0;
        totalOvertimeNightHoliday += shift.overtime.nightHoliday || 0;
      }
    });
    
    const totalPay = 
      totalRegularDay * rates.normal +
      totalRegularNight * rates.night +
      totalRegularHoliday * rates.holiday +
      totalRegularNightHoliday * rates.nightHoliday +
      totalOvertimeDay * rates.overtime +
      totalOvertimeNight * Math.max(rates.overtime, rates.night) +
      totalOvertimeHoliday * Math.max(rates.overtime, rates.holiday) +
      totalOvertimeNightHoliday * Math.max(rates.overtime, rates.nightHoliday);
    
    return {
      regularHours: {
        day: totalRegularDay,
        night: totalRegularNight,
        holiday: totalRegularHoliday,
        nightHoliday: totalRegularNightHoliday,
        total: totalRegularDay + totalRegularNight + totalRegularHoliday + totalRegularNightHoliday
      },
      overtimeHours: {
        day: totalOvertimeDay,
        night: totalOvertimeNight,
        holiday: totalOvertimeHoliday,
        nightHoliday: totalOvertimeNightHoliday,
        total: totalOvertimeDay + totalOvertimeNight + totalOvertimeHoliday + totalOvertimeNightHoliday
      },
      totalPay
    };
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("L'app è già installata o il browser non supporta l'installazione");
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt
    setDeferredPrompt(null);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Create weekdays header
    const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    
    return (
      <div className="calendar">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="px-4 py-2 bg-blue-500 text-white rounded">
            &lt; Prec
          </button>
          <h2 className="text-xl font-bold">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </h2>
          <button onClick={nextMonth} className="px-4 py-2 bg-blue-500 text-white rounded">
            Succ &gt;
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="text-center font-bold">
              {day}
            </div>
          ))}
          
          {/* Empty cells for days of the week before the first day of the month */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-start-${i}`} className="h-12 border border-gray-200"></div>
          ))}
          
          {days.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const hasShift = shifts[dayKey];
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const holiday = isHoliday(day) || isWeekend(day);
            
            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`h-12 border border-gray-200 text-center relative cursor-pointer
                  ${isSelected ? 'bg-blue-100 border-blue-500' : ''}
                  ${holiday ? 'text-red-500' : ''}
                `}
              >
                <div className="p-1">{format(day, 'd')}</div>
                {hasShift && (
                  <div className="absolute bottom-0 left-0 right-0 text-xs bg-green-200 truncate">
                    {shifts[dayKey].start} - {shifts[dayKey].end}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const stats = calculateMonthlyStats();

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold text-center mb-4">Miei Turni</h1>
      
      {deferredPrompt && (
        <button 
          onClick={handleInstallClick}
          className="w-full mb-4 py-2 bg-green-500 text-white rounded flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Installa App
        </button>
      )}
      
      {renderCalendar()}
      
      {selectedDay && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">
            {format(selectedDay, 'EEEE d MMMM yyyy', { locale: it })}
          </h3>
          
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="w-1/3">Inizio:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border p-1 rounded w-2/3"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <label className="w-1/3">Fine:</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border p-1 rounded w-2/3"
              />
            </div>
            
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleSaveShift}
                className="flex-1 bg-green-500 text-white py-1 px-4 rounded"
              >
                Salva
              </button>
              
              <button
                onClick={removeShift}
                className="flex-1 bg-red-500 text-white py-1 px-4 rounded"
              >
                Elimina
              </button>
              
              <button
                onClick={() => setSelectedDay(null)}
                className="flex-1 bg-gray-500 text-white py-1 px-4 rounded"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded mb-2"
        >
          {showSettings ? 'Nascondi Impostazioni' : 'Mostra Impostazioni'}
        </button>
        
        {showSettings && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">Impostazioni</h3>
            
            <div className="mb-4">
              <label className="block mb-1">Durata turno base (ore):</label>
              <input
                type="number"
                min="1"
                max="24"
                value={defaultShiftDuration}
                onChange={(e) => setDefaultShiftDuration(Number(e.target.value))}
                className="border p-1 rounded w-full"
              />
            </div>
            
            <h4 className="font-bold mb-2">Tariffe orarie (€):</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1">Diurno:</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rates.normal}
                  onChange={(e) => setRates({...rates, normal: Number(e.target.value)})}
                  className="border p-1 rounded w-full"
                />
              </div>
              
              <div>
                <label className="block mb-1">Straordinario:</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rates.overtime}
                  onChange={(e) => setRates({...rates, overtime: Number(e.target.value)})}
                  className="border p-1 rounded w-full"
                />
              </div>
              
              <div>
                <label className="block mb-1">Notturno:</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rates.night}
                  onChange={(e) => setRates({...rates, night: Number(e.target.value)})}
                  className="border p-1 rounded w-full"
                />
              </div>
              
              <div>
                <label className="block mb-1">Festivo:</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rates.holiday}
                  onChange={(e) => setRates({...rates, holiday: Number(e.target.value)})}
                  className="border p-1 rounded w-full"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block mb-1">Notturno Festivo:</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rates.nightHoliday}
                  onChange={(e) => setRates({...rates, nightHoliday: Number(e.target.value)})}
                  className="border p-1 rounded w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-blue-50 p-4 rounded">
        <h3 className="font-bold mb-2">Riepilogo del mese: {format(currentMonth, 'MMMM yyyy', { locale: it })}</h3>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="font-bold">Ore normali:</div>
          <div>{stats.regularHours.total.toFixed(2)}</div>
          
          <div className="font-bold">Ore straordinarie:</div>
          <div>{stats.overtimeHours.total.toFixed(2)}</div>
          
          <div className="font-bold">Ore diurne:</div>
          <div>{(stats.regularHours.day + stats.overtimeHours.day).toFixed(2)}</div>
          
          <div className="font-bold">Ore notturne:</div>
          <div>{(stats.regularHours.night + stats.overtimeHours.night).toFixed(2)}</div>
          
          <div className="font-bold">Ore festive:</div>
          <div>{(stats.regularHours.holiday + stats.overtimeHours.holiday).toFixed(2)}</div>
          
          <div className="font-bold">Ore notturne festive:</div>
          <div>{(stats.regularHours.nightHoliday + stats.overtimeHours.nightHoliday).toFixed(2)}</div>
          
          <div className="col-span-2 mt-2 pt-2 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">Paga totale stimata:</span>
              <span className="font-bold text-xl">€ {stats.totalPay.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
