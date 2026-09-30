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
 * Catálogo único dos algoritmos: a sigla que aparece na entrada/UI, o nome legível
 * e como construir a política. É desta lista que o CLI e o front tiram os algoritmos,
 * então adicionar um novo algoritmo é adicionar uma linha aqui.
 */
export const ALGORITHMS = [
  { key: 'FCFS', label: 'FCFS', build: () => fcfs },
  { key: 'SJF', label: 'SJF', build: () => sjf },
  { key: 'SRTF', label: 'SRTF', build: () => srtf },
  { key: 'PNP', label: 'Prioridade não-preemptiva', build: () => priorityNonPreemptive },
  { key: 'PP', label: 'Prioridade preemptiva', build: () => priorityPreemptive },
  { key: 'RR', label: 'Round-Robin', build: (c: Config) => roundRobin(c) },
  { key: 'RRA', label: 'Round-Robin com aging', build: (c: Config) => roundRobinAging(c) },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
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
