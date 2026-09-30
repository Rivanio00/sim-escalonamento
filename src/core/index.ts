/**
 * Motor de simulação de escalonamento — ponto de entrada da biblioteca.
 * Não depende de React nem de Node: pode ser usado no front e nos testes.
 *
 *   engine.ts      o laço da simulação, um segundo por iteração (compartilhado)
 *   schedulers.ts  os sete algoritmos: só o que difere entre eles
 *   tieBreaker.ts  as regras de desempate do enunciado
 *   parser.ts      texto da entrada -> { config, processes }
 *   formatter.ts   diagrama vertical e relatório de texto
 *   simulate.ts    catálogo dos algoritmos + simulate() / simulateAll()
 *
 * A CLI fica em cli.ts (`npm start`).
 */
export type * from './types.ts';
export * from './engine.ts';
export * from './schedulers.ts';
export * from './simulate.ts';
export * from './parser.ts';
export * from './tieBreaker.ts';
export * from './formatter.ts';
