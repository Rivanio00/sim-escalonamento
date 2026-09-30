import {
  runFCFS,
  runSJF,
  runSRTF,
  runPriorityPreemptive,
  runPriorityNonPreemptive,
  runRoundRobin,
  runRoundRobinAging,
} from './schedulers.ts';
import type { ProcessInput } from './types.ts';

// ---------------------------------------------------------------------------
// Convenções usadas no gabarito (confirme se batem com o enunciado do projeto):
//  - Prioridade: NÚMERO MAIOR = MAIS PRIORITÁRIO (deduzido do seu teste 7).
//  - Troca de contexto: conta quando o processo em execução muda para OUTRO
//    processo (n-1 no FCFS). Continuar o mesmo processo não conta.
//  - Desempate (definido no enunciado): (i) processo que já está na CPU,
//    (ii) menor tempo restante, (iii) aleatório (na prática, ordem de entrada).
// ---------------------------------------------------------------------------

type Seg = [string, number]; // [idProcesso | 'IDLE', duração em segundos]
type Resultado = ReturnType<typeof runFCFS>;

interface Caso {
  nome: string;
  inputs: ProcessInput[];
  executar: () => Resultado;
  esperado?: { timeline: Seg[]; avgTT: number; avgTW: number; trocas: number };
  nota?: string;
}

const P = (i: number, arr: number, dur: number, prio: number): ProcessInput => ({
  id: `P${i}`, order: i, arrivalTime: arr, duration: dur, staticPriority: prio,
});

const expandir = (segs: Seg[]): (string | null)[] =>
  segs.flatMap(([id, n]) => Array(n).fill(id === 'IDLE' ? null : id));

const gantt = (tl: (string | null)[]): string => {
  const out: string[] = [];
  let ini = 0;
  for (let t = 1; t <= tl.length; t++) {
    if (t === tl.length || tl[t] !== tl[ini]) {
      out.push(`[${ini}-${t} ${tl[ini] ?? 'IDLE'}]`);
      ini = t;
    }
  }
  return out.join(' ');
};

const igual = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// Calcula métricas por processo a partir de uma timeline (oráculo independente)
function metricasDoTimeline(inputs: ProcessInput[], tl: (string | null)[]) {
  const m: Record<string, { start: number; completion: number; tt: number; tw: number }> = {};
  for (const p of inputs) {
    const idx = tl.map((x, i) => (x === p.id ? i : -1)).filter((i) => i >= 0);
    const start = idx.length ? idx[0] : -1;
    const completion = idx.length ? idx[idx.length - 1] + 1 : -1;
    const tt = completion - p.arrivalTime;
    m[p.id] = { start, completion, tt, tw: tt - p.duration };
  }
  return m;
}

let falhas = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`   ${ok ? '✅' : '❌'} ${msg}`);
  if (!ok) falhas++;
};

// ---------------------------------------------------------------------------
// Invariantes: valem para QUALQUER algoritmo (inclusive o RR com aging)
// ---------------------------------------------------------------------------
function validarInvariantes(inputs: ProcessInput[], r: Resultado) {
  const tl = r.timeline.map((s: any) => s.runningProcessId as string | null);
  const calc = metricasDoTimeline(inputs, tl);

  for (const p of inputs) {
    const exec = tl.filter((x) => x === p.id).length;
    check(exec === p.duration, `${p.id} executou ${exec}s (duração ${p.duration}s)`);

    const primeiro = tl.indexOf(p.id);
    check(primeiro >= p.arrivalTime, `${p.id} não executou antes de chegar (t=${primeiro}, chegada ${p.arrivalTime})`);

    const met = r.metrics.find((m: any) => m.id === p.id);
    check(!!met, `${p.id} possui métrica`);
    if (met) {
      check(met.startTime === calc[p.id].start, `${p.id} startTime=${met.startTime} (timeline diz ${calc[p.id].start})`);
      check(met.completionTime === calc[p.id].completion, `${p.id} completionTime=${met.completionTime} (timeline diz ${calc[p.id].completion})`);
    }
  }

  const n = inputs.length;
  const mediaTT = inputs.reduce((s, p) => s + calc[p.id].tt, 0) / n;
  const mediaTW = inputs.reduce((s, p) => s + calc[p.id].tw, 0) / n;
  check(igual(r.averageTurnaroundTime, mediaTT), `TT médio ${r.averageTurnaroundTime} coerente com a timeline (${mediaTT})`);
  check(igual(r.averageWaitingTime, mediaTW), `TW médio ${r.averageWaitingTime} coerente com a timeline (${mediaTW})`);

  let trocas = 0;
  let ultimo: string | null = null;
  for (const x of tl) {
    if (x !== null) {
      if (ultimo !== null && x !== ultimo) trocas++;
      ultimo = x;
    }
  }
  console.log(`   ℹ️  trocas de contexto reportadas: ${r.contextSwitches} | contadas na timeline (ignorando ociosidade): ${trocas}`);
}

