import React, { useState } from 'react';

function ProcessPanel({ processes, setProcesses }) {
  const [arrival, setArrival] = useState(0);
  const [duration, setDuration] = useState(1);
  const [priority, setPriority] = useState(1);

  const handleAddProcess = (e) => {
    e.preventDefault();
    const newProcess = {
      id: `P${processes.length + 1}`,
      chegada: Number(arrival),
      duracao: Number(duration),
      prioridade: Number(priority),
    };
    setProcesses([...processes, newProcess]);
    setArrival(Number(arrival) + 1); 
  };

  const handleClear = () => setProcesses([]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Entrada de Processos</h2>
      
      <form onSubmit={handleAddProcess} className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Chegada (t)</label>
          <input 
            type="number" min="0" required
            className="w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={arrival} onChange={(e) => setArrival(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Duração</label>
          <input 
            type="number" min="1" required
            className="w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={duration} onChange={(e) => setDuration(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Prioridade</label>
          <input 
            type="number" min="1" required
            className="w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={priority} onChange={(e) => setPriority(e.target.value)} 
          />
        </div>
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Adicionar
        </button>
      </form>

      {processes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3">Processo</th>
                <th className="p-3">Chegada</th>
                <th className="p-3">Duração</th>
                <th className="p-3">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.id}</td>
                  <td className="p-3">{p.chegada}</td>
                  <td className="p-3">{p.duracao}</td>
                  <td className="p-3">{p.prioridade}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            onClick={handleClear} 
            className="mt-4 text-red-600 text-sm hover:underline"
          >
            Limpar todos os processos
          </button>
        </div>
      ) : (
        <p className="text-gray-400 text-sm text-center py-4 border border-dashed rounded">
          Nenhum processo adicionado.
        </p>
      )}
    </div>
  );
}

export default ProcessPanel;