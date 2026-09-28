import type { ProcessInput } from './types.ts';

export interface RuntimeProcess {
  input: ProcessInput;
  id: string;
  order: number;
  arrivalTime: number;
  duration: number;
  remainingTime: number;
  staticPriority: number;
  currentPriority: number;
  startTime: number | null;
  completionTime: number | null;
}

/**
 * Aplica as diretrizes de desempate estabelecidas no enunciado:
 * (i)  alocar o processo que já esteja com o processador, para evitar troca de contexto;
 * (ii) processo com menor tempo restante de processamento;
 * (iii) em último caso, desempate determinístico (ordem de criação/declaração P1 < P2).
 */
export function breakTie(
  candidates: RuntimeProcess[],
  currentlyRunningId: string | null
): RuntimeProcess {
  if (candidates.length === 0) {
    throw new Error('Nenhum candidato fornecido para desempate.');
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  // (i) Se o processo atualmente no processador está entre os empatados, mantém ele
  if (currentlyRunningId !== null) {
    const running = candidates.find((p) => p.id === currentlyRunningId);
    if (running) {
      return running;
    }
  }

  // (ii) Menor tempo restante de processamento
  let minRemaining = Infinity;
  for (const p of candidates) {
    if (p.remainingTime < minRemaining) {
      minRemaining = p.remainingTime;
    }
  }

  const byRemaining = candidates.filter((p) => p.remainingTime === minRemaining);
  if (byRemaining.length === 1) {
    return byRemaining[0];
  }

  // (iii) Desempate por instante de chegada e ordem original de leitura
  byRemaining.sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) {
      return a.arrivalTime - b.arrivalTime;
    }
    return a.order - b.order;
  });

  return byRemaining[0];
}
