<<<<<<< HEAD
﻿import React, { useState } from 'react';
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
=======
import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

// Definizione delle tariffe orarie (modificabili dall'utente)
const TARIFFE_DEFAULT = {
  tariffa_base: 10, // Euro/ora
  tariffa_notturna: 12, // Euro/ora
  tariffa_festiva: 15, // Euro/ora
  tariffa_festiva_notturna: 18, // Euro/ora
  tariffa_straordinario: 12, // Euro/ora per ore oltre le 4 ore standard
};

// Giorni festivi in Italia 2025 (esempio)
const GIORNI_FESTIVI_2025 = [
  '2025-01-01', // Capodanno
  '2025-01-06', // Epifania
  '2025-04-20', // Pasqua
  '2025-04-21', // Pasquetta
  '2025-04-25', // Festa della Liberazione
  '2025-05-01', // Festa del Lavoro
  '2025-06-02', // Festa della Repubblica
  '2025-08-15', // Ferragosto
  '2025-11-01', // Tutti i Santi
  '2025-12-08', // Immacolata Concezione
  '2025-12-25', // Natale
  '2025-12-26', // Santo Stefano
];

// Funzioni di utilità
function parseTime(timeString) {
  if (!timeString) return { hours: 0, minutes: 0 };
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

function isNightHour(hour) {
  return hour >= 20 || hour < 8;
}

function isHoliday(dateString) {
  return GIORNI_FESTIVI_2025.includes(dateString);
}

function formatDateString(year, month, day) {
  return ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')};
}

function App() {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [turni, setTurni] = useState({});
  const [tariffe, setTariffe] = useState(TARIFFE_DEFAULT);
  const [showTariffe, setShowTariffe] = useState(false);
  const [showRiepilogo, setShowRiepilogo] = useState(false);
  
  // Carica i dati salvati al caricamento
  useEffect(() => {
    try {
      const savedTurni = localStorage.getItem('app_turni');
      if (savedTurni) {
        setTurni(JSON.parse(savedTurni));
      }
      
      const savedTariffe = localStorage.getItem('app_tariffe');
      if (savedTariffe) {
        setTariffe(JSON.parse(savedTariffe));
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati salvati:", error);
    }
  }, []);
  
  // Salva i dati quando cambiano
  useEffect(() => {
    try {
      localStorage.setItem('app_turni', JSON.stringify(turni));
    } catch (error) {
      console.error("Errore nel salvataggio dei turni:", error);
    }
  }, [turni]);
  
  useEffect(() => {
    try {
      localStorage.setItem('app_tariffe', JSON.stringify(tariffe));
    } catch (error) {
      console.error("Errore nel salvataggio delle tariffe:", error);
    }
  }, [tariffe]);
  
  // Funzioni per la navigazione del calendario
  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  // Funzioni per la gestione dei turni
  const aggiungiTurno = (day) => {
    const dateString = formatDateString(
      currentDate.getFullYear(), 
      currentDate.getMonth() + 1, 
      day
    );
    
    setTurni(prev => ({
      ...prev,
      [dateString]: [
        ...(prev[dateString] || []),
        { inizio: "09:00", fine: "13:00" }
      ]
    }));
  };
  
  const modificaTurno = (dateString, index, field, value) => {
    setTurni(prev => {
      const nuoviTurni = { ...prev };
      if (!nuoviTurni[dateString]) return prev;
      
      nuoviTurni[dateString] = [...nuoviTurni[dateString]];
      nuoviTurni[dateString][index] = {
        ...nuoviTurni[dateString][index],
        [field]: value
      };
      
      return nuoviTurni;
    });
  };
  
  const rimuoviTurno = (dateString, index) => {
setTurni(prev => {
      const nuoviTurni = { ...prev };
      if (!nuoviTurni[dateString]) return prev;
      
      nuoviTurni[dateString] = nuoviTurni[dateString].filter((_, i) => i !== index);
      
      if (nuoviTurni[dateString].length === 0) {
        delete nuoviTurni[dateString];
      }
      
      return nuoviTurni;
    });
  };
  
  // Funzioni per il calcolo delle ore e dello stipendio
  const calcolaOreTurno = (inizio, fine) => {
    const start = parseTime(inizio);
    const end = parseTime(fine);
    
    let totalMinutes = (end.hours * 60 + end.minutes) - (start.hours * 60 + start.minutes);
    
    // Se il totale è negativo, significa che il turno finisce il giorno dopo
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    return totalMinutes / 60; // Converti in ore
  };
  
  const categorizzaOreTurno = (inizio, fine, isFestivo) => {
    if (!inizio || !fine) {
      return {
        normalHours: 0,
        nightHours: 0,
        holidayHours: 0,
        holidayNightHours: 0,
        overtimeHours: 0,
        totalHours: 0
      };
    }
    
    const start = parseTime(inizio);
    const end = parseTime(fine);
    
    let currentHour = start.hours;
    let currentMinute = start.minutes;
    
    let normalMinutes = 0;
    let nightMinutes = 0;
    let holidayMinutes = 0;
    let holidayNightMinutes = 0;
    let totalMinutes = 0;
    
    // Uscita anticipata se inizio e fine sono uguali
    if (currentHour === end.hours && currentMinute === end.minutes) {
      return {
        normalHours: 0,
        nightHours: 0,
        holidayHours: 0,
        holidayNightHours: 0,
        overtimeHours: 0,
        totalHours: 0
      };
    }
    
    // Ciclo fino a raggiungere l'ora di fine
    while (true) {
      // Categorizziamo questo minuto
      if (isFestivo) {
        if (isNightHour(currentHour)) {
          holidayNightMinutes++;
        } else {
          holidayMinutes++;
        }
      } else {
        if (isNightHour(currentHour)) {
          nightMinutes++;
        } else {
          normalMinutes++;
        }
      }
      
      totalMinutes++;
      
      // Controlliamo se abbiamo raggiunto la fine
      if (currentHour === end.hours && currentMinute === end.minutes) {
        break;
      }
      
      // Aggiungiamo un minuto
      currentMinute++;
      if (currentMinute === 60) {
        currentMinute = 0;
        currentHour = (currentHour + 1) % 24;
      }
    }
    
    // Calcolo delle ore e dello straordinario
    const totalHours = totalMinutes / 60;
    let overtimeHours = 0;
    
    // Se le ore totali superano 4, calcoliamo lo straordinario
    if (totalHours > 4) {
      overtimeHours = totalHours - 4;
      
      // Riduciamo proporzionalmente le altre categorie
      const reductionFactor = 4 / totalHours;
      normalMinutes *= reductionFactor;
      nightMinutes *= reductionFactor;
      holidayMinutes *= reductionFactor;
      holidayNightMinutes *= reductionFactor;
    }
    
    return {
      normalHours: normalMinutes / 60,
      nightHours: nightMinutes / 60,
      holidayHours: holidayMinutes / 60,
      holidayNightHours: holidayNightMinutes / 60,
      overtimeHours: overtimeHours,
      totalHours: totalHours
    };
  };
  
  const calcolaRiepilogoMese = () => {
    const riepilogo = {
      oreTotali: 0,
      oreNormali: 0,
      oreNotturne: 0,
      oreFestive: 0,
      oreFestiveNotturne: 0,
      oreStraordinario: 0,
      stipendioStimato: 0
    };
    
    // Calcola solo per il mese corrente
    const anno = currentDate.getFullYear();
    const mese = currentDate.getMonth() + 1;
    
    // Iteriamo attraverso tutti i turni salvati
    Object.entries(turni).forEach(([data, turniGiorno]) => {
      // Controlliamo se il turno appartiene al mese corrente
const [annoTurno, meseTurno] = data.split('-').map(Number);
      if (annoTurno !== anno || meseTurno !== mese) {
        return;
      }
      
      const isFestivo = isHoliday(data);
      
      // Calcola per ogni turno del giorno
      turniGiorno.forEach(turno => {
        const { inizio, fine } = turno;
        if (!inizio || !fine) return;
        
        const ore = categorizzaOreTurno(inizio, fine, isFestivo);
        
        // Aggiorniamo il riepilogo
        riepilogo.oreTotali += ore.totalHours;
        riepilogo.oreNormali += ore.normalHours;
        riepilogo.oreNotturne += ore.nightHours;
        riepilogo.oreFestive += ore.holidayHours;
        riepilogo.oreFestiveNotturne += ore.holidayNightHours;
        riepilogo.oreStraordinario += ore.overtimeHours;
        
        // Calcolo stipendio
        riepilogo.stipendioStimato += 
          ore.normalHours * tariffe.tariffa_base +
          ore.nightHours * tariffe.tariffa_notturna +
          ore.holidayHours * tariffe.tariffa_festiva +
          ore.holidayNightHours * tariffe.tariffa_festiva_notturna +
          ore.overtimeHours * tariffe.tariffa_straordinario;
      });
    });
    
    // Arrotonda i valori per maggiore leggibilità
    Object.keys(riepilogo).forEach(key => {
      riepilogo[key] = Math.round(riepilogo[key] * 100) / 100;
    });
    
    return riepilogo;
  };
  
  // Dati del calendario
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  
  // Costruzione del calendario
  const daySquares = [];
  
  // Giorni vuoti per completare la prima settimana
  for (let i = 0; i < firstDayOfMonth; i++) {
    daySquares.push(
      <div key={empty-${i}} className="bg-gray-100 h-24 p-2 border"></div>
    );
  }
  
  // Giorni del mese
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = formatDateString(year, month + 1, day);
    const isFestivo = isHoliday(dateString);
    const turniGiorno = turni[dateString] || [];
    
    daySquares.push(
      <div 
        key={day-${day}} 
        className={h-24 p-2 border overflow-auto ${isFestivo ? 'bg-red-100' : 'bg-white'}}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold">{day}</span>
          <button 
            onClick={() => aggiungiTurno(day)}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            + Turno
          </button>
        </div>
        
        {turniGiorno.map((turno, index) => (
          <div key={turno-${day}-${index}} className="mb-1 bg-blue-50 p-1 rounded text-xs">
            <div className="flex justify-between">
              <span>Turno {index+1}</span>
              <button 
                onClick={() => rimuoviTurno(dateString, index)}
                className="text-red-500 font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex gap-1 mt-1 items-center">
              <input 
                type="time" 
                value={turno.inizio || ""}
                onChange={(e) => modificaTurno(dateString, index, 'inizio', e.target.value)}
                className="border rounded px-1 w-full"
              />
              <span>-</span>
              <input 
                type="time" 
                value={turno.fine || ""}
                onChange={(e) => modificaTurno(dateString, index, 'fine', e.target.value)}
                className="border rounded px-1 w-full"
/>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Calcola il riepilogo del mese corrente
  const riepilogoMese = calcolaRiepilogoMese();
  
  return (
    <div className="max-w-6xl mx-auto p-4 font-sans">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center">
              <Calendar className="mr-2" /> Calendario Turni di Lavoro
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowTariffe(!showTariffe)}
                className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
              >
                {showTariffe ? 'Nascondi Tariffe' : 'Modifica Tariffe'}
              </button>
              <button 
                onClick={() => setShowRiepilogo(!showRiepilogo)}
                className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
              >
                {showRiepilogo ? 'Nascondi Riepilogo' : 'Mostra Riepilogo'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Sezione Tariffe */}
        {showTariffe && (
          <div className="bg-gray-100 p-4 border-b">
            <h2 className="text-lg font-bold mb-2">Modifica Tariffe Orarie (€/ora)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tariffa Base</label>
                <input 
                  type="number" 
                  value={tariffe.tariffa_base}
                  onChange={(e) => setTariffe(prev => ({...prev, tariffa_base: parseFloat(e.target.value) || 0}))}
                  className="border rounded px-3 py-2 w-full"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tariffa Notturna</label>
                <input 
                  type="number" 
                  value={tariffe.tariffa_notturna}
                  onChange={(e) => setTariffe(prev => ({...prev, tariffa_notturna: parseFloat(e.target.value) || 0}))}
                  className="border rounded px-3 py-2 w-full"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tariffa Festiva</label>
                <input 
                  type="number" 
                  value={tariffe.tariffa_festiva}
                  onChange={(e) => setTariffe(prev => ({...prev, tariffa_festiva: parseFloat(e.target.value) || 0}))}
                  className="border rounded px-3 py-2 w-full"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tariffa Festiva Notturna</label>
                <input 
                  type="number" 
                  value={tariffe.tariffa_festiva_notturna}
                  onChange={(e) => setTariffe(prev => ({...prev, tariffa_festiva_notturna: parseFloat(e.target.value) || 0}))}
                  className="border rounded px-3 py-2 w-full"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tariffa Straordinario</label>
                <input 
                  type="number" 
                  value={tariffe.tariffa_straordinario}
                  onChange={(e) => setTariffe(prev => ({...prev, tariffa_straordinario: parseFloat(e.target.value) || 0}))}
className="border rounded px-3 py-2 w-full"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>• Ore notturne: dalle 20:00 alle 08:00</p>
              <p>• Ore festive: lavorare nei giorni contrassegnati come festivi</p>
              <p>• Straordinario: ore che superano le 4 ore di turno standard</p>
            </div>
          </div>
        )}
        
        {/* Sezione Riepilogo */}
        {showRiepilogo && (
          <div className="bg-gray-100 p-4 border-b">
            <h2 className="text-lg font-bold mb-2">Riepilogo del Mese: {mesi[month]} {year}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded shadow">
                <h3 className="font-medium text-gray-700">Ore Totali</h3>
                <p className="text-2xl font-bold">{riepilogoMese.oreTotali} ore</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h3 className="font-medium text-gray-700">Ore Normali</h3>
                <p className="text-lg">{riepilogoMese.oreNormali} ore</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h3 className="font-medium text-gray-700">Ore Notturne</h3>
                <p className="text-lg">{riepilogoMese.oreNotturne} ore</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h3 className="font-medium text-gray-700">Ore Festive</h3>
                <p className="text-lg">{riepilogoMese.oreFestive} ore</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h3 className="font-medium text-gray-700">Ore Festive Notturne</h3>
                <p className="text-lg">{riepilogoMese.oreFestiveNotturne} ore</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h3 className="font-medium text-gray-700">Ore Straordinario</h3>
                <p className="text-lg">{riepilogoMese.oreStraordinario} ore</p>
              </div>
            </div>
            <div className="mt-4 bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-700">Stipendio Stimato</h3>
              <p className="text-3xl font-bold text-green-600">€ {riepilogoMese.stipendioStimato.toFixed(2)}</p>
            </div>
          </div>
        )}
        
        {/* Calendario */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={prevMonth}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              &lt; Mese Prec.
            </button>
            <h2 className="text-xl font-bold">{mesi[month]} {year}</h2>
            <button 
              onClick={nextMonth}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              Mese Succ. &gt;
            </button>
          </div>
          
          {/* Giorni della settimana */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
              <div key={day} className="text-center font-bold">
                {day}
              </div>
            ))}
          </div>
          
          {/* Giorni del mese */}
          <div className="grid grid-cols-7 gap-1">
            {daySquares}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-100 p-4 border-t text-sm">
          <p className="font-bold mb-1">Legenda:</p>
          <ul className="space-y-1">
            <li>• Giorni festivi evidenziati in rosso</li>
            <li>• Ore notturne: dalle 20:00 alle 08:00</li>
            <li>• Turno standard: 4 ore, oltre viene calcolato come straordinario</li>
          </ul>
        </div>
>>>>>>> e36e8b5ba16e7719f3aa45cdc56e9aa6514b1e09
      </div>
    </div>
  );
};

export default Calendar;