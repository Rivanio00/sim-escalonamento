import {
  runFCFS,
  runSJF,
  runSRTF,
  runPriorityPreemptive,
  runPriorityNonPreemptive,
  runRoundRobin,
  runRoundRobinAging,
} from './schedulers.ts';
import assert from 'node:assert/strict';
import { parseInput, parseConfig, parseProcessInput } from './parser.ts';
import { simulate } from './simulate.ts';
import type { ProcessInput } from './types.ts';

console.log('Iniciando testes unitários do Escalonador...\n');

// 1. Teste do Parser Completo (quantum e aging vindos do próprio arquivo de entrada)
{
  const rawInput = `
    # Configuração no próprio arquivo
    quantum: 3
    aging: 2

    # Processos
    0 5 2
    0 2 3
    1 4 1
    3 3 4
  `;
  const { config, processes } = parseInput(rawInput);
  assert.equal(config.quantum, 3, 'Quantum deve ser 3');
  assert.equal(config.aging, 2, 'Aging deve ser 2');
  assert.equal(processes.length, 4, 'Deve conter 4 processos');
  assert.equal(processes[0].id, 'P1');
  assert.equal(processes[0].duration, 5);
  console.log('✅ Parser de Entrada Unificada (chave-valor): OK');
}

// 2. Teste do Parser com cabeçalho numérico "quantum aging" (ex: 4 1)
{
  const rawInput = `
    4 1
    0 5 2
    0 2 3
  `;
  const { config, processes } = parseInput(rawInput);
  assert.equal(config.quantum, 4, 'Quantum deve ser 4');
  assert.equal(config.aging, 1, 'Aging deve ser 1');
  assert.equal(processes.length, 2, 'Deve conter 2 processos');
  console.log('✅ Parser de Entrada Unificada (cabeçalho numérico): OK');
}

// 3. Teste de retrocompatibilidade do parseConfig e parseProcessInput
{
  const rawConfig = `
    quantum: 4
    aging: 2
  `;
  const config = parseConfig(rawConfig);
  assert.equal(config.quantum, 4, 'Quantum deve ser 4');
  assert.equal(config.aging, 2, 'Aging deve ser 2');

  const rawInput = `
    0 5 2
    0 2 3
  `;
  const processes = parseProcessInput(rawInput);
  assert.equal(processes.length, 2, 'Deve conter 2 processos');
  console.log('✅ Retrocompatibilidade parseConfig / parseProcessInput: OK');
}

// 3. Teste FCFS com entrada do exemplo
{
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 0, duration: 5, staticPriority: 2 },
    { id: 'P2', order: 2, arrivalTime: 0, duration: 2, staticPriority: 3 },
    { id: 'P3', order: 3, arrivalTime: 1, duration: 4, staticPriority: 1 },
    { id: 'P4', order: 4, arrivalTime: 3, duration: 3, staticPriority: 4 },
  ];

  const result = runFCFS(inputs);
  assert.equal(result.contextSwitches, 3, 'FCFS deve ter 3 trocas de contexto');
  assert.equal(result.averageTurnaroundTime, 7.5, 'TT médio deve ser 7.5s');
  assert.equal(result.averageWaitingTime, 4.0, 'TW médio deve ser 4.0s');
  console.log('✅ FCFS Exemplo Base: OK');
}

// 4. Teste SJF com entrada do exemplo
{
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 0, duration: 5, staticPriority: 2 },
    { id: 'P2', order: 2, arrivalTime: 0, duration: 2, staticPriority: 3 },
    { id: 'P3', order: 3, arrivalTime: 1, duration: 4, staticPriority: 1 },
    { id: 'P4', order: 4, arrivalTime: 3, duration: 3, staticPriority: 4 },
  ];

  const result = runSJF(inputs);
  assert.equal(result.contextSwitches, 3, 'SJF deve ter 3 trocas de contexto');
  assert.equal(result.averageTurnaroundTime, 6.75, 'TT médio deve ser 6.75s');
  assert.equal(result.averageWaitingTime, 3.25, 'TW médio deve ser 3.25s');
  console.log('✅ SJF Exemplo Base: OK');
}

// 5. Teste SRTF com preempção real
{
  // P1 chega em 0 com duração 8
  // P2 chega em 2 com duração 2 (vai preemptar P1 pois 2 < 6)
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 0, duration: 8, staticPriority: 1 },
    { id: 'P2', order: 2, arrivalTime: 2, duration: 2, staticPriority: 1 },
  ];

  const result = runSRTF(inputs);
  // De 0 a 2: P1 executa (restante 6)
  // De 2 a 4: P2 executa e finaliza em 4 (restante 0)
  // De 4 a 10: P1 retoma e finaliza em 10
  const m1 = result.metrics.find((m) => m.id === 'P1')!;
  const m2 = result.metrics.find((m) => m.id === 'P2')!;

  assert.equal(m2.completionTime, 4, 'P2 deve finalizar em t=4');
  assert.equal(m1.completionTime, 10, 'P1 deve finalizar em t=10');
  assert.equal(result.contextSwitches, 2, 'Deve haver 2 trocas de contexto (P1->P2 e P2->P1)');
  console.log('✅ SRTF Preempção Real: OK');
}

