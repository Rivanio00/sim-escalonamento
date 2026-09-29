import type { Config, ProcessInput, SimulationResult } from './types.ts';
import { runFCFS } from './algorithms/fcfs.ts';
import { runSJF } from './algorithms/sjf.ts';
import { runSRTF } from './algorithms/srtf.ts';
import { runRoundRobin } from './algorithms/roundRobin.ts';
import { runRoundRobinAging } from './algorithms/roundRobinAging.ts';
import { runPriorityNonPreemptive, runPriorityPreemptive } from './basic.ts';

/**
 * Função de despacho da simulação baseada no algoritmo solicitado.
 */
export function simulate(
  processes: ProcessInput[],
  config: Config,
  algorithm: string
): SimulationResult {
  const normalized = algorithm.toUpperCase().trim();
  switch (normalized) {
    case 'FCFS':
      return runFCFS(processes);
    case 'SJF':
      return runSJF(processes);
    case 'SRTF':
      return runSRTF(processes);
    case 'PP':
      return runPriorityPreemptive(processes);
    case 'PNP':
      return runPriorityNonPreemptive(processes);
    case 'RR':
      return runRoundRobin(processes, config);
    case 'RRA':
      return runRoundRobinAging(processes, config);
    default:
      throw new Error(`Algoritmo não suportado ou ainda não implementado: ${algorithm}`);
  }
}
