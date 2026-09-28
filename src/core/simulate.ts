import type { Config, ProcessInput, SimulationResult } from './types.ts';
import { runFCFS } from './algorithms/fcfs.ts';
import { runSJF } from './algorithms/sjf.ts';
import { runSRTF } from './algorithms/srtf.ts';

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
    default:
      throw new Error(`Algoritmo não suportado ou ainda não implementado: ${algorithm}`);
  }
}
