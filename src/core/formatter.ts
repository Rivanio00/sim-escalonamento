import type { SecondState, SimulationResult } from './types.ts';

const COL_WIDTH = 4; // largura de cada coluna de processo ("P1  ", "##  ", "--  ")

/**
 * Gera o diagrama vertical de execução no formato pedido na especificação:
 *
 *   tempo  P1  P2  P3  P4
 *    0- 1  --  ##
 *    1- 2  --  ##  --
 *    2- 3  ##      --
 *
 * '##' = usando o processador, '--' = pronto esperando, vazio = não existe (ainda)
 * ou já terminou.
 */
export function generateVerticalDiagram(processIds: string[], timeline: SecondState[]): string {
  if (timeline.length === 0) {
    return 'Nenhuma execução registrada.';
  }

  // Alinha os números do intervalo pela quantidade de dígitos do último instante,
  // produzindo " 0- 1", " 9-10", "13-14" — todos com a mesma largura.
  const lastEnd = timeline[timeline.length - 1].timeEnd;
  // Mínimo de 2 para que simulações curtas ainda saiam no formato do enunciado
  // (" 0- 1") em vez de "0-1".
  const digits = Math.max(2, String(lastEnd).length);
  const timeLabel = (start: number, end: number) =>
    `${String(start).padStart(digits)}-${String(end).padStart(digits)}`;
  const timeWidth = Math.max('tempo'.length, timeLabel(lastEnd - 1, lastEnd).length);

  const cell = (text: string) => text.padEnd(COL_WIDTH, ' ');
  const row = (label: string, cells: string[]) =>
    `${label.padEnd(timeWidth, ' ')}  ${cells.map(cell).join('')}`.trimEnd();

  const lines = [row('tempo', processIds)];

  for (const step of timeline) {
    const cells = processIds.map((id) => {
      switch (step.processStates[id] ?? 'NONE') {
        case 'RUNNING':
          return '##';
        case 'READY':
          return '--';
        default:
          return '';
      }
    });
    lines.push(row(timeLabel(step.timeStart, step.timeEnd), cells));
  }

  return lines.join('\n');
}

/**
 * Formata o resultado completo da simulação para a saída padrão (stdout).
 */
export function formatStdoutReport(result: SimulationResult): string {
  const rule = '='.repeat(64);
  const lines: string[] = [
    rule,
    `Algoritmo: ${result.algorithmName}`,
    rule,
    `Tempo médio de vida (turnaround time, tt): ${result.averageTurnaroundTime.toFixed(2)}s`,
    `Tempo médio de espera (waiting time, tw):   ${result.averageWaitingTime.toFixed(2)}s`,
    `Número de trocas de contexto:              ${result.contextSwitches}`,
    '',
    'Tabela detalhada de processos:',
    'ID  | Chegada | Duração | Início | Término | Vida (TT) | Espera (TW)',
    '----+---------+---------+--------+---------+-----------+------------',
  ];

  for (const m of result.metrics) {
    lines.push(
      [
        m.id.padEnd(3),
        String(m.arrivalTime).padStart(7),
        String(m.duration).padStart(7),
        String(m.startTime).padStart(6),
        String(m.completionTime).padStart(7),
        String(m.turnaroundTime).padStart(9),
        String(m.waitingTime).padStart(10),
      ].join(' | ')
    );
  }

  lines.push('', 'Diagrama de tempo da execução:', result.verticalDiagram, '');
  return lines.join('\n');
}
