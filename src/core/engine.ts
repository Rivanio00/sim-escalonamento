import type {
  ProcessInput,
  ProcessMetrics,
  ProcessStateInSecond,
  RuntimeProcess,
  SecondState,
  SimulationResult,
} from './types.ts';
import { breakTie } from './tieBreaker.ts';
import { generateVerticalDiagram } from './formatter.ts';

/**
 * A política de escalonamento: tudo o que difere de um algoritmo para outro.
 * O laço da simulação (runSimulation, abaixo) é sempre o mesmo.
 */
export interface Scheduler {
  /** Nome exibido nos relatórios. */
  name: string;

  /**
   * true  -> reavalia a escolha a cada segundo (pode preemptar quem está na CPU);
   * false -> só escolhe quando o processador fica livre (fim do processo ou do quantum).
   */
  preemptive: boolean;

  /** Tempo máximo de CPU por despacho. null = roda até terminar ou ser preemptado. */
  quantum: number | null;

  /**
   * Critério de escolha: entre os processos prontos, ganha o de MAIOR pontuação.
   * Empates caem nas regras de desempate do enunciado (ver tieBreaker.ts).
   */
  score(p: RuntimeProcess): number;

  /** Chamado quando o processo entra no sistema (no seu instante de criação). */
  onArrival?(p: RuntimeProcess, time: number): void;

  /**
   * Chamado quando o processo perde a CPU por fim de quantum (não por conclusão).
   * Roda no início do segundo seguinte, DEPOIS das chegadas daquele instante —
   * é isso que faz quem chega em t entrar na fila antes de quem foi preemptado em t.
   */
  onQuantumExpired?(p: RuntimeProcess, time: number): void;

  /** Chamado ao despachar um processo, com a lista de prontos daquele instante (usado pelo aging). */
  onDispatch?(chosen: RuntimeProcess, ready: RuntimeProcess[], time: number): void;
}

function toRuntime(inputs: ProcessInput[]): RuntimeProcess[] {
  return inputs.map((p) => ({
    id: p.id,
    order: p.order,
    arrivalTime: p.arrivalTime,
    duration: p.duration,
    staticPriority: p.staticPriority,
    remainingTime: p.duration,
    currentPriority: p.staticPriority,
    queueSeq: 0,
    startTime: null,
    completionTime: null,
  }));
}

function computeMetrics(processes: RuntimeProcess[]): ProcessMetrics[] {
  return processes.map((p) => {
    const startTime = p.startTime ?? p.arrivalTime;
    const completionTime = p.completionTime ?? p.arrivalTime;
    const turnaroundTime = completionTime - p.arrivalTime;
    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      duration: p.duration,
      staticPriority: p.staticPriority,
      startTime,
      completionTime,
      turnaroundTime,
      waitingTime: turnaroundTime - p.duration,
      responseTime: startTime - p.arrivalTime,
    };
  });
}

/**
 * O motor de simulação: um único laço, um segundo por iteração, compartilhado
 * pelos sete algoritmos. A cada segundo t, na ordem:
 *
 *   1. registra as chegadas do instante t;
 *   2. devolve à fila quem esgotou o quantum no fim de t-1;
 *   3. escolhe quem usa o processador (se ele está livre, ou sempre, se preemptivo);
 *   4. conta a troca de contexto e grava o snapshot do segundo [t, t+1);
 *   5. executa um segundo: desconta 1 do tempo restante e trata fim de processo / de quantum.
 */
export function runSimulation(inputs: ProcessInput[], scheduler: Scheduler): SimulationResult {
  const processes = toRuntime(inputs);
  const processIds = processes.map((p) => p.id);

  if (processes.length === 0) {
    return {
      algorithmName: scheduler.name,
      metrics: [],
      averageTurnaroundTime: 0,
      averageWaitingTime: 0,
      contextSwitches: 0,
      timeline: [],
      verticalDiagram: '',
    };
  }

  // Ainda não chegaram, em ordem de chegada (e, no mesmo instante, de declaração)
  const notArrived = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime ? a.arrivalTime - b.arrivalTime : a.order - b.order
  );

  const timeline: SecondState[] = [];
  let time = 0;
  let finished = 0;
  let running: RuntimeProcess | null = null;
  let lastRunningId: string | null = null;
  let contextSwitches = 0;
  let quantumUsed = 0;
  let expiredLastSecond: RuntimeProcess | null = null;

  while (finished < processes.length) {
    // 1. Chegadas do instante atual
    while (notArrived.length > 0 && notArrived[0].arrivalTime <= time) {
      const arrived = notArrived.shift()!;
      scheduler.onArrival?.(arrived, time);
    }

    // 2. Reentrada de quem esgotou o quantum no fim do segundo anterior
    if (expiredLastSecond) {
      scheduler.onQuantumExpired?.(expiredLastSecond, time);
      expiredLastSecond = null;
    }

    // 3. Escolha do processo
    if (running === null || scheduler.preemptive) {
      const ready = processes.filter((p) => p.arrivalTime <= time && p.remainingTime > 0);

      if (ready.length === 0) {
        running = null; // processador ocioso
      } else {
        const best = Math.max(...ready.map((p) => scheduler.score(p)));
        const tied = ready.filter((p) => scheduler.score(p) === best);
        const chosen = breakTie(tied, lastRunningId);

        if (chosen !== running) {
          running = chosen;
          quantumUsed = 0;
          scheduler.onDispatch?.(chosen, ready, time);
        }
      }
    }

    // 4. Troca de contexto e snapshot do segundo [time, time + 1)
    const runningId = running?.id ?? null;
    if (lastRunningId !== null && runningId !== null && runningId !== lastRunningId) {
      contextSwitches += 1;
    }
    lastRunningId = runningId;

    const processStates: Record<string, ProcessStateInSecond> = {};
    for (const p of processes) {
      if (p.id === runningId) {
        processStates[p.id] = 'RUNNING';
      } else if (p.arrivalTime <= time && p.remainingTime > 0) {
        processStates[p.id] = 'READY';
      } else {
        processStates[p.id] = 'NONE';
      }
    }
    timeline.push({ timeStart: time, timeEnd: time + 1, runningProcessId: runningId, processStates });

    // 5. Executa um segundo
    if (running) {
      running.startTime ??= time;
      running.remainingTime -= 1;
      quantumUsed += 1;

      if (running.remainingTime === 0) {
        running.completionTime = time + 1;
        finished += 1;
        running = null;
        quantumUsed = 0;
      } else if (scheduler.quantum !== null && quantumUsed === scheduler.quantum) {
        expiredLastSecond = running; // volta para a fila no próximo segundo (passo 2)
        running = null;
        quantumUsed = 0;
      }
    }

    time += 1;
  }

  const metrics = computeMetrics(processes);
  const sum = (pick: (m: ProcessMetrics) => number) =>
    metrics.reduce((acc, m) => acc + pick(m), 0);

  return {
    algorithmName: scheduler.name,
    metrics,
    averageTurnaroundTime: sum((m) => m.turnaroundTime) / metrics.length,
    averageWaitingTime: sum((m) => m.waitingTime) / metrics.length,
    contextSwitches,
    timeline,
    verticalDiagram: generateVerticalDiagram(processIds, timeline),
  };
}
