import type { Config, ProcessInput, SimulationResult } from './types.ts';
import { runSimulation, type Scheduler } from './engine.ts';
import {
  fcfs,
  sjf,
  srtf,
  priorityNonPreemptive,
  priorityPreemptive,
  roundRobin,
  roundRobinAging,
} from './schedulers.ts';

/**
 * Catálogo único dos algoritmos — a única lista de algoritmos do projeto, usada
 * pela CLI e pela interface. Adicionar um algoritmo é adicionar uma linha aqui.
 *
 *   key         sigla aceita na entrada e em simulate()
 *   label       nome curto, para caixas de seleção na tela
 *   usesQuantum o algoritmo lê config.quantum
 *   usesAging   o algoritmo lê config.aging
 *   build       monta a política; o nome longo sai de scheduler.name
 */
export const ALGORITHMS = [
  { key: 'FCFS', label: 'FCFS', usesQuantum: false, usesAging: false, build: () => fcfs },
  { key: 'SJF', label: 'SJF', usesQuantum: false, usesAging: false, build: () => sjf },
  { key: 'SRTF', label: 'SRTF', usesQuantum: false, usesAging: false, build: () => srtf },
  {
    key: 'PNP',
    label: 'Prioridade',
    usesQuantum: false,
    usesAging: false,
    build: () => priorityNonPreemptive,
  },
  {
    key: 'PP',
    label: 'Prioridade preemptiva',
    usesQuantum: false,
    usesAging: false,
    build: () => priorityPreemptive,
  },
  {
    key: 'RR',
    label: 'Round-Robin',
    usesQuantum: true,
    usesAging: false,
    build: (c: Config) => roundRobin(c),
  },
  {
    key: 'RRA',
    label: 'RR com prioridade e aging',
    usesQuantum: true,
    usesAging: true,
    build: (c: Config) => roundRobinAging(c),
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  usesQuantum: boolean;
  usesAging: boolean;
  build: (config: Config) => Scheduler;
}>;

export type AlgorithmKey = (typeof ALGORITHMS)[number]['key'];

/** Roda um algoritmo pela sua sigla ('FCFS', 'SJF', 'SRTF', 'PNP', 'PP', 'RR', 'RRA'). */
export function simulate(
  processes: ProcessInput[],
  config: Config,
  algorithm: string
): SimulationResult {
  const key = algorithm.trim().toUpperCase();
  const entry = ALGORITHMS.find((a) => a.key === key);
  if (!entry) {
    const known = ALGORITHMS.map((a) => a.key).join(', ');
    throw new Error(`Algoritmo não suportado: "${algorithm}". Use um de: ${known}.`);
  }
  return runSimulation(processes, entry.build(config));
}

/** Roda todos os algoritmos com a mesma entrada — usado pelo CLI e pela comparação na UI. */
export function simulateAll(processes: ProcessInput[], config: Config): SimulationResult[] {
  return ALGORITHMS.map((a) => runSimulation(processes, a.build(config)));
}
