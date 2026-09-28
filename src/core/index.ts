import * as fs from 'node:fs';
import * as process from 'node:process';
import { parseInput, parseConfig, parseProcessInput } from './parser.ts';
import { runFCFS } from './algorithms/fcfs.ts';
import { runSJF } from './algorithms/sjf.ts';
import { runSRTF } from './algorithms/srtf.ts';
import { formatStdoutReport } from './formatter.ts';

export type * from './types.ts';
export * from './parser.ts';
export * from './tieBreaker.ts';
export * from './formatter.ts';
export * from './algorithms/fcfs.ts';
export * from './algorithms/sjf.ts';
export * from './algorithms/srtf.ts';
export * from './basic.ts';
export * from './metrics.ts';
export * from './simulate.ts';

/**
 * Lê todo o conteúdo da entrada padrão (stdin) de forma síncrona.
 */
function readStdinSync(): string {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Ponto de entrada CLI principal.
 */
function main(): void {
  const args = process.argv.slice(2);
  let rawInput = '';

  // 1. Verifica se foi passado arquivo de entrada via argumento
  if (args.length > 0 && fs.existsSync(args[0])) {
    rawInput = fs.readFileSync(args[0], 'utf-8');
  } else if (!process.stdin.isTTY) {
    // Lê de stdin redirecionado (ex: node src/index.ts < entrada.txt)
    rawInput = readStdinSync();
  }

  // Se nada foi fornecido e o terminal é interativo, usa o sample padrão para demonstração
  if (!rawInput.trim()) {
    if (fs.existsSync('samples/entrada.txt')) {
      console.log('Nenhum stdin fornecido. Carregando "samples/entrada.txt" por padrão...\n');
      rawInput = fs.readFileSync('samples/entrada.txt', 'utf-8');
    } else {
      console.error('Uso: node src/index.ts [caminho_entrada] [caminho_config_opcional]');
      console.error('Ou:  node src/index.ts < entrada.txt');
      process.exit(1);
    }
  }

  // Obtém configuração (quantum, aging) e processos a partir do próprio arquivo de entrada
  const { config, processes } = parseInput(rawInput);

  // Caso opcional: se um arquivo de config separado for passado no argumento 2, permite sobrescrever
  if (args.length > 1 && fs.existsSync(args[1])) {
    const override = parseConfig(fs.readFileSync(args[1], 'utf-8'));
    config.quantum = override.quantum;
    config.aging = override.aging;
  }

  console.log(`Configuração carregada: quantum=${config.quantum}, aging=${config.aging}`);
  console.log(`Total de processos carregados: ${processes.length}`);
  console.log('----------------------------------------------------------------\n');

  // Execução dos algoritmos
  const fcfsResult = runFCFS(processes);
  console.log(formatStdoutReport(fcfsResult));

  const sjfResult = runSJF(processes);
  console.log(formatStdoutReport(sjfResult));

  const srtfResult = runSRTF(processes);
  console.log(formatStdoutReport(srtfResult));
}

import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

// Executa se chamado diretamente via CLI (suporta caminhos com espaços no Windows)
const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedPath === currentFilePath || invokedPath.endsWith('index.ts')) {
  main();
}