// ---------------------------------------------------------------------------
// Casos com gabarito calculado à mão
// ---------------------------------------------------------------------------
const EX = [P(1, 0, 5, 2), P(2, 0, 2, 3), P(3, 1, 4, 1), P(4, 3, 3, 4)];

const casos: Caso[] = [
  {
    nome: 'FCFS - sem empate de chegada',
    inputs: [P(1, 0, 3, 1), P(2, 1, 2, 1), P(3, 2, 1, 1)],
    executar: function () { return runFCFS(this.inputs); },
    esperado: {
      timeline: [['P1', 3], ['P2', 2], ['P3', 1]],
      avgTT: 11 / 3, // 3, 4, 4
      avgTW: 5 / 3,  // 0, 2, 3
      trocas: 2,
    },
  },
  {
    nome: 'FCFS - exemplo base (empate em t=0 resolvido por menor tempo restante)',
    inputs: EX,
    executar: function () { return runFCFS(this.inputs); },
    esperado: {
      // P1 e P2 chegam em t=0: regra (ii) do enunciado escolhe P2 (2s < 5s)
      timeline: [['P2', 2], ['P1', 5], ['P3', 4], ['P4', 3]],
      avgTT: 7.5, // P2 2, P1 7, P3 10, P4 11
      avgTW: 4.0, // 0, 2, 6, 8
      trocas: 3,
    },
  },
  {
    nome: 'SJF - exemplo base',
    inputs: EX,
    executar: function () { return runSJF(this.inputs); },
    esperado: {
      timeline: [['P2', 2], ['P3', 4], ['P4', 3], ['P1', 5]],
      avgTT: 6.75, // 2, 5, 6, 14
      avgTW: 3.25, // 0, 1, 3, 9
      trocas: 3,
    },
  },
  {
    nome: 'SRTF - exemplo clássico com várias preempções',
    inputs: [P(1, 0, 7, 1), P(2, 2, 4, 1), P(3, 4, 1, 1), P(4, 5, 4, 1)],
    executar: function () { return runSRTF(this.inputs); },
    esperado: {
      timeline: [['P1', 2], ['P2', 2], ['P3', 1], ['P2', 2], ['P4', 4], ['P1', 5]],
      avgTT: 7.0, // 16, 5, 1, 6
      avgTW: 3.0, // 9, 1, 0, 2
      trocas: 5,
    },
  },
  {
    nome: 'Prioridade NÃO preemptiva - exemplo base',
    inputs: EX,
    executar: function () { return runPriorityNonPreemptive(this.inputs); },
    esperado: {
      timeline: [['P2', 2], ['P1', 5], ['P4', 3], ['P3', 4]],
      avgTT: 7.25, // P2 2, P1 7, P4 7, P3 13
      avgTW: 3.75, // 0, 2, 4, 9
      trocas: 3,
    },
  },
  {
    nome: 'Prioridade PREEMPTIVA - exemplo base',
    inputs: EX,
    executar: function () { return runPriorityPreemptive(this.inputs); },
    esperado: {
      // P4 (prio 4) chega em t=3 e preempta P1
      timeline: [['P2', 2], ['P1', 1], ['P4', 3], ['P1', 4], ['P3', 4]],
      avgTT: 7.0, // P2 2, P4 3, P1 10, P3 13
      avgTW: 3.5, // 0, 0, 5, 9
      trocas: 4,
    },
  },
  {
    nome: 'Round-Robin (q=2) - com chegadas no meio, sem empates',
    inputs: [P(1, 0, 5, 1), P(2, 1, 3, 1), P(3, 3, 2, 1)],
    executar: function () { return runRoundRobin(this.inputs, { quantum: 2, aging: 1 }); },
    esperado: {
      timeline: [['P1', 2], ['P2', 2], ['P1', 2], ['P3', 2], ['P2', 1], ['P1', 1]],
      avgTT: 23 / 3, // P1 10, P2 8, P3 5
      avgTW: 13 / 3, // 5, 5, 3
      trocas: 5,
    },
  },
  {
    nome: 'Round-Robin (q=2) - caso do seu teste original',
    inputs: [P(1, 0, 5, 1), P(2, 0, 3, 2)],
    executar: function () { return runRoundRobin(this.inputs, { quantum: 2, aging: 1 }); },
    esperado: {
      timeline: [['P1', 2], ['P2', 2], ['P1', 2], ['P2', 1], ['P1', 1]],
      avgTT: 7.5, // P1 8, P2 7
      avgTW: 3.5, // 3, 4
      trocas: 4,
    },
  },
  {
    nome: 'Round-Robin (q=2) - DIAGRAMA DO ENUNCIADO (exemplo oficial)',
    inputs: EX,
    executar: function () { return runRoundRobin(this.inputs, { quantum: 2, aging: 1 }); },
    esperado: {
      // Reproduz o diagrama de tempo do PDF, linha por linha
      timeline: [['P1', 2], ['P2', 2], ['P3', 2], ['P1', 2], ['P4', 2], ['P3', 2], ['P1', 1], ['P4', 1]],
      avgTT: 9.75, // P1 13, P2 4, P3 11, P4 11
      avgTW: 6.25, // 8, 2, 7, 8
      trocas: 7,
    },
    nota: 'Gabarito extraído do diagrama vertical do enunciado.',
  },
  {
    nome: 'Desempate (i) SRTF - empate no restante mantém o processo na CPU',
    inputs: [P(1, 0, 4, 1), P(2, 1, 3, 1)],
    executar: function () { return runSRTF(this.inputs); },
    esperado: {
      // t=1: P1 restante 3, P2 restante 3 -> empate -> P1 continua
      timeline: [['P1', 4], ['P2', 3]],
      avgTT: 5.0, // 4, 6
      avgTW: 1.5, // 0, 3
      trocas: 1,
    },
  },
  {
    nome: 'Desempate (i) Prioridade preemptiva - prioridade igual não preempta',
    inputs: [P(1, 0, 4, 2), P(2, 1, 2, 2)],
    executar: function () { return runPriorityPreemptive(this.inputs); },
    esperado: {
      timeline: [['P1', 4], ['P2', 2]],
      avgTT: 4.5, // 4, 5
      avgTW: 1.5, // 0, 3
      trocas: 1,
    },
  },
  {
    nome: 'Desempate (ii) Prioridade não preemptiva - prioridade igual, menor restante vence',
    inputs: [P(1, 0, 3, 1), P(2, 1, 4, 2), P(3, 2, 2, 2)],
    executar: function () { return runPriorityNonPreemptive(this.inputs); },
    esperado: {
      // t=3: P2 e P3 com prioridade 2 -> P3 (2s) antes de P2 (4s)
      timeline: [['P1', 3], ['P3', 2], ['P2', 4]],
      avgTT: 14 / 3, // P1 3, P3 3, P2 8
      avgTW: 5 / 3,  // 0, 1, 4
      trocas: 2,
    },
  },
  {
    nome: 'CPU ociosa (FCFS)',
    inputs: [P(1, 2, 2, 1)],
    executar: function () { return runFCFS(this.inputs); },
    esperado: {
      timeline: [['IDLE', 2], ['P1', 2]],
      avgTT: 2,
      avgTW: 0,
      trocas: 0,
    },
  },
  {
    nome: 'Round-Robin + Aging (q=2, aging=1)',
    inputs: [P(1, 0, 6, 1), P(2, 0, 4, 2), P(3, 1, 2, 3)],
    executar: function () { return runRoundRobinAging(this.inputs, { quantum: 2, aging: 1 }); },
    esperado: {
      // t=0: P2(2)>P1(1) roda. t=2: P1 envelhece p/ 2, P3 (3+) vence. t=4: P1 e P2 empatam
      // em 3 -> menor restante (P2, 2s) vence. t=6: só P1 resta.
      timeline: [['P2', 2], ['P3', 2], ['P2', 2], ['P1', 6]],
      avgTT: 7, // P1 12, P2 6, P3 3
      avgTW: 3, // 6, 2, 1
      trocas: 3,
    },
    nota:
      'Gabarito depende da hipótese: maior número = maior prioridade e +aging a cada quantum ' +
      'para quem espera na fila. Confirmar com o schedulers.ts (roundRobinAging) / professor.',
  },
];

