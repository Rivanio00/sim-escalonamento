import type { ProcessInput, ProcessMetrics, ProcessStateInSecond, SecondState, SimulationResult } from '../types.ts';
import { breakTie, type RuntimeProcess } from '../tieBreaker.ts';
import { generateVerticalDiagram } from '../formatter.ts';

export function runSRTF(inputs: ProcessInput[]): SimulationResult {
  if (inputs.length === 0) {
    return {
      algorithmName: 'Shortest Remaining Time First (SRTF)',
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

  const processIds = processes.map((p) => p.id);
  const totalProcesses = processes.length;
  let finishedCount = 0;
  let currentTime = 0;
  let currentlyRunning: RuntimeProcess | null = null;
  let previousRunningId: string | null = null;
  let contextSwitches = 0;

  const timeline: SecondState[] = [];

  while (finishedCount < totalProcesses) {
    // 1. SRTF preemptivo: a cada segundo avalia todos os processos prontos
    const ready = processes.filter(
      (p) => p.arrivalTime <= currentTime && p.remainingTime > 0
    );

    if (ready.length > 0) {
      let minRemaining = Infinity;
      for (const p of ready) {
        if (p.remainingTime < minRemaining) {
          minRemaining = p.remainingTime;
        }
      }
      const tied = ready.filter((p) => p.remainingTime === minRemaining);

      // Aplica regra de desempate (i): se o processo que já estava na CPU estiver empatado no menor tempo restante,
      // ele continua, evitando preempção/troca de contexto desnecessária.
      const currentRunningId = currentlyRunning ? currentlyRunning.id : null;
      currentlyRunning = breakTie(tied, currentRunningId);
    } else {
      currentlyRunning = null;
    }

    // 2. Contabiliza troca de contexto
    const currentId = currentlyRunning ? currentlyRunning.id : null;
    if (
      previousRunningId !== null &&
      currentId !== null &&
      currentId !== previousRunningId
    ) {
      contextSwitches += 1;
    }
    previousRunningId = currentId;

    // 3. Monta o snapshot do segundo atual [currentTime, currentTime + 1]
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

    // 4. Executa 1 segundo do processo em CPU
    if (currentlyRunning) {
      if (currentlyRunning.startTime === null) {
        currentlyRunning.startTime = currentTime;
      }
      currentlyRunning.remainingTime -= 1;

      if (currentlyRunning.remainingTime === 0) {
        currentlyRunning.completionTime = currentTime + 1;
        finishedCount += 1;
        currentlyRunning = null; // Finalizou
      }
    }

    currentTime += 1;
  }

  // 5. Calcula as métricas consolidadas
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
    algorithmName: 'Shortest Remaining Time First (SRTF)',
    metrics,
    averageTurnaroundTime,
    averageWaitingTime,
    contextSwitches,
    timeline,
    verticalDiagram,
  };
}
