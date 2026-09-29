import type { Config, ProcessInput, ProcessMetrics, ProcessStateInSecond, SecondState, SimulationResult } from '../types.ts';
import { breakTie, type RuntimeProcess } from '../tieBreaker.ts';
import { generateVerticalDiagram } from '../formatter.ts';

/**
 * Round-Robin com prioridade e envelhecimento.
 *
 * Diferente do RR clássico (que usa uma fila FIFO), aqui a escolha do próximo processo
 * a cada quantum é feita pela prioridade DINÂMICA (pd), seguindo o "Algoritmo simples"
 * apresentado em aula (slide 120):
 *   - pd_novo <- prioridade estática, quando o processo chega ao sistema
 *   - a cada despacho: escolhe-se quem tem maior pd; a pd de todos os OUTROS prontos
 *     aumenta em `config.aging`; a pd do escolhido volta para a sua prioridade estática
 *   - o processo roda por até `config.quantum` segundos (ou até terminar)
 *   - NÃO há preempção por prioridade: uma chegada mais prioritária não interrompe
 *     quem está no processador no meio do quantum, só quando o quantum se esgota
 *     (ou o processo termina) é que uma nova escolha é feita
 */
export function runRoundRobinAging(inputs: ProcessInput[], config: Config): SimulationResult {
  if (inputs.length === 0) {
    return {
      algorithmName: 'Round-Robin com Prioridade e Envelhecimento',
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
    currentPriority: p.staticPriority, // pd inicial = prioridade estática
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
  let quantumUsed = 0;

  const timeline: SecondState[] = [];

  while (finishedCount < totalProcesses) {
    // 1. Só escolhe um novo processo quando o processador está livre
    // (fim de quantum ou conclusão do anterior) — não há preempção por prioridade.
    if (currentlyRunning === null) {
      const ready = processes.filter(
        (p) => p.arrivalTime <= currentTime && p.remainingTime > 0
      );

      if (ready.length > 0) {
        let maxPd = -Infinity;
        for (const p of ready) {
          if (p.currentPriority > maxPd) {
            maxPd = p.currentPriority;
          }
        }
        const tied = ready.filter((p) => p.currentPriority === maxPd);
        // Se o processo que acabou de soltar o processador (mesmo instante) estiver
        // empatado, ele continua — evita troca de contexto desnecessária.
        currentlyRunning = breakTie(tied, previousRunningId);

        // 2. Envelhecimento: todo mundo que ficou pronto e NÃO foi escolhido ganha +aging.
        // O escolhido volta para a sua prioridade estática (reinicia o envelhecimento dele).
        for (const p of ready) {
          if (p.id !== currentlyRunning.id) {
            p.currentPriority += config.aging;
          }
        }
        currentlyRunning.currentPriority = currentlyRunning.staticPriority;
        quantumUsed = 0;

        if (currentlyRunning.startTime === null) {
          currentlyRunning.startTime = currentTime;
        }
      }
    }

    // 3. Contabiliza troca de contexto
    const currentId = currentlyRunning ? currentlyRunning.id : null;
    if (
      previousRunningId !== null &&
      currentId !== null &&
      currentId !== previousRunningId
    ) {
      contextSwitches += 1;
    }
    previousRunningId = currentId;

    // 4. Monta o snapshot do segundo atual [currentTime, currentTime + 1]
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

    // 5. Executa 1 segundo do processo em CPU
    if (currentlyRunning) {
      currentlyRunning.remainingTime -= 1;
      quantumUsed += 1;

      if (currentlyRunning.remainingTime === 0) {
        currentlyRunning.completionTime = currentTime + 1;
        finishedCount += 1;
        currentlyRunning = null;
        quantumUsed = 0;
      } else if (quantumUsed === config.quantum) {
        // Esgotou o quantum: libera o processador para uma nova escolha por prioridade
        currentlyRunning = null;
        quantumUsed = 0;
      }
    }

    currentTime += 1;
  }

  // 6. Calcula as métricas consolidadas
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
    algorithmName: 'Round-Robin com Prioridade e Envelhecimento',
    metrics,
    averageTurnaroundTime,
    averageWaitingTime,
    contextSwitches,
    timeline,
    verticalDiagram,
  };
}