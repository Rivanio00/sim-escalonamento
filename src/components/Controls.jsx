import React from 'react';
// Importamos tudo do index do core para acessar as funções do motor
import { 
  parseInput, 
  runFCFS, 
  runSJF, 
  runSRTF, 
  runPriorityPreemptive, 
  runPriorityNonPreemptive, 
  runRoundRobin, 
  runRoundRobinAging 
} from '../core/index.ts';

function Controls({ processes, setResult, algorithm, setAlgorithm, config, setConfig }) {
  
  // Variáveis para controlar a exibição dos campos extras
  const isRoundRobin = algorithm.includes('RR');
  const hasAging = algorithm === 'RR_AGING';

  const handleRunSimulation = () => {
    if (processes.length === 0) {
      alert("Adicione pelo menos um processo para rodar a simulação.");
      return;
    }

    try {
      // 1. Converte o array da interface para a string que o seu motor espera
      // Ex: "P1(chega=0, dur=5, prio=2) P2(chega=0, dur=2, prio=3)"
      const textInput = processes.map(p => 
        `${p.id}(chega=${p.chegada}, dur=${p.duracao}, prio=${p.prioridade})`
      ).join(' ');

      // 2. Usa o seu próprio parser para criar os objetos perfeitos
      const { processes: parsedProcesses } = parseInput(textInput);

      // 3. Executa o algoritmo escolhido
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

      // 4. Salva o resultado no estado do App.jsx para o Gantt ler
      setResult(simResult);

    } catch (error) {
      console.error("Erro na simulação:", error);
      alert("Erro ao rodar a simulação. Verifique o console.");
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

        {/* Aparece APENAS se for Round Robin ou RR_AGING */}
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

        {/* Aparece APENAS se for RR_AGING */}
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