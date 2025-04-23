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
      </div>
    </div>
  );
}

export default App;
