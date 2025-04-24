import React from 'react';

function Calendario({ anno, mese, turni, aggiungiTurno, modificaTurno, rimuoviTurno }) {
  const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const primoGiornoDelMese = new Date(anno, mese - 1, 1);
  const giorniNelMese = new Date(anno, mese, 0).getDate();
  const inizioSettimana = primoGiornoDelMese.getDay();

  const celleVuote = Array.from({ length: inizioSettimana }, (_, i) => <div key={`empty-${i}`} />);
  const celleGiorno = Array.from({ length: giorniNelMese }, (_, i) => {
    const giorno = i + 1;
    const data = `${anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
    const turniDelGiorno = turni[data] || [];

    return (
      <div key={data} className="border p-2 rounded shadow-sm bg-gray-50 hover:bg-gray-100">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold">{giorno}</span>
          <button onClick={() => aggiungiTurno(giorno)} className="text-green-600 text-sm">＋</button>
        </div>

        {turniDelGiorno.map((turno, idx) => (
          <div key={idx} className="flex flex-col mb-1">
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={turno.inizio}
                onChange={e => modificaTurno(data, idx, 'inizio', e.target.value)}
                className="text-xs p-1 border rounded"
              />
              <span>→</span>
              <input
                type="time"
                value={turno.fine}
                onChange={e => modificaTurno(data, idx, 'fine', e.target.value)}
                className="text-xs p-1 border rounded"
              />
              <button
                onClick={() => rimuoviTurno(data, idx)}
                className="text-red-600 text-xs ml-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  });

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2 text-center font-bold text-sm text-gray-700">
        {giorniSettimana.map(g => <div key={g}>{g}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs">
        {celleVuote.concat(celleGiorno)}
      </div>
    </div>
  );
}

export default Calendario;
