import { runFCFS } from '../core/algorithms/fcfs';
import { runSJF } from '../core/algorithms/sjf';
import { runSRTF } from '../core/algorithms/srtf';
import { runPriorityPreemptive } from '../core/algorithms/priorityPreemptive';
import { runPriorityNonPreemptive } from '../core/algorithms/priorityNonPreemptive';
import { runRoundRobin } from '../core/algorithms/roundRobin';
import { runRoundRobinAging } from '../core/algorithms/roundRobinAging';

// A ordem desta lista define a ordem dos checkboxes e dos cards de resultado.
// usaQuantum / usaAging controlam o subtítulo mostrado no card.
export const ALGORITMOS = [
  { key: 'FCFS', label: 'FCFS', titulo: 'FCFS', run: (p) => runFCFS(p) },
  { key: 'SJF', label: 'SJF', titulo: 'SJF', run: (p) => runSJF(p) },
  { key: 'SRTF', label: 'SRTF', titulo: 'SRTF', run: (p) => runSRTF(p) },
  { key: 'PRIORITY_NP', label: 'Prioridade', titulo: 'Prioridade (sem preempção)', run: (p) => runPriorityNonPreemptive(p) },
  { key: 'PRIORITY_P', label: 'Prioridade preemptiva', titulo: 'Prioridade (com preempção)', run: (p) => runPriorityPreemptive(p) },
  { key: 'RR', label: 'Round-Robin', titulo: 'Round-Robin', usaQuantum: true, run: (p, c) => runRoundRobin(p, c) },
  {
    key: 'RR_AGING',
    label: 'RR com prioridade e aging',
    titulo: 'Round-Robin com prioridade e aging',
    usaQuantum: true,
    usaAging: true,
    run: (p, c) => runRoundRobinAging(p, c),
  },
];
