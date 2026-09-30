import { useMemo, useState } from 'react';
import './components/simulador.css';
import ProcessPanel from './components/ProcessPanel';
import ConfigPanel from './components/ConfigPanel';
import AlgorithmPanel from './components/AlgorithmPanel';
import RunPanel from './components/RunPanel';
import ResultCard from './components/ResultCard';
import { ALGORITHMS } from './core/simulate.ts';
import { runSimulation } from './core/engine.ts';
import { paraMotor, validarProcessos } from './components/entrada';

// Processos iniciais (exemplo)
const PROCESSOS_INICIAIS = [
  { id: 'P1', chegada: 0, duracao: 5, prioridade: 2 },
  { id: 'P2', chegada: 0, duracao: 2, prioridade: 3 },
  { id: 'P3', chegada: 1, duracao: 4, prioridade: 1 },
  { id: 'P4', chegada: 3, duracao: 1, prioridade: 4 },
  { id: 'P5', chegada: 5, duracao: 2, prioridade: 5 },
];

function App() {
  const [processes, setProcesses] = useState(PROCESSOS_INICIAIS);
  const [config, setConfig] = useState({ quantum: 2, aging: 1 });
  const [selecionados, setSelecionados] = useState(['FCFS', 'RR']);
  const [t, setT] = useState(0); // segundos já revelados
  const [cardsRevelados, setCardsRevelados] = useState(null);

  // Toda simulação é calculada de uma vez; o Run step apenas revela um segundo por vez.
  const { cards, problemas } = useMemo(() => {
    const problemas = validarProcessos(processes);
    if (processes.length === 0 || problemas.length > 0) return { cards: [], problemas };

    const entrada = paraMotor(processes);
    // Campo vazio ou inválido vira o mínimo permitido
    const cfg = {
      quantum: Math.max(1, Math.floor(Number(config.quantum)) || 1),
      aging: Math.max(0, Math.floor(Number(config.aging)) || 0),
    };

    const cards = ALGORITHMS.filter((a) => selecionados.includes(a.key)).map((a) => {
      const partes = [];
      if (a.usesQuantum) partes.push(`quantum ${cfg.quantum}`);
      if (a.usesAging) partes.push(`aging ${cfg.aging}`);
      const subtitulo = partes.join(', ');

      try {
        const scheduler = a.build(cfg);
        return { key: a.key, titulo: scheduler.name, subtitulo, result: runSimulation(entrada, scheduler) };
      } catch (e) {
        return { key: a.key, titulo: a.label, subtitulo, erro: e instanceof Error ? e.message : String(e) };
      }
    });

    return { cards, problemas };
  }, [processes, config, selecionados]);

  // Qualquer mudança na entrada recalcula `cards` (nova identidade) e reinicia a
  // execução. Ajustar o estado durante a renderização evita o render extra que um
  // useEffect causaria — e o "t = 0" nunca aparece atrasado em um frame.
  if (cardsRevelados !== cards) {
    setCardsRevelados(cards);
    setT(0);
  }

  const ids = processes.map((p) => p.id);
  const eixo = Math.max(0, ...cards.map((c) => (c.result ? c.result.timeline.length : 0)));
  const temResultado = eixo > 0;

  return (
    <div>
      <header className="app-header">
        <h1>Simulador de escalonamento</h1>
      </header>

      <main className="app-main">
        <aside className="app-side">
          <ProcessPanel processes={processes} setProcesses={setProcesses} setConfig={setConfig} />
          <ConfigPanel config={config} setConfig={setConfig} setProcesses={setProcesses} />
          <AlgorithmPanel selecionados={selecionados} setSelecionados={setSelecionados} />
          <RunPanel
            t={t}
            total={eixo}
            temResultado={temResultado}
            onStep={() => setT((v) => Math.min(v + 1, eixo))}
            onFast={() => setT(eixo)}
            onReset={() => setT(0)}
          />
        </aside>

        <section className="app-results">
          {problemas.length > 0 && (
            <div className="panel">
              <p className="msg-err" style={{ margin: 0 }}>{problemas.join('\n')}</p>
            </div>
          )}
          {processes.length === 0 && <p className="empty">Adicione ao menos um processo para simular.</p>}
          {processes.length > 0 && problemas.length === 0 && selecionados.length === 0 && (
            <p className="empty">Selecione ao menos um algoritmo.</p>
          )}
          {cards.map((c) => (
            <ResultCard
              key={c.key}
              titulo={c.titulo}
              subtitulo={c.subtitulo}
              result={c.result}
              erro={c.erro}
              t={t}
              eixo={eixo}
              ids={ids}
            />
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;
