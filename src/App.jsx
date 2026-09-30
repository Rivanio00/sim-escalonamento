import React, { useState } from 'react';
import ProcessPanel from './components/ProcessPanel';
import Controls from './components/Controls';
import Gantt from './components/Gantt'; 

function App() {
  const [processes, setProcesses] = useState([]);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [config, setConfig] = useState({ quantum: 2, aging: 1 });
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Simulador de Escalonamento de Processos</h1>
          <p className="text-gray-500 text-sm mt-1">Configure os processos e escolha o algoritmo para gerar o Gráfico de Gantt.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lado esquerdo: Painel de Processos e Gráfico */}
          <div className="lg:col-span-2 space-y-6">
            <ProcessPanel processes={processes} setProcesses={setProcesses} />
            
            {/* O Gráfico só aparece se houver um resultado gerado */}
            {result && <Gantt result={result} />}
          </div>
          
          {/* Lado direito: Controles */}
          <div className="space-y-6">
            <Controls 
              processes={processes}
              setResult={setResult}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              config={config}
              setConfig={setConfig}
            />
          </div>
          
        </div>

      </div>
    </div>
  );
}

export default App;