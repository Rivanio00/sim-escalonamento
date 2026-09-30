import * as fs from 'node:fs';
import * as process from 'node:process';
import { parseInput } from './parser.ts';
import { simulateAll } from './simulate.ts';
import { formatStdoutReport } from './formatter.ts';

const USAGE = `Uso:
  node src/core/cli.ts <entrada.txt> [config.txt]
  node src/core/cli.ts < entrada.txt

Sem argumentos, carrega samples/entrada.txt.`;

/** Lê o conteúdo da entrada: argumento de linha de comando, stdin redirecionado ou o sample. */
function readRawInput(args: string[]): string {
  if (args.length > 0) {
    if (!fs.existsSync(args[0])) {
      console.error(`Arquivo de entrada não encontrado: ${args[0]}\n\n${USAGE}`);
      process.exit(1);
    }
    return fs.readFileSync(args[0], 'utf-8');
  }

  if (!process.stdin.isTTY) {
    try {
      return fs.readFileSync(0, 'utf-8');
    } catch {
      /* stdin vazio: cai no sample abaixo */
    }
  }

  if (fs.existsSync('samples/entrada.txt')) {
    console.log('Nenhuma entrada fornecida. Carregando "samples/entrada.txt"...\n');
    return fs.readFileSync('samples/entrada.txt', 'utf-8');
  }

  console.error(USAGE);
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  const { config, processes } = parseInput(readRawInput(args));

  // Um arquivo de config no 2º argumento sobrescreve o quantum/aging da entrada —
  // mas só as chaves que ele realmente define, para não apagar o que a entrada trazia.
  if (args.length > 1) {
    if (!fs.existsSync(args[1])) {
      console.error(`Arquivo de configuração não encontrado: ${args[1]}\n\n${USAGE}`);
      process.exit(1);
    }
    const override = parseInput(fs.readFileSync(args[1], 'utf-8'));
    if (override.configDefined.quantum) config.quantum = override.config.quantum;
    if (override.configDefined.aging) config.aging = override.config.aging;
  }

  if (processes.length === 0) {
    console.error('Nenhum processo válido encontrado na entrada.');
    process.exit(1);
  }

  console.log(`Configuração carregada: quantum=${config.quantum}, aging=${config.aging}`);
  console.log(`Total de processos carregados: ${processes.length}`);
  console.log('-'.repeat(64) + '\n');

  for (const result of simulateAll(processes, config)) {
    console.log(formatStdoutReport(result));
  }
}

try {
  main();
} catch (erro) {
  // Erros do parser trazem o número da linha: mostra a mensagem, não o stack trace.
  console.error(erro instanceof Error ? erro.message : String(erro));
  process.exit(1);
}