// ---------------------------------------------------------------------------
// Execução e relatório
// ---------------------------------------------------------------------------
console.log('Testes com gabarito do Escalonador\n');

for (const c of casos) {
  console.log('='.repeat(78));
  console.log(c.nome);
  console.log('='.repeat(78));
  console.log('Entrada: ' + c.inputs.map((p) => `${p.id}(chega=${p.arrivalTime}, dur=${p.duration}, prio=${p.staticPriority})`).join('  '));
  if (c.nota) console.log(`NOTA: ${c.nota}`);

  const r = c.executar();
  const tlObtida = r.timeline.map((s: any) => s.runningProcessId as string | null);
  console.log(`\n Obtido  : ${gantt(tlObtida)}`);

  if (c.esperado) {
    const tlEsp = expandir(c.esperado.timeline);
    console.log(` Esperado: ${gantt(tlEsp)}\n`);

    // Tabela por processo
    const esp = metricasDoTimeline(c.inputs, tlEsp);
    console.log('   Proc | conclusão (esp/obt) | TT (esp/obt) | TW (esp/obt)');
    const obt = metricasDoTimeline(c.inputs, tlObtida);
    for (const p of c.inputs) {
      const m = r.metrics.find((x: any) => x.id === p.id);
      const compl = m ? m.completionTime : '?';
      console.log(
        `   ${p.id.padEnd(4)} | ${String(esp[p.id].completion).padStart(8)} / ${String(compl).padEnd(8)} | ` +
        `${String(esp[p.id].tt).padStart(5)} / ${String(obt[p.id].tt).padEnd(5)} | ` +
        `${String(esp[p.id].tw).padStart(5)} / ${String(obt[p.id].tw).padEnd(5)}`
      );
    }
    console.log();

    check(
      JSON.stringify(tlEsp) === JSON.stringify(tlObtida),
      'Timeline (Gantt) igual ao gabarito'
    );
    check(igual(r.averageTurnaroundTime, c.esperado.avgTT), `TT médio: esperado ${c.esperado.avgTT.toFixed(4)} | obtido ${r.averageTurnaroundTime}`);
    check(igual(r.averageWaitingTime, c.esperado.avgTW), `TW médio: esperado ${c.esperado.avgTW.toFixed(4)} | obtido ${r.averageWaitingTime}`);
    check(r.contextSwitches === c.esperado.trocas, `Trocas de contexto: esperado ${c.esperado.trocas} | obtido ${r.contextSwitches}`);
  } else {
    console.log();
  }

  console.log('\n   Invariantes:');
  validarInvariantes(c.inputs, r);
  console.log();
}

console.log(falhas === 0 ? '🎉 Tudo conforme o gabarito.' : `⚠️  ${falhas} verificação(ões) falharam.`);
process.exitCode = falhas === 0 ? 0 : 1;