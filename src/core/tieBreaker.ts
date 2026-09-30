import type { RuntimeProcess } from './types.ts';

// Reexportado por compatibilidade: RuntimeProcess mora em types.ts.
export type { RuntimeProcess } from './types.ts';

/**
 * Aplica as diretrizes de desempate estabelecidas no enunciado, em ordem:
 *
 *   (i)   alocar o processo que já está com o processador, para evitar troca de contexto;
 *   (ii)  processo com menor tempo restante de processamento;
 *   (iii) em último caso, um critério determinístico — aqui, menor instante de chegada
 *         e depois a ordem de declaração (P1 antes de P2).
 *
 * O enunciado diz "aleatório" em (iii); trocamos por um critério fixo para que a
 * simulação seja reprodutível (mesma entrada => mesmo diagrama), o que é essencial
 * para conferir o resultado contra o gabarito.
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

  // (i) quem já está na CPU tem preferência
  const running = candidates.find((p) => p.id === currentlyRunningId);
  if (running) {
    return running;
  }

  // (ii) menor tempo restante de processamento
  const minRemaining = Math.min(...candidates.map((p) => p.remainingTime));
  const byRemaining = candidates.filter((p) => p.remainingTime === minRemaining);
  if (byRemaining.length === 1) {
    return byRemaining[0];
  }

  // (iii) critério determinístico: chegada, depois ordem de declaração
  return byRemaining.reduce((best, p) =>
    p.arrivalTime !== best.arrivalTime
      ? p.arrivalTime < best.arrivalTime
        ? p
        : best
      : p.order < best.order
        ? p
        : best
  );
}
