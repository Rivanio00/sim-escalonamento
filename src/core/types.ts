/**
 * Tipos fundamentais para a simulação de escalonamento de processos (SO - UFC).
 */

/** Um processo como ele aparece no arquivo de entrada. */
export interface ProcessInput {
  id: string; // Ex: "P1", "P2"
  order: number; // Ordem de declaração (1-indexada)
  arrivalTime: number; // Instante de criação (>= 0)
  duration: number; // Duração em segundos (> 0)
  staticPriority: number; // Prioridade estática (maior número = mais prioritário)
}

/**
 * O mesmo processo durante a simulação: guarda o que muda com o tempo.
 * O motor cria um destes por processo e nunca altera o ProcessInput original.
 */
export interface RuntimeProcess {
  id: string;
  order: number;
  arrivalTime: number;
  duration: number;
  staticPriority: number;
  remainingTime: number; // Quantos segundos ainda faltam executar
  currentPriority: number; // Prioridade dinâmica (pd); só o RR com aging a altera
  queueSeq: number; // Posição na fila FIFO; só o RR clássico a usa
  startTime: number | null; // Primeiro segundo em que ganhou o processador
  completionTime: number | null; // Instante em que terminou
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

/** '##' no diagrama, '--' na fila de prontos, vazio se não existe (ainda) */
export type ProcessStateInSecond = 'RUNNING' | 'READY' | 'NONE';

/** Snapshot de um segundo inteiro da simulação: o intervalo [timeStart, timeEnd). */
export interface SecondState {
  timeStart: number;
  timeEnd: number;
  runningProcessId: string | null; // null = processador ocioso
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
