import type { ProcessMetrics, SecondState, SimulationResult } from './types.ts';

/**
 * Gera o diagrama vertical de execução exatamente como solicitado na especificação:
 * tempo P1 P2 P3 P4
 * 0- 1  ## --
 * 1- 2  ## -- --
 * 2- 3  -- ## --
 */
export function generateVerticalDiagram(
  processIds: string[],
  timeline: SecondState[]
): string {
  if (timeline.length === 0) {
    return 'Nenhuma execução registrada.';
  }

  // Descobre a largura máxima do campo de tempo (ex: "10-11" tem 5 caracteres, "100-101" tem 7)
  const maxTime = timeline[timeline.length - 1].timeEnd;
  const sampleTimeLabel = `${maxTime - 1}-${maxTime}`;
  const timeColWidth = Math.max(5, sampleTimeLabel.length);

  // Cabeçalho: "tempo P1 P2 P3 ..."
  const headerTime = 'tempo'.padEnd(timeColWidth, ' ');
  const headerCols = processIds.map((id) => id.padEnd(3, ' ')).join(' ');
  const lines: string[] = [`${headerTime} ${headerCols}`.trimEnd()];

  for (const step of timeline) {
    // Formata o tempo: "0- 1", "9-10", "10-11"
    const startStr = step.timeStart.toString();
    const endStr = step.timeEnd.toString().padStart(startStr.length === 1 && step.timeEnd < 10 ? 2 : 1, ' ');
    const timeLabel = `${startStr}-${endStr}`.padEnd(timeColWidth, ' ');

    const cols: string[] = [];
    for (const pid of processIds) {
      const state = step.processStates[pid] ?? 'NONE';
      if (state === 'RUNNING') {
        cols.push('##');
      } else if (state === 'READY') {
        cols.push('--');
      } else {
        cols.push('  ');
      }
    }

    // Alinha cada coluna com largura de 3 caracteres ("## ", "-- ", "   ")
    const formattedCols = cols.map((c) => c.padEnd(3, ' ')).join('');
    const fullLine = `${timeLabel} ${formattedCols}`.trimEnd();
    lines.push(fullLine);
  }

  return lines.join('\n');
}

/**
 * Formata o resultado completo da simulação para a saída padrão (stdout).
 */
export function formatStdoutReport(result: SimulationResult): string {
  const lines: string[] = [];

  lines.push(`================================================================`);
  lines.push(`Algoritmo: ${result.algorithmName}`);
  lines.push(`================================================================`);
  lines.push(`Tempo médio de vida (turnaround time, tt): ${result.averageTurnaroundTime.toFixed(2)}s`);
  lines.push(`Tempo médio de espera (waiting time, tw):   ${result.averageWaitingTime.toFixed(2)}s`);
  lines.push(`Número de trocas de contexto:              ${result.contextSwitches}`);
  lines.push('');
  lines.push('Tabela detalhada de processos:');
  lines.push('ID  | Chegada | Duração | Início | Término | Vida (TT) | Espera (TW)');
  lines.push('----+---------+---------+--------+---------+-----------+------------');
  for (const m of result.metrics) {
    lines.push(
      `${m.id.padEnd(3)} | ` +
      `${m.arrivalTime.toString().padStart(7)} | ` +
      `${m.duration.toString().padStart(7)} | ` +
      `${m.startTime.toString().padStart(6)} | ` +
      `${m.completionTime.toString().padStart(7)} | ` +
      `${m.turnaroundTime.toString().padStart(9)} | ` +
      `${m.waitingTime.toString().padStart(10)}`
    );
  }
  lines.push('');
  lines.push('Diagrama de tempo da execução:');
  lines.push(result.verticalDiagram);
  lines.push('');

  return lines.join('\n');
}
