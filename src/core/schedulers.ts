import type { Config, ProcessInput, RuntimeProcess, SimulationResult } from './types.ts';
import { runSimulation, type Scheduler } from './engine.ts';

/**
 * Os sete algoritmos do trabalho, cada um descrito apenas pelo que o torna diferente:
 * se preempta, se tem quantum e qual é o critério de escolha (maior `score` ganha).
 * Todo o resto — o laço, a fila de prontos, o desempate, as métricas e o diagrama —
 * é o motor compartilhado em engine.ts.
 */

// --- Sem prioridade, sem quantum ---------------------------------------------

/** FCFS: quem chegou primeiro roda primeiro, até terminar. */
export const fcfs: Scheduler = {
  name: 'FCFS (First Come, First Served)',
  preemptive: false,
  quantum: null,
  score: (p) => -p.arrivalTime, // menor chegada = maior pontuação
};

/** SJF: entre os prontos, roda o de menor duração TOTAL, até terminar. */
export const sjf: Scheduler = {
  name: 'Shortest Job First (SJF)',
  preemptive: false,
  quantum: null,
  score: (p) => -p.duration,
};

/** SRTF: versão preemptiva do SJF — usa o tempo RESTANTE e reavalia a cada segundo. */
export const srtf: Scheduler = {
  name: 'Shortest Remaining Time First (SRTF)',
  preemptive: true,
  quantum: null,
  score: (p) => -p.remainingTime,
};

// --- Com prioridade estática -------------------------------------------------

/** Prioridade não preemptiva: maior prioridade estática, mas sem interromper quem já roda. */
export const priorityNonPreemptive: Scheduler = {
  name: 'Prioridade sem Preempção (PRIOc)',
  preemptive: false,
  quantum: null,
  score: (p) => p.staticPriority, // maior número = mais prioritário
};

/** Prioridade preemptiva: uma chegada mais prioritária tira o atual do processador. */
export const priorityPreemptive: Scheduler = {
  name: 'Prioridade com Preempção (PRIOp)',
  preemptive: true,
  quantum: null,
  score: (p) => p.staticPriority,
};

// --- Round-Robin -------------------------------------------------------------

/**
 * Round-Robin clássico: fila FIFO e quantum, sem prioridade.
 *
 * A fila é representada por um número de ordem (`queueSeq`) atribuído quando o
 * processo entra na fila; ganha o menor. Como o motor devolve o processo preemptado
 * à fila só no segundo seguinte e DEPOIS das chegadas daquele instante, quem chega
 * em t entra na fila antes de quem foi preemptado em t (convenção vista em aula).
 */
export function roundRobin(config: Config): Scheduler {
  let nextSeq = 0;
  const enqueue = (p: RuntimeProcess) => {
    p.queueSeq = nextSeq++;
  };

  return {
    name: 'Round-Robin (RR)',
    preemptive: false, // a troca acontece por fim de quantum, não por reavaliação
    quantum: config.quantum,
    score: (p) => -p.queueSeq,
    onArrival: enqueue,
    onQuantumExpired: enqueue,
  };
}

/**
 * Round-Robin com prioridade e envelhecimento ("algoritmo simples" do slide 120):
 *   - a prioridade dinâmica (pd) começa igual à estática;
 *   - a cada despacho, roda quem tem maior pd; todos os OUTROS prontos ganham +aging
 *     e o escolhido volta à sua prioridade estática;
 *   - não há preempção por prioridade: a nova escolha só acontece no fim do quantum
 *     (ou quando o processo termina).
 */
export function roundRobinAging(config: Config): Scheduler {
  return {
    name: 'Round-Robin com Prioridade e Envelhecimento',
    preemptive: false,
    quantum: config.quantum,
    score: (p) => p.currentPriority,
    onDispatch: (chosen, ready) => {
      for (const p of ready) {
        if (p.id !== chosen.id) {
          p.currentPriority += config.aging;
        }
      }
      chosen.currentPriority = chosen.staticPriority;
    },
  };
}

// --- API usada pelo CLI, pelos testes e pelo front ---------------------------

export const runFCFS = (inputs: ProcessInput[]): SimulationResult => runSimulation(inputs, fcfs);
export const runSJF = (inputs: ProcessInput[]): SimulationResult => runSimulation(inputs, sjf);
export const runSRTF = (inputs: ProcessInput[]): SimulationResult => runSimulation(inputs, srtf);

export const runPriorityNonPreemptive = (inputs: ProcessInput[]): SimulationResult =>
  runSimulation(inputs, priorityNonPreemptive);

export const runPriorityPreemptive = (inputs: ProcessInput[]): SimulationResult =>
  runSimulation(inputs, priorityPreemptive);

export const runRoundRobin = (inputs: ProcessInput[], config: Config): SimulationResult =>
  runSimulation(inputs, roundRobin(config));

export const runRoundRobinAging = (inputs: ProcessInput[], config: Config): SimulationResult =>
  runSimulation(inputs, roundRobinAging(config));