// 6. Teste Prioridade Não-Preemptiva
{
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 0, duration: 5, staticPriority: 2 },
    { id: 'P2', order: 2, arrivalTime: 0, duration: 2, staticPriority: 3 },
    { id: 'P3', order: 3, arrivalTime: 1, duration: 4, staticPriority: 1 },
    { id: 'P4', order: 4, arrivalTime: 3, duration: 3, staticPriority: 4 },
  ];

  const result = runPriorityNonPreemptive(inputs);

  assert.equal(result.metrics.length, 4, 'Deve haver métricas para os 4 processos');
  assert.equal(result.timeline.length, 14, 'Timeline deve ter 14 segundos');

  console.log('✅ Prioridade Não-Preemptiva: OK');
}

// 7. Teste Prioridade Preemptiva
{
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 0, duration: 8, staticPriority: 1 },
    { id: 'P2', order: 2, arrivalTime: 2, duration: 2, staticPriority: 3 },
  ];

  const result = runPriorityPreemptive(inputs);

  const m1 = result.metrics.find((m) => m.id === 'P1')!;
  const m2 = result.metrics.find((m) => m.id === 'P2')!;

  assert.equal(m2.startTime, 2, 'P2 deve iniciar em t=2');
  assert.equal(m2.completionTime, 4, 'P2 deve finalizar em t=4');
  assert.equal(m1.completionTime, 10, 'P1 deve finalizar em t=10');
  assert.equal(result.contextSwitches, 2, 'Deve haver 2 trocas de contexto');

  console.log('✅ Prioridade Preemptiva: OK');
}

// 8. Teste Round-Robin
{
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 0, duration: 5, staticPriority: 1 },
    { id: 'P2', order: 2, arrivalTime: 0, duration: 3, staticPriority: 2 },
  ];

  const config = {
    quantum: 2,
    aging: 1,
  };

  const result = runRoundRobin(inputs, config);

  const m1 = result.metrics.find((m) => m.id === 'P1')!;
  const m2 = result.metrics.find((m) => m.id === 'P2')!;

  assert.equal(m1.completionTime, 8, 'P1 deve finalizar em t=8');
  assert.equal(m2.completionTime, 7, 'P2 deve finalizar em t=7');
  assert.equal(result.contextSwitches, 4, 'Deve haver 4 trocas de contexto');

  console.log('✅ Round-Robin: OK');
}

// 9. Teste Round-Robin com Prioridade e Aging
{
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 0, duration: 6, staticPriority: 1 },
    { id: 'P2', order: 2, arrivalTime: 0, duration: 4, staticPriority: 2 },
    { id: 'P3', order: 3, arrivalTime: 1, duration: 2, staticPriority: 3 },
  ];

  const config = {
    quantum: 2,
    aging: 1,
  };

  const result = runRoundRobinAging(inputs, config);

  assert.equal(result.metrics.length, 3, 'Deve haver métricas para os 3 processos');
  assert.ok(result.timeline.length > 0, 'Timeline deve ser gerada');

  console.log('✅ Round-Robin + Aging: OK');
}

// 10. Teste de CPU Ociosa (Idle Time)
{
  // P1 chega em 2 com duração 2
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 2, duration: 2, staticPriority: 1 },
  ];

  const result = runFCFS(inputs);
  assert.equal(result.timeline.length, 4, 'Timeline total deve ter 4 segundos (2 ociosos + 2 de execução)');
  assert.equal(result.timeline[0].runningProcessId, null, 't=0 a 1 deve ser IDLE');
  assert.equal(result.timeline[1].runningProcessId, null, 't=1 a 2 deve ser IDLE');
  assert.equal(result.timeline[2].runningProcessId, 'P1', 't=2 a 3 deve ser P1');
  assert.equal(result.timeline[3].runningProcessId, 'P1', 't=3 a 4 deve ser P1');
  console.log('✅ CPU Ociosa (Idle): OK');
}

// 11. Teste da função de despacho simulate()
{
  const inputs: ProcessInput[] = [
    { id: 'P1', order: 1, arrivalTime: 0, duration: 4, staticPriority: 1 },
    { id: 'P2', order: 2, arrivalTime: 1, duration: 2, staticPriority: 2 },
  ];

  const cfg = { quantum: 2, aging: 1 };

  const fcfsSim = simulate(inputs, cfg, 'FCFS');
  assert.equal(fcfsSim.algorithmName, 'FCFS (First Come, First Served)');

  const sjfSim = simulate(inputs, cfg, 'SJF');
  assert.equal(sjfSim.algorithmName, 'Shortest Job First (SJF)');

  const srtfSim = simulate(inputs, cfg, 'SRTF');
  assert.equal(srtfSim.algorithmName, 'Shortest Remaining Time First (SRTF)');

    const ppSim = simulate(inputs, cfg, 'PP');
  assert.equal(
    ppSim.algorithmName,
    'Prioridade com Preempção (PRIOp)'
  );

  const pnpSim = simulate(inputs, cfg, 'PNP');
  assert.equal(
    pnpSim.algorithmName,
    'Prioridade sem Preempção (PRIOc)'
  );

  const rrSim = simulate(inputs, cfg, 'RR');
  assert.equal(
    rrSim.algorithmName,
    'Round-Robin (RR)'
  );

  const rraSim = simulate(inputs, cfg, 'RRA');
  assert.equal(
    rraSim.algorithmName,
    'Round-Robin com Prioridade e Envelhecimento'
  );

  assert.throws(() => simulate(inputs, cfg, 'UNKNOWN_ALGO'), /não suportado/);

  console.log('✅ Função simulate() [FCFS, SJF, SRTF, PP, PNP, RR, RRA]: OK');
}

console.log('\n Todos os testes passaram com sucesso!');
