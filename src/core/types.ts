/**
 * Tipos fundamentais para a simulação de escalonamento de processos (SO - UFC).
 */

export interface ProcessInput {
  id: string; // Ex: "P1", "P2"
  order: number; // Ordem de declaração (1-indexada)
  arrivalTime: number; // Instante de criação (>= 0)
  duration: number; // Duração em segundos (> 0)
  staticPriority: number; // Prioridade estática (escala positiva)
}

export interface ProcessMetrics {
  id: string;
  arrivalTime: number;
  duration: number;
  staticPriority: number;
  startTime: number; // Instante do primeiro uso do processador
  completionTime: number; // Instante em que terminou a execução
  turnaroundTime: number; // Tempo de vida (tt) = completionTime - arrivalTime
  waitingTime: number; // Tempo de espera (tw) = turnaroundTime - duration
  responseTime: number; // Tempo de resposta = startTime - arrivalTime
}

export interface Config {
  quantum: number;
  aging: number;
}

export interface ParsedInput {
  config: Config;
  processes: ProcessInput[];
}

export type ProcessStateInSecond = 'RUNNING' | 'READY' | 'NONE';

export interface SecondState {
  timeStart: number;
  timeEnd: number;
  runningProcessId: string | null;
  // Estado de cada processo neste segundo: 'RUNNING' (##), 'READY' (--), ou 'NONE' (não criado ou já finalizado)
  processStates: Record<string, ProcessStateInSecond>;
}

export interface SimulationResult {
  algorithmName: string;
  metrics: ProcessMetrics[];
  averageTurnaroundTime: number; // tt médio
  averageWaitingTime: number; // tw médio
  contextSwitches: number; // total de trocas de contexto
  timeline: SecondState[]; // Linha do tempo segundo a segundo
  verticalDiagram: string; // Diagrama textual vertical para stdout
}
