import React from 'react';

function Gantt({ result }) {
  if (!result || !result.timeline) return null;

  const { 
    timeline, 
    metrics, 
    averageTurnaroundTime, 
    averageWaitingTime, 
    contextSwitches 
  } = result;

  // Calculando o totalTime usando o 'timeEnd' do último bloco
  const totalTime = timeline.length > 0 ? timeline[timeline.length - 1].timeEnd : 1;

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
  ];

  const getProcessColor = (pid) => {
    if (!pid || pid === 'IDLE' || pid === 'Ocioso') return 'bg-gray-300 text-gray-600';
    const num = parseInt(String(pid).replace(/\D/g, '')) || 1;
    return `${colors[(num - 1) % colors.length]} text-white`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Resultados da Simulação</h2>
      
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Linha do Tempo (Gantt)</h3>
        <div className="flex h-12 w-full rounded overflow-hidden border border-gray-300 bg-gray-50">
          {timeline.map((block, index) => {
            // Usando 'timeEnd' e 'timeStart' exatos do seu motor
            const duration = block.timeEnd - block.timeStart;
            const widthPct = (duration / totalTime) * 100;
            
            // Usando 'runningProcessId' exato do seu motor
            const pid = block.runningProcessId || '??';
            
            return (
              <div 
                key={index} 
                className={`flex flex-col items-center justify-center border-r border-white/30 last:border-0 ${getProcessColor(pid)}`}
                style={{ width: `${widthPct}%` }}
                title={`${pid}: ${block.timeStart} a ${block.timeEnd}`}
              >
                <span className="font-bold text-xs truncate px-1">{pid}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex relative mt-1 text-xs text-gray-500 h-4">
          {timeline.map((block, index) => {
            const leftPct = (block.timeStart / totalTime) * 100;
            return (
              <span key={`start-${index}`} className="absolute -translate-x-1/2" style={{ left: `${leftPct}%` }}>
                {block.timeStart}
              </span>
            );
          })}
          {timeline.length > 0 && (
            <span className="absolute -translate-x-1/2" style={{ left: '100%' }}>
              {timeline[timeline.length - 1].timeEnd}
            </span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-2">Métricas por Processo</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left border">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2 border-r">Processo</th>
              <th className="p-2 border-r text-center">Conclusão</th>
              <th className="p-2 border-r text-center">Tempo de Retorno (TT)</th>
              <th className="p-2 text-center">Tempo de Espera (TW)</th>
            </tr>
          </thead>
          <tbody>
            {metrics && metrics.map((m, idx) => {
              // Usando 'id' conforme os dados do motor
              const pid = m.id || `P${idx + 1}`;
              return (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium border-r">{pid}</td>
                  <td className="p-2 text-center border-r">{m.completionTime}</td>
                  <td className="p-2 text-center border-r">{m.turnaroundTime}</td>
                  <td className="p-2 text-center">{m.waitingTime}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 text-sm bg-blue-50 p-4 rounded text-blue-900 border border-blue-100">
        <p><strong>TT Médio:</strong> {averageTurnaroundTime?.toFixed(2) || 0}</p>
        <p><strong>TW Médio:</strong> {averageWaitingTime?.toFixed(2) || 0}</p>
        <p><strong>Trocas de Contexto:</strong> {contextSwitches || 0}</p>
      </div>
    </div>
  );
}

export default Gantt;