import React from 'react';
import { runFCFS } from '../core/algorithms/fcfs';
import { runSJF } from '../core/algorithms/sjf';
import { runSRTF } from '../core/algorithms/srtf';
import { runPriorityPreemptive } from '../core/algorithms/priorityPreemptive';
import { runPriorityNonPreemptive } from '../core/algorithms/priorityNonPreemptive';
import { runRoundRobin } from '../core/algorithms/roundRobin';
import { runRoundRobinAging } from '../core/algorithms/roundRobinAging';

function Controls({ processes, setResult, algorithm, setAlgorithm, config, setConfig }) {
  
  const isRoundRobin = algorithm.includes('RR');
  const hasAging = algorithm === 'RR_AGING';

  const handleRunSimulation = () => {
    if (processes.length === 0) {
      alert("Adicione pelo menos um processo para rodar a simulação.");
      return;
    }

    try {
      // 1. Constrói os objetos EXATAMENTE como o parser faria, 
      // mas diretamente a partir dos dados do formulário do React.
      const parsedProcesses = processes.map((p, index) => ({
        id: p.id,
        order: index + 1,
        arrivalTime: Number(p.chegada),
        duration: Number(p.duracao),
        staticPriority: Number(p.prioridade)
      }));

      // 2. Executa o algoritmo escolhido com os objetos puros
      let simResult = null;
      switch (algorithm) {
        case 'FCFS': simResult = runFCFS(parsedProcesses); break;
        case 'SJF': simResult = runSJF(parsedProcesses); break;
        case 'SRTF': simResult = runSRTF(parsedProcesses); break;
        case 'PRIORITY_P': simResult = runPriorityPreemptive(parsedProcesses); break;
        case 'PRIORITY_NP': simResult = runPriorityNonPreemptive(parsedProcesses); break;
        case 'RR': simResult = runRoundRobin(parsedProcesses, config); break;
        case 'RR_AGING': simResult = runRoundRobinAging(parsedProcesses, config); break;
        default: break;
      }

      console.log("DADOS GERADOS E PROCESSADOS COM SUCESSO:", simResult);

      // 3. Salva o resultado no estado para o Gráfico renderizar
      setResult(simResult);

    } catch (error) {
      console.error("Erro na simulação:", error);
      alert("Erro ao rodar a simulação. Verifique a consola.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Controles da Simulação</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Algoritmo</label>
          <select 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
          >
            <option value="FCFS">FCFS (First-Come, First-Served)</option>
            <option value="SJF">SJF (Shortest Job First)</option>
            <option value="SRTF">SRTF (Shortest Remaining Time First)</option>
            <option value="PRIORITY_NP">Prioridade (Não Preemptiva)</option>
            <option value="PRIORITY_P">Prioridade (Preemptiva)</option>
            <option value="RR">Round Robin</option>
            <option value="RR_AGING">Round Robin com Aging</option>
          </select>
        </div>

        {isRoundRobin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantum</label>
            <input 
              type="number" min="1"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={config.quantum} 
              onChange={(e) => setConfig({ ...config, quantum: Number(e.target.value) })} 
            />
          </div>
        )}

        {hasAging && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aging</label>
            <input 
              type="number" min="1"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={config.aging} 
              onChange={(e) => setConfig({ ...config, aging: Number(e.target.value) })} 
            />
          </div>
        )}
      </div>

      <button 
        onClick={handleRunSimulation}
        className="w-full bg-green-600 text-white font-semibold px-4 py-3 rounded hover:bg-green-700 transition"
      >
        Rodar Simulação
      </button>
    </div>
  );
}

export default Controls;