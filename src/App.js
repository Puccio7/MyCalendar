import React, { useState } from 'react';
import './App.css';
import './index.css';

const GIORNI_FESTIVI_2025 = [
  '2025-01-01', '2025-01-06', '2025-04-20', '2025-04-21',
  '2025-04-25', '2025-05-01', '2025-06-02', '2025-08-15',
  '2025-11-01', '2025-12-08', '2025-12-25', '2025-12-26'
];

const GIORNI_SETTIMANA = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

const TARIFFE_DEFAULT = {
  tariffa_base: 10, 
  tariffa_notturna: 12, 
  tariffa_festiva: 15, 
  tariffa_festiva_notturna: 18, 
  tariffa_straordinario: 12
};

const parseTime = (timeString) => {
  if (!timeString) return { hours: 0, minutes: 0 };
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

const isHoliday = (dateString) => GIORNI_FESTIVI_2025.includes(dateString);

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const formatDateString = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const calculateHours = (inizio, fine) => {
  const start = parseTime(inizio);
  const end = parseTime(fine);
  
  let hours = end.hours - start.hours;
  let minutes = end.minutes - start.minutes;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  if (hours < 0) {
    hours += 24;
  }
  
  return hours + (minutes / 60);
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [turni, setTurni] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  const prevMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const handleDayClick = (day) => {
    const selectedDateString = formatDateString(
      currentDate.getFullYear(), 
      currentDate.getMonth() + 1, 
      day.getDate()
    );
    setSelectedDate(selectedDateString);
  };

  const addTurno = () => {
    if (!selectedDate) return;
    
    const existingTurni = turni[selectedDate] || [];
    setTurni((prev) => ({
      ...prev,
      [selectedDate]: [...existingTurni, { inizio: "09:00", fine: "17:00" }]
    }));
  };

  const updateTurno = (dateString, index, field, value) => {
    const updatedTurni = { ...turni };
    updatedTurni[dateString][index][field] = value;
    setTurni(updatedTurni);
  };

  const removeTurno = (dateString, index) => {
    const updatedTurni = { ...turni };
    updatedTurni[dateString].splice(index, 1);
    
    if (updatedTurni[dateString].length === 0) {
      delete updatedTurni[dateString];
    }
    
    setTurni(updatedTurni);
  };

  const calculateTotalHours = () => {
    let oreTotali = 0;
    let oreDiurne = 0;
    let oreNotturne = 0;
    let oreFestive = 0;
    let oreFestiveNotturne = 0;
    let oreStraordinarie = 0;

    Object.entries(turni).forEach(([dateString, shifts]) => {
      const isHolidayDay = isHoliday(dateString);
      const date = new Date(dateString);
      const isWeekendDay = isWeekend(date);
      const isFestivo = isHolidayDay || isWeekendDay;
      
      shifts.forEach(shift => {
        const startTime = parseTime(shift.inizio);
        const hours = calculateHours(shift.inizio, shift.fine);
        
        oreTotali += hours;
        
        // Implementazione semplificata per la demo
        if (isFestivo) {
          if (startTime.hours >= 20 || startTime.hours < 8) {
            oreFestiveNotturne += hours;
          } else {
            oreFestive += hours;
          }
        } else {
          if (startTime.hours >= 20 || startTime.hours < 8) {
            oreNotturne += hours;
          } else {
            if (hours > 8) {
              oreDiurne += 8;
              oreStraordinarie += (hours - 8);
            } else {
              oreDiurne += hours;
            }
          }
        }
      });
    });

    return {
      oreTotali: oreTotali.toFixed(2),
      oreDiurne: oreDiurne.toFixed(2),
      oreNotturne: oreNotturne.toFixed(2),
      oreFestive: oreFestive.toFixed(2),
      oreFestiveNotturne: oreFestiveNotturne.toFixed(2),
      oreStraordinarie: oreStraordinarie.toFixed(2),
      stipendioTotale: (
        oreDiurne * TARIFFE_DEFAULT.tariffa_base +
        oreNotturne * TARIFFE_DEFAULT.tariffa_notturna +
        oreFestive * TARIFFE_DEFAULT.tariffa_festiva +
        oreFestiveNotturne * TARIFFE_DEFAULT.tariffa_festiva_notturna +
        oreStraordinarie * TARIFFE_DEFAULT.tariffa_straordinario
      ).toFixed(2)
    };
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    // Adjust the first day to start from the correct day of the week
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Create empty cells for days before the first day of the month
    const emptyDays = Array(firstDayOfMonth).fill(null);
    
    // Combine empty days with actual days
    const days = [...emptyDays, ...daysInMonth];
    
    // Create weeks
    const weeks = [];
    for (let i = 0; i < Math.ceil(days.length / 7); i++) {
      weeks.push(days.slice(i * 7, (i + 1) * 7));
    }

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {GIORNI_SETTIMANA.map((day, index) => (
            <div key={index} className="bg-gray-100 text-center py-2 text-gray-700 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="divide-y">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-px bg-gray-200">
              {week.map((day, dayIndex) => {
                if (!day) return <div key={`empty-${dayIndex}`} className="bg-gray-50 h-24" />;
                
                const dateString = formatDateString(year, month + 1, day.getDate());
                const isHolidayDay = isHoliday(dateString);
                const isWeekendDay = isWeekend(day);
                const hasTurni = turni[dateString]?.length > 0;
                const isSelected = selectedDate === dateString;
                
                return (
                  <div
                    key={dayIndex}
                    onClick={() => handleDayClick(day)}
                    className={`h-24 p-1 transition-colors duration-200 bg-white hover:bg-blue-50 ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    } ${isHolidayDay ? 'bg-red-50' : ''} ${isWeekendDay ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-right font-medium ${isHolidayDay ? 'text-red-600' : isWeekendDay ? 'text-blue-600' : ''}`}>
                        {day.getDate()}
                      </div>
                      <div className="flex-grow overflow-y-auto">
                        {hasTurni && (
                          <div className="mt-1 text-xs">
                            {turni[dateString].map((turno, index) => (
                              <div key={index} className="bg-blue-100 rounded-md p-1 mb-1 text-blue-800">
                                {turno.inizio} - {turno.fine}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hourSummary = calculateTotalHours();

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="mr-2" role="img" aria-label="Calendario">📅</span>
            Calendario Turni
          </h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={prevMonth} 
              className="p-2 rounded-full bg-white hover:bg-gray-100 text-gray-700 shadow-sm transition-colors duration-200"
              aria-label="Mese precedente"
            >
              &#10094;
            </button>
            
            <h2 className="text-xl font-semibold px-4">
              {currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button 
              onClick={nextMonth} 
              className="p-2 rounded-full bg-white hover:bg-gray-100 text-gray-700 shadow-sm transition-colors duration-200"
              aria-label="Mese successivo"
            >
              &#10095;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {renderCalendar()}
          </div>
          
          <div className="space-y-6">
            {selectedDate && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">
                    {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <button 
                    onClick={addTurno} 
                    className="flex items-center bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    <span className="mr-1">+</span> Aggiungi Turno
                  </button>
                </div>
                
                {turni[selectedDate]?.length > 0 ? (
                  <div className="space-y-3">
                    {turni[selectedDate].map((turno, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-500" role="img" aria-label="Orologio">⏱️</span>
                        <input
                          type="time"
                          value={turno.inizio}
                          onChange={(e) => updateTurno(selectedDate, index, 'inizio', e.target.value)}
                          className="border rounded-md p-1"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={turno.fine}
                          onChange={(e) => updateTurno(selectedDate, index, 'fine', e.target.value)}
                          className="border rounded-md p-1"
                        />
                        <span className="flex-grow text-sm">
                          ({calculateHours(turno.inizio, turno.fine).toFixed(2)} ore)
                        </span>
                        <button 
                          onClick={() => removeTurno(selectedDate, index)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded-md"
                        >
                          <span role="img" aria-label="Elimina turno">🗑️</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Nessun turno aggiunto per questa data
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <span className="mr-2" role="img" aria-label="Orologio">⏱️</span> Riepilogo Ore
              </h3>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-700">Ore Diurne</div>
                    <div className="text-2xl font-bold">{hourSummary.oreDiurne}</div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="text-sm text-indigo-700">Ore Notturne</div>
                    <div className="text-2xl font-bold">{hourSummary.oreNotturne}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm text-red-700">Ore Festive</div>
                    <div className="text-2xl font-bold">{hourSummary.oreFestive}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-purple-700">Ore Fest. Nott.</div>
                    <div className="text-2xl font-bold">{hourSummary.oreFestiveNotturne}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="text-sm text-amber-700">Straordinari</div>
                    <div className="text-2xl font-bold">{hourSummary.oreStraordinarie}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-700">Ore Totali</div>
                    <div className="text-2xl font-bold">{hourSummary.oreTotali}</div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <div className="text-gray-700">Stipendio Stimato</div>
                  <div className="text-3xl font-bold">€ {hourSummary.stipendioTotale}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;