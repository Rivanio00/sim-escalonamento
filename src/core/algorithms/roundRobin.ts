import type { Config, ProcessInput, ProcessMetrics, ProcessStateInSecond, SecondState, SimulationResult } from '../types.ts';
import type { RuntimeProcess } from '../tieBreaker.ts';
import { generateVerticalDiagram } from '../formatter.ts';

/**
 * Round-Robin com quantum, sem prioridade. Mantém uma fila FIFO explícita: cada processo
 * roda por no máximo `config.quantum` segundos antes de voltar para o fim da fila.
 *
 * Convenção adotada: se um processo é preemptado por fim de quantum no mesmo instante em
 * que outro(s) processo(s) chegam, os que chegaram entram na fila antes do preemptado
 * (conforme o exemplo dado em aula).
 */
export function runRoundRobin(inputs: ProcessInput[], config: Config): SimulationResult {
  if (inputs.length === 0) {
    return {
      algorithmName: 'Round-Robin (RR)',
      metrics: [],
      averageTurnaroundTime: 0,
      averageWaitingTime: 0,
      contextSwitches: 0,
      timeline: [],
      verticalDiagram: '',
    };
  }

  const processes: RuntimeProcess[] = inputs.map((p) => ({
    input: p,
    id: p.id,
    order: p.order,
    arrivalTime: p.arrivalTime,
    duration: p.duration,
    remainingTime: p.duration,
    staticPriority: p.staticPriority,
    currentPriority: p.staticPriority,
    startTime: null,
    completionTime: null,
  }));

  // Processos ainda não inseridos na fila, ordenados por chegada e depois pela ordem de leitura
  const pending = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime ? a.arrivalTime - b.arrivalTime : a.order - b.order
  );

  const processIds = processes.map((p) => p.id);
  const totalProcesses = processes.length;
  let finishedCount = 0;
  let currentTime = 0;
  let previousRunningId: string | null = null;
  let contextSwitches = 0;

  const queue: RuntimeProcess[] = [];
  let currentlyRunning: RuntimeProcess | null = null;
  let quantumUsed = 0;
  // Processo que esgotou o quantum no fim do segundo anterior: só volta para a fila
  // depois que as chegadas do instante atual forem enfileiradas (ver convenção acima).
  let pendingRequeue: RuntimeProcess | null = null;

  const timeline: SecondState[] = [];

  while (finishedCount < totalProcesses) {
    // 1. Enfileira as chegadas que acontecem exatamente neste instante
    while (pending.length > 0 && pending[0].arrivalTime === currentTime) {
      queue.push(pending.shift()!);
    }

    // 2. Só agora devolve à fila o processo que esgotou o quantum no instante atual
    if (pendingRequeue) {
      queue.push(pendingRequeue);
      pendingRequeue = null;
    }

    // 3. Se o processador está livre, despacha o próximo da fila (FIFO)
    if (currentlyRunning === null && queue.length > 0) {
      currentlyRunning = queue.shift()!;
      quantumUsed = 0;
      if (currentlyRunning.startTime === null) {
        currentlyRunning.startTime = currentTime;
      }
    }

    // 4. Contabiliza troca de contexto
    const currentId = currentlyRunning ? currentlyRunning.id : null;
    if (
      previousRunningId !== null &&
      currentId !== null &&
      currentId !== previousRunningId
    ) {
      contextSwitches += 1;
    }
    previousRunningId = currentId;

    // 5. Monta o snapshot do segundo atual [currentTime, currentTime + 1]
    const processStates: Record<string, ProcessStateInSecond> = {};
    for (const p of processes) {
      if (currentlyRunning && p.id === currentlyRunning.id) {
        processStates[p.id] = 'RUNNING';
      } else if (p.arrivalTime <= currentTime && p.remainingTime > 0) {
        processStates[p.id] = 'READY';
      } else {
        processStates[p.id] = 'NONE';
      }
    }

    timeline.push({
      timeStart: currentTime,
      timeEnd: currentTime + 1,
      runningProcessId: currentId,
      processStates,
    });

    // 6. Executa 1 segundo do processo em CPU
    if (currentlyRunning) {
      currentlyRunning.remainingTime -= 1;
      quantumUsed += 1;

      if (currentlyRunning.remainingTime === 0) {
        currentlyRunning.completionTime = currentTime + 1;
        finishedCount += 1;
        currentlyRunning = null;
        quantumUsed = 0;
      } else if (quantumUsed === config.quantum) {
        // Esgotou o quantum: sai da CPU, mas só reentra na fila no próximo instante
        // (depois das novas chegadas, ver passo 2)
        pendingRequeue = currentlyRunning;
        currentlyRunning = null;
        quantumUsed = 0;
      }
    }

    currentTime += 1;
  }

  // 7. Calcula as métricas consolidadas
  const metrics: ProcessMetrics[] = processes.map((p) => {
    const start = p.startTime ?? p.arrivalTime;
    const completion = p.completionTime ?? p.arrivalTime;
    const turnaround = completion - p.arrivalTime;
    const waiting = turnaround - p.duration;
    const response = start - p.arrivalTime;

    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      duration: p.duration,
      staticPriority: p.staticPriority,
      startTime: start,
      completionTime: completion,
      turnaroundTime: turnaround,
      waitingTime: waiting,
      responseTime: response,
    };
  });

  const totalTurnaround = metrics.reduce((acc, m) => acc + m.turnaroundTime, 0);
  const totalWaiting = metrics.reduce((acc, m) => acc + m.waitingTime, 0);

  const averageTurnaroundTime = totalTurnaround / totalProcesses;
  const averageWaitingTime = totalWaiting / totalProcesses;
  const verticalDiagram = generateVerticalDiagram(processIds, timeline);

  return {
    algorithmName: 'Round-Robin (RR)',
    metrics,
    averageTurnaroundTime,
    averageWaitingTime,
    contextSwitches,
    timeline,
    verticalDiagram,
  };
}